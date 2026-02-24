import mongoose from "mongoose";
import { Comment } from "../models/comment.model.js";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

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
        from: "users",
        localField: "owner",
        foreignField: "_id",
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
    {
      $sort: { createdAt: -1 }, // Show newest comments first!
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

const addComment = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { _id } = req.user;
  const { content } = req.body;

  if (!content || content.trim() == "") {
    throw new ApiError("400", "Comment cannot be empty");
  }

  const comment = await Comment.create({
    content: content,
    video: videoId,
    owner: _id,
  });

  if (!comment) {
    throw new ApiError(500, "Error while adding comment");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, comment, "Comment added successfully"));
});

const updateComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const { _id } = req.user;
  const { newContent } = req.body;

  if (!mongoose.isValidObjectId(commentId) || !commentId) {
    throw new ApiError(400, "Invalid comment Id");
  }

  if (!newContent || newContent.trim() === "") {
    throw new ApiError(400, "Comment content cannot be empty");
  }

  const existingComment = await Comment.findById(commentId);

  if (!existingComment) {
    throw new ApiError(404, "Comment doesn't exists.");
  }

  if (existingComment?.owner.toString() !== _id.toString()) {
    throw new ApiError(403, " You are not authorized to update this comment");
  }

  const updatedcomment = await Comment.findByIdAndUpdate(
    commentId,
    { content: newContent },
    { new: true }
  );

  if (!updatedcomment) {
    throw new ApiError(
      500,
      "Something went wrong while updating comment, Please try again later"
    );
  }

  return res
    .status(200)
    .json(new ApiResponse(200, updatedcomment, "Comment updated successfully"));
});

const deleteComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;

  if (!mongoose.isValidObjectId(commentId) || !commentId) {
    throw new ApiError(400, "Invalid comment Id");
  }

  const commentToDelete = await Comment.findById(commentId);

  if (!commentToDelete) {
    throw new ApiError(404, "Comment not found");
  }

  if (commentToDelete?.owner.toString() !== req.user?._id.toString()) {
    throw new ApiError(403, "You are not authorized to delete this comment");
  }

  const deletedComment = await Comment.findOneAndDelete({
    _id: commentId,
    owner: req.user?._id,
  });

  if (!deletedComment) {
    throw new ApiError(500, "Error while deleting comment, Please try again");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Comment deleted Successfully"));
});

export { getVideoComments, addComment, updateComment, deleteComment };
