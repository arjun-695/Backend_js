import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
// method to generate access token and refresh token everytime it is called
const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    // access Token is given to user and
    // refresh Token is also saved on DataBase so that the user does not have to enter the password again and again
    user.refreshToken = refreshToken; // sending refresh token on DB
    await user.save({ validateBeforeSave: false }); // saving
    //"validateBeforeSave: false" : everytime we save password also needs to be there but here we don't have password so we are using this method

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating refresh and access token"
    );
  }
};

const registerUser = asyncHandler(async (req, res) => {
  // TO-Do's
  // get user details from frontend
  // validation - not empty
  // check if user already exists : username , email
  // check for images, check for avatar
  // upload them on cloudinary, avatar
  // create user object - create entry in db
  // remove password and refresh token field from response
  //check for user creation
  // return res

  //getting user Details
  const { fullname, email, username, password } = req.body;
  console.log("email: ", email);
  console.log("fullname: ", fullname);

  // validation

  // if(fullname == "")
  // {
  //     throw new ApiError(400,"fullname is required")
  // }

  if (
    [fullname, email, username, password].some(
      (field) => !field || field?.trim() === ""
    )
  ) {
    throw new ApiError(400, "All fields are required");
  }

  // checking if already exist

  const existedUser = await User.findOne({
    $or: [{ username }, { email }], // $or is operator checking if *either* of the object :- "username" or "email" already exists whereas find one is used to find if the object we are checking already exists or not
  });
  if (existedUser) {
    throw new ApiError(409, "user with email or username already exist");
  }

  // avatar Check

  // getting avatar local path
  const avatarLocalPath = req.files?.avatar[0]?.path; // (LocalPath because it is on server and has not been uploaded to cloudinary still)

  // getting image local path
  // const coverImageLocalPath = req.files?.coverImage[0]?.path; this still gives error or is not the optimal way since we are assuming that the coverImage array is always there and we are also not checking it later on in the code. The better way to use this is:

  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }
  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required");
  }

  // uploading on cloudinary

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  // checking if avatar is uploaded or not because it is a required field and if not then the database will be down
  if (!avatar) {
    throw new ApiError(400, "Avatar file is required");
  }

  //creating user object and entry in DB
  //User is the only one talking to the database so using it to upload on the database
  const user = await User.create({
    fullname,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase(),
  });
  //making sure that the user is created and is not empty
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken" // removing passwords and userTokens
  );
  //checking for user creation
  if (!createdUser) {
    throw new ApiError(500, "Something went wrong by registering the user");
  }

  //apiresponse
  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User registered Successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  // TO_DO's
  // req body -> data
  // username or email based login
  // find the user
  // password check
  // access and refresh token
  // send cookie

  // getting username email and password of the user to check
  const { email, username, password } = req.body;
  if (!(username || email)) {
    //either username or email
    throw new ApiError(400, "username or email is required");
  }

  // checking for both either email or username to be found
  const user = await User.findOne({
    $or: [{ username }, { email }],
  });

  // if user not found:
  if (!user) {
    throw new ApiError(404, "User does not exit");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid User Credentials");
  }
  // if password is correct make access token and refresh token for the user (we'll do this so often that it is better to make a method for it)

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id
  ); //this accessToken and refreshToken is used at the time of logout "auth.middleware.jwt" which compares if the user has the right tokens as his DB. if yes then we will add a new object to req.body as used in line 131

  //sending cookies
  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken" // separated by space and not comma
  ); //optional step

  const options = {
    httpOnly: true,
    secure: true,
  }; //cookies only editable at server when "secure:true and httpOnly:true"

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken, // why here again when accessToken and refreshToken set in cookies already? Maybe the user wants to save them locally or himself (Data field)
        },
        "User logged in Successfully" //Message
      )
    );
});

