import mongoose from "mongoose";
import { Comment } from "../models/comment.model.js";
import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { deleteFromCache } from "../utils/redis.js";
import {
  analyzeCommentSentiment,
  buildCommentSentimentOverview,
} from "../utils/commentSentiment.js";

const hasAnalyzedSentiment = (sentiment) =>
  Boolean(sentiment?.analyzedAt && sentiment?.label);

const backfillMissingCommentSentiments = async (videoId) => {
  const commentsMissingSentiment = await Comment.find({
    video: videoId,
    $or: [
      {
        sentiment: {
          $exists: false,
        },
      },
      {
        "sentiment.analyzedAt": {
          $exists: false,
        },
      },
    ],
  }).select("_id content");

  if (commentsMissingSentiment.length === 0) {
    return;
  }

  await Comment.bulkWrite(
    commentsMissingSentiment.map((comment) => ({
      updateOne: {
        filter: { _id: comment._id },
        update: {
          $set: {
            sentiment: analyzeCommentSentiment(comment.content),
          },
        },
      },
    }))
  );
};

const getVideoComments = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!mongoose.isValidObjectId(videoId) || !videoId) {
    throw new ApiError(400, "Invalid video Id");
  }

  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "video not found");
  }

  await backfillMissingCommentSentiments(videoId);

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
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "comment",
        as: "likes",
      },
    },
    {
      $addFields: {
        ownerDetails: {
          $first: "$ownerDetails",
        },
        likesCount: {
          $size: "$likes",
        },
      },
    },
    {
      $project: {
        likes: 0,
      },
    },
    {
      $sort: { createdAt: -1 },
    },
  ]);

  const { page = 1, limit = 10 } = req.query;

  const options = {
    page: parseInt(page, 10) || 1,
    limit: parseInt(limit, 10) || 10,
  };

  const result = await Comment.aggregatePaginate(comments, options);

  if (!result) {
    throw new ApiError(404, "Error while fetching comments ");
  }

  const commentsForOverview = await Comment.find({ video: videoId })
    .populate("owner", "fullname username avatar")
    .sort({ createdAt: -1 })
    .lean();

  const normalizedCommentsForOverview = commentsForOverview.map((comment) => ({
    ...comment,
    sentiment: hasAnalyzedSentiment(comment.sentiment)
      ? comment.sentiment
      : analyzeCommentSentiment(comment.content),
  }));

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        ...result,
        sentimentOverview: buildCommentSentimentOverview(
          normalizedCommentsForOverview
        ),
      },
      "Comments fetched successfully"
    )
  );
});

const addComment = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { _id } = req.user;
  const { content } = req.body;

  if (!content || content.trim() === "") {
    throw new ApiError(400, "Comment cannot be empty");
  }

  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "video not found");
  }

  const trimmedContent = content.trim();

  const comment = await Comment.create({
    content: trimmedContent,
    video: videoId,
    owner: _id,
    sentiment: analyzeCommentSentiment(trimmedContent),
  });

  if (!comment) {
    throw new ApiError(500, "Error while adding comment");
  }

  await deleteFromCache(`cache:/api/v1/comments/${videoId}`);

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

  if (existingComment.owner.toString() !== _id.toString()) {
    throw new ApiError(403, " You are not authorized to update this comment");
  }

  const trimmedContent = newContent.trim();

  const updatedComment = await Comment.findByIdAndUpdate(
    commentId,
    {
      content: trimmedContent,
      sentiment: analyzeCommentSentiment(trimmedContent),
    },
    { new: true }
  );

  if (!updatedComment) {
    throw new ApiError(
      500,
      "Something went wrong while updating comment, Please try again later"
    );
  }

  const videoId = existingComment.video.toString();
  await deleteFromCache(`cache:/api/v1/comments/${videoId}`);

  return res
    .status(200)
    .json(new ApiResponse(200, updatedComment, "Comment updated successfully"));
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

  if (commentToDelete.owner.toString() !== req.user?._id.toString()) {
    throw new ApiError(403, "You are not authorized to delete this comment");
  }

  const deletedComment = await Comment.findOneAndDelete({
    _id: commentId,
    owner: req.user?._id,
  });

  if (!deletedComment) {
    throw new ApiError(500, "Error while deleting comment, Please try again");
  }

  const videoId = commentToDelete.video.toString();
  await deleteFromCache(`cache:/api/v1/comments/${videoId}`);

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Comment deleted Successfully"));
});

export { getVideoComments, addComment, updateComment, deleteComment };
