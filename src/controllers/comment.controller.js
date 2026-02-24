import mongoose from "mongoose";
import { Comment } from "../models/comment.model.js";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Timestamp } from "mongodb";

const getVideoComments = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!mongoose.isValidObjectId(videoId) || !videoId) {
    throw new ApiError(400, "Invalid video Id");
  }

  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "video not found");
  }

  const comments = Comment.aggregate([
    {
      $match: {
        video: new mongoose.Types.ObjectId(videoId),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "video",
        foreignField: "_id",
        as: "videoDetails",
        pipeline: [
          {
            $lookup: {
              from: "users",
              LocalField: "owner",
              ForeignField: "_id",
              as: "ownerDetails",
              pipeline: [
                {
                  $project: {
                    fullname: 1,
                    username: 1,
                    avatar: 1,
                  },
                },
              ],
            },
          },
          {
            $addFields: {
              ownerDetails: {
                $first: "$ownerDetails",
              },
            },
          },
        ],
      },
    },
    {
      $lookup: {
        from: "users",
        LocalField: "owner",
        ForeignField: "_id",
        as: "ownerDetails",
        pipeline: [
          {
            $lookup: {
              from: "videos",
              localField: "watchHistory",
              foreignField: "_id",
              as: "watchHistoryDetails",
            },
          },
          {
            $addFields: {
              watchHistoryDetails: { $first: "$watchHistoryDetails" },
            },
          },
        ],
      },
    },
  ]);

  const { page = 1, limit = 10 } = req.query;

  const options = {
    page: parseInt(page) || 1,
    limit: parseInt(limit) || 10,
  };

  const result = await Comment.aggregatePaginate(comments, options);

  if (!result) {
    throw new ApiError(404, "Error while fetching comments ");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, result, "Comments fetched successfully"));
});

export { getVideoComments };
