import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const userId = req.user?._id;

  if (isValidObjectId(videoId) === false) {
    throw new ApiError(400, "Invalid Video Id");
  }

  const existingLike = await Like.findOne({
    video: videoId,
    likedBy: userId,
  });

  existingLike? await Like.findByIdAndDelete(existingLike?._id): await Like.create({
    video: videoId,
    likedBy: userId
  })

  return res
  .status(200)
  .json(new ApiResponse(200, {isLiked: existingLike? false: true}, existingLike? "Removed video liked": "Liked Video"))
});


const toggleCommentLike = asyncHandler(async(req,res) => {
    const { commentId } = req.params;
  const userId = req.user?._id;

  if (isValidObjectId(commentId) === false) {
    throw new ApiError(400, "Invalid Comment Id");
  }

  const existingLike = await Like.findOne({
    comment: commentId,
    likedBy: userId,
  });

  existingLike? await Like.findByIdAndDelete(existingLike?._id): await Like.create({
    comment: commentId,
    likedBy: userId
  })

  return res
  .status(200)
  .json(new ApiResponse(200, {isLiked: existingLike? false: true}, existingLike? "Removed Comment like": "Liked Comment"))
})

const getLikedVideos = asyncHandler(async(req,res) => {
    const userId = req.user?._id

    const getAllLikedVideos = await Like.aggregate([
        {
            $match: {
                likedBy: new mongoose.Types.ObjectId(userId),
                video: {$exists: true} //like model can have likes for both comments and videos but it is not necessary if we have liked a comment then the video is also liked and vice versa w/o this operator it would fetch like document for both resulting in error as no video/comment is associated with that like document    
            }
        },
        {
            $lookup:{
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as:"videoDetails",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "ownerDetails"
                        }
                    },
                    {
                        $project: {
                            refreshToken: 0,
                            password: 0,
                            createdAt: 0,
                            updatedAt: 0,
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                "videoDetails": {$arrayElementsAt: ["$videoDetails",0]}
            }
        }
    ])


     return res
    .status(200)
    .json( new ApiResponse(200, {likedVideos: getAllLikedVideos}, "Fetched liked videos"))  
})

export {
    toggleCommentLike,
    toggleVideoLike,
    getLikedVideos
}
