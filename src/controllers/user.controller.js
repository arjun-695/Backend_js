import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser = asyncHandler(async (req, res) => {
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
  // const coverImageLocalPath = req.files?.coverImage[0]?.path; this still gives error or is not the opimal way since we are assuming that the coverImage array is always there and we are also not checking it later on in the code. The better way to use this is:

  let coverImageLocalPath;
  if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
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

export { registerUser };