//logout:
const logoutUser = asyncHandler(async (req, res) => {
  // we don't have details to know which user to logout like we had email/username at the time of logging in
  // so here we have to use the concept of middleware
  // we will create our own middle ware for logging out
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: {
        refreshToken: 1,// removes the field from the document 
      },
    },
    {
      new: true,
    }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };
  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged Out Successfully"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingrefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;
  //refreshToken needed to reset the Access Token
  if (!incomingrefreshToken) {
    throw new ApiError(401, "unauthorized request");
  }
  // now if we are getting a refresh Token we have to validate it too

  try {
    const decodedToken = jwt.verify(
      incomingrefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken?._id); // while creating refreshToken we included the id of the user using this refresh token we can get the id using which we can use mongoose to get the information about the user

    if (!user) {
      throw new ApiError(401, "Invalid Refresh Token");
    }

    if (incomingrefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh Token is expired or used");
    }

    const options = {
      httpOnly: true,
      secure: true,
    };

    const { accessToken, refreshToken } =
      await generateAccessAndRefreshToken(user._id);

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: refreshToken },
          "Access Token Refreshed"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid Refresh Token");
  }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  const user = await User.findById(req.user?._id); //extracting user details; User is able to change the password that means he is already logged in; Middleware comes into picture when user is logged in since it adds user details to req; Using this req we can get user details
  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

  if (!isPasswordCorrect) {
    throw new ApiError(400, "Invalid old Password");
  }

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed Successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "Current User fetched Successfully"));
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullname, email } = req.body;

  if (!fullname || !email) {
    throw new ApiError(400, "Both the fields are required");
  }
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        fullname: fullname,
        email: email,
      },
    },
    { new: true } //update hone ke baad jo information hoti hai wo bhi return karta hai
  ).select("-password"); // exclude password

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Account Details updated successfully"));
});

const updateUserAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is missing");
  }
  //TODO delete this avatar after update 
  const avatar = await uploadOnCloudinary(avatarLocalPath);

  if (!avatar?.url) {
    throw new ApiError(400, "Error while uploading an avatar");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: avatar.url,
      },
    },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Avatar Updated Successfully"));
});
const updateUserCoverImage = asyncHandler(async (req, res) => {
  const coverImageLocalPath = req.file?.path;

  if (!coverImageLocalPath) {
    throw new ApiError(400, "Cover Image file is missing");
  }

  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!coverImage.url) {
    throw new ApiError(400, "Error while uplaoding an Image");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        coverImage: coverImage.url,
      },
    },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Cover Image Updated Successfully"));
});

const getUserChannelProfile = asyncHandler(async(req,res) => {
  const { username } = req.params //when taking from params take care of it in router
  // params: /c/:username  take care of semicolon imp;taking "username" in routes is necessary cannot be changed 

  if(!username?.trim()){
    throw new ApiError(400, "username is missing")
  }

  const channel = await User.aggregate([
    {
      $match: {
        username: username?.toLowerCase()
      }
    },
    {
      $lookup:{ // retrieving value for number of subscribers 
        from: "subscriptions",
        localField:"_id",
        foreignField: "channel",
        as: "subscribers",
      }
    },
    {
      $lookup: { // retrieving value for number of people the channel has subscribed to  
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as:"subscribed"
      }
    },
    {
      $addFields: { // for total counts of fields 
        subscribersCount:{
          $size: "$subscribers" //'$' because now it is a field
        },
        channelIsSubscribedToCount:{
          $size: "$subscribed"
        },
        isSubscribed: {
          $cond:{
            if: {$in: [req.user?._id,"$subscribers.subscriber"]},
            then: true,
            else: false
          }
        }
      }
    },
    {
      $project:{ // fields that we want to send 
        fullname:1,
        username:1,
        subscribersCount: 1,
        channelIsSubscribedToCount: 1,
        isSubscribed:1,
        avatar: 1,
        coverImage: 1,
        email: 1
      }
    }
  ])

  if (!channel?.length) {
    throw new ApiError(404,"channel does not exist")
  }

  return res.status(200)
  .json(
    new ApiResponse(200, channel[0], "User Channel fetched successfully")
  )


})

const getWatchHistory = asyncHandler(async(req,res)=> {
  const user = await User.aggregate([
    {
      $match:{
        _id : new mongoose.Types.ObjectId(req.user._id)// to get entire mongoose objectId as it only returns the string when we runs this statement 'req.user._id' which is handled in the backend by mongoose for rest of the code but for aggregation  pipelines the code runs directly and is not handled by mongoose so we have to do this step to get the user id 
      }
      
    },
    {
      $lookup:{
        from : "videos",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory",
        pipeline:[
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    fullName: 1,
                    username: 1,
                    avatar: 1
                  }
                }
              ]
            }
          },
          {
            $addFields: {
              owner:{
                $first: "$owner"//to convert the owner array to object.Gets the first element of the array -Frontend guy will get appreciate it.
              }
            }
          }
        ]
      }
    }
  ])
  return res.status(200)
  .json(
    new ApiResponse(
    200,
    user[0].watchHistory,
    "Watch history fetched successfully"
  ))
})

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
  getUserChannelProfile,
  getWatchHistory
};
