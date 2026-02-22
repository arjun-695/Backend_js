import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model";
import { User } from "../models/user.model";
import { ApiError } from "../utils/apiError";
import { ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { uploadOnCloudinary } from "../utils/cloudinary";

const getAllVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query; // search filters

  const pipeline = [];
  const defaultCriteria = {
    isPublished: true,
  };

  //if user searches smth
  if (query) {
    defaultCriteria.$or = [
      { title: { $regex: query, $options: "i" } }, //$regex -> search result based on what you typed or entered
      // $options: "i" -> makes the search case insensitive
      { description: { $regex: query, $options: "i" } },
    ];
  }

  // if user visits a specific profile:
  if (userId) {
    if (!mongoose.isValidObjectId(userId)) {
      throw new ApiError(400, "Invalid User");
    }
    defaultCriteria.owner = new mongoose.Types.ObjectId(userId); // scale down to videos only uploaded by that user
    if (req.user && req.user._id.toString() === userId) {
      delete defaultCriteria.isPublished;
    } // drafted videos// By deleting the property entirely, it fetches BOTH true and false (published and unpublished)
  }

  //push the complete criteria as the first stage
  pipeline.push({
    $match: defaultCriteria,
  });

  //if user sorts by some type of filter: (most liked,4k , Hd,etc)
  if (sortBy) {
    sortField[sortBy] = sortType === "asc" ? 1 : -1;
  } else {
    sortField["createdAt"] = sortType === "asc" ? 1 : -1;
  }

  pipeline.push({
    $sort: sortField,
  });

  pipeline.push(
    {
      $lookup: {
        from: "users", //from users schema
        localField: "owner",
        foreignField: "_id",
        as: "owner",
        pipeline: [
          {
            $project: {
              avatar: 1,
              username: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        owner: {
          $first: "$owner" /* $first picks the specific object needed.*/,
        },
      },
    }
  );
  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
  }; //sends settings in the URL (e.g., ?page=2&limit=10).

  const paginatedVideos = await Video.aggregatePaginate(
    Video.aggregate(pipeline),
    options
  );

  if (!paginatedVideos) {
    throw new ApiError(500, "Error while fetching videos, Please try again");
  }
});

const publishVideo = asyncHandler(async (req, res) => {
  if (!req.user?._id) {
    throw new ApiError(400, "Please login and try again");
  }

  const { title, description } = req.body;

  if ([title, description].some((field) => field?.trim() === "")) {
    throw new ApiError(400, "All fields are required.");
  }

  const videoFileLocalPath = req.files?.videoFile?.[0]?.path;
  const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path;

  if (!videoFileLocalPath || !thumbnailLocalPath) {
    throw new ApiError(400, " Video or Thumbnail is missing");
  }

  const videoFile = await uploadOnCloudinary(videoFileLocalPath);
  const thumbnailFile = await uploadOnCloudinary(thumbnailLocalPath);

  if (!videoFile?.url || !thumbnailFile?.url) {
    throw new ApiError(500, "Upload failed; Please try again");
  }

  // to catch ghost files:
  // and pushing file to database after uploading to cloudinary
  try {
    const uploadVideo = await Video.create({
      videoFile: {
        url: videoFile.url,
        public_id: videoFile.public_id, //public_id for future deletion
      },
      thumbnail: {
        url: thumbnailFile.url,
        public_id: thumbnailFile.public_id,
      },

      owner: req.user?._id, // video -> loggedin user
      title: title.trim(),
      description: description.trim(),
      duration: videoFile.duration, // getting duration from cloudinary directly
      views: 0,
      isPublished: true,
    });
    // if create fails mongoose send a null or false value then and there so no need to check !uploadVideo it'll be handled by catch block

    return res
      .status(200)
      .json(new ApiResponse(200, uploadVideo, "Successfully uploaded Video"));
  } catch (error) {
    //removing from cloudinary as the create block failed to upload the files to db
    if (videoFile?.public_id) {
      await deleteFromCloudinary(videoFile.public_id, "video");
    }

    if (thumbnailFile?.public_id) {
      await deleteFromCloudinary(thumbnailFile.public_id, "image");
    }

    throw error;
  }
});

export { getAllVideos,
    publishVideo
 };
