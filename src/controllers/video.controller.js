import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { deleteFromCloudinary } from "../utils/deleteFromCloudinary.js";
import { deleteFromCache } from "../utils/redis.js";

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
  const sortField = {};
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

  return res
    .status(200)
    .json(new ApiResponse(200, paginatedVideos, "Videos fetched successfully"));
});

const publishVideo = asyncHandler(async (req, res) => {
  if (!req.user?._id) {
    throw new ApiError(400, "Please login and try again");
  }

  const { title, description } = req.body;

  if (!title?.trim() || !description?.trim()) {
    throw new ApiError(400, "Title and description are required.");
  }

  const videoFileLocalPath = req.files?.videoFile?.[0]?.path;
  const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path;

  if (!videoFileLocalPath || !thumbnailLocalPath) {
    throw new ApiError(400, " Video or Thumbnail is missing");
  }

  let videoFile;
  let thumbnailFile;

  // to catch ghost files:
  // and pushing file to database after uploading to cloudinary
  try {
    videoFile = await uploadOnCloudinary(videoFileLocalPath);
    thumbnailFile = await uploadOnCloudinary(thumbnailLocalPath);
    if (!videoFile?.url || !thumbnailFile?.url) {
      throw new ApiError(500, "Upload failed; Please try again");
    }
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
    await deleteFromCache(`cache:/api/v1/videos`);
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

const getVideoId = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid Video ID format");
  }

  if (req.user?._id) {
    await Video.findByIdAndUpdate(videoId, { $inc: { views: 1 } }); // updating the view Count
  }

  const getVideoWithDetails = await Video.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(videoId),
      },
    },
    // Comments
    {
      $lookup: {
        from: "comments",
        localField: "_id",
        foreignField: "video",
        as: "comments",
        pipeline: [
          {
            $sort: { createdAt: -1 },
          },
          {
            $limit: 10,
          },
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "CommentOwnerDetails",
              pipeline: [
                {
                  $project: {
                    username: 1,
                    avatar: 1,
                  },
                },
              ],
            },
          },
          {
            $addFields: {
              CommentOwnerDetails: { $first: "$CommentOwnerDetails" },
            },
          },
        ],
      },
    },
    // Likes
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "video",
        as: "likes",
      },
    },
    {
      // owner
      $lookup: {
        from: "users",
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
          {
            //subscribers of owners
            $lookup: {
              from: "subscriptions",
              localField: "_id",
              foreignField: "channel",
              as: "subscribers",
            },
          },
          {
            $addFields: {
              subscribersCount: {
                $size: "$subscribers",
              },
              isSubscribed: {
                $cond: {
                  if: {
                    $in: [
                      new mongoose.Types.ObjectId(req.user?._id),
                      "$subscribers.subscriber",
                    ],
                  },
                  then: true,
                  else: false,
                },
              },
            },
          },
          {
            $project: {
              username: 1,
              avatar: 1,
              subscribersCount: 1,
              isSubscribed: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        totalLikes: { $size: "$likes" },
        isLiked: {
          $cond: {
            if: {
              $in: [
                new mongoose.Types.ObjectId(req.user?._id),
                "$likes.likedBy",
              ],
            },
            then: true,
            else: false,
          },
        },
        owner: { $first: "$owner" },
      },
    },
  ]);

  if (getVideoWithDetails.length === 0) {
    throw new ApiError(404, "Video doesn't exists sorry");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        getVideoWithDetails[0],
        "successfully fetched video detials"
      )
    );
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { title, description } = req.body;
  const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path || req.file?.path;

  if (!title && !description && !thumbnailLocalPath) {
    throw new ApiError(400, "Required at least one field to update");
  }

  const video = await Video.findOne({
    _id: videoId,
    owner: req.user?._id,
  });

  if (!video) {
    throw new ApiError(
      404,
      "Video not found or you are not authorized to edit the vide"
    );
  }

  if (title) {
    video.title = title.trim();
  }

  if (description) video.description = description.trim();

  if (thumbnailLocalPath) {
    const thumbnailFile = await uploadOnCloudinary(thumbnailLocalPath);

    if (!thumbnailFile?.url) {
      throw new ApiError(500, "Failed to upload new thumbnail");
    }

    if (video.thumbnail?.public_id) {
      await deleteFromCloudinary(video.thumbnail.public_id, "image");
    }

    video.thumbnail = {
      url: thumbnailFile.url,
      public_id: thumbnailFile.public_id,
    };
  }

  const updatedVideo = await video.save({ validateBeforeSave: false });

  if (!updatedVideo) {
    throw new ApiError(
      404,
      "Video not found or you are not authorized to update this video"
    );
  }

  await deleteFromCache(`cache:/api/v1/videos`);

  return res
    .status(200)
    .json(
      new ApiResponse(200, updatedVideo, "Successfully updated video details")
    );
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const userId = req.user?._id;

  // Validate the videoId
  if (!mongoose.Types.ObjectId.isValid(videoId)) {
    throw new ApiError(400, "Invalid Video ID format");
  }

  const toggleStatus = await Video.findOneAndUpdate(
    {
      _id: videoId,
      owner: userId,
    },
    [
      {
        $set: {
          // Toggles the current boolean value
          isPublished: { $not: "$isPublished" },
        },
      },
    ],
    {
      new: true, // Returns the updated document instead of the old one
    }
  );
  if (!toggleStatus) {
    throw new ApiError(
      404,
      "Video not found or you are not authorized to update this video"
    );
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, toggleStatus, "Successfully toggled publish status")
    );
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const userId = req.user?._id;

  if (!mongoose.Types.ObjectId.isValid(videoId)) {
    throw new ApiError(400, "Invalid Video ID format");
  }

  //deleting from db
  const video = await Video.findOneAndDelete({
    // returns the details of the video deleted
    _id: videoId,
    owner: userId,
  });

  if (!video) {
    throw new ApiError(
      404,
      "Video not found or you are not authorized to delete this video"
    );
  }
  if (video.videoFile?.public_id) {
    await deleteFromCloudinary(video.videoFile.public_id, "video");
  }
  if (video.thumbnail?.public_id) {
    await deleteFromCloudinary(video.thumbnail.public_id, "image");
  }
    await deleteFromCache(`cache:/api/v1/videos/${videoId}`) //specific video cache 

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Successfully deleted Video"));
});
export {
  getAllVideos,
  publishVideo,
  getVideoId,
  updateVideo,
  togglePublishStatus,
  deleteVideo,
};
