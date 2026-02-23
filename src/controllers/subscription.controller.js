import mongoose, { isValidObjectId } from "mongoose";
import { Subscription } from "../models/subscription.model.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  const subscriberId = req.user?._id;

  if (!subscriberId) {
    throw new ApiError(400, "Please login to continue");
  }

  if (channelId.toString() === subscriberId.toString()) {
    throw new ApiError(400, "can't self subscribe");
  }

  const isSubscribed = await Subscription.findOne({
    $and: [
      {
        subscriber: new mongoose.Types.ObjectId(subscriberId),
      },
      {
        channel: new mongoose.Types.ObjectId(channelId),
      },
    ],
  });

  if (isSubscribed) {
    await Subscription.findByIdAndDelete(isSubscribed?._id);

    return res
      .status(200)
      .json(
        new ApiResponse(200, { subscribed: false }, "Unsubscribed successfully")
      );
  }

  if (!isSubscribed) {
    const newSubscription = await Subscription.create({
      subscriber: subscriberId,
      channel: channelId,
    });

    if (!newSubscription) {
      throw new ApiError(500, "failed to Subscribe. Please try again");
    }

    return res
      .status(200)
      .json(
        new ApiResponse(200, { subscribed: true }, "Successfully Subscribed ")
      );
  }
});
// subscriber list
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  const { page = 1, limit = 10 } = req.query;
  const subscriberList = Subscription.aggregate([
    {
      $match: { channel: new mongoose.Types.ObjectId(channelId) },
    },
    {
      $lookup: {
        from: "users",
        localField: "subscriber",
        foreignField: "_id",
        as: "userDetails",
        pipeline: [
          {
            $project: {
              username: 1,
              email: 1,
              avatar: 1,
            },
          },
        ],
      },
    },
    { $unwind: "$userDetails" },
    {
      $project: {
        _id: 0, //excluding id's bcz the frontend don't need it
        channelId: "$userDetails._id",
        fullname: "$userDetails.fullname",
        username: "$userDetails.username",
        avatar: "$userDetails.avatar",
        subscribedAt: "$createdAt",
      },
    },
    {
      $sort: {
        subscribedAt: -1,
      },
    },
  ]);

  const option = {
    page: parseInt(page),
    limit: parseInt(limit),
  };

  const result = await Subscription.aggregatePaginate(subscriberList, option);

  return res
    .status(200)
    .json(new ApiResponse(200, result, "Successfully fetched subscriber list"));
});

const getSubscribedChannels = asyncHandler(async (req, res) => {
  const { subscriberId } = req.params;
  const { limit = 10, page = 1 } = req.query;

  const subscribedChannel = Subscription.aggregate([
    {
      $match: {
        subscriber: new mongoose.Types.ObjectId(subscriberId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "channel",
        foreignField: "_id",
        as: "subscribedUserDetails",
        pipeline: [
          {
            $project: {
              fullname: 1,
              avatar: 1,
              username: 1,
            },
          },
        ],
      },
    },
    {
      $unwind: "$subscribedUserDetails",
    },
    {
      //flatening the output for a cleaner API response
      $project: {
        _id: 0,
        channelId: "$subscribedUserDetails._id",
        fullName: "$subscribedUserDetails.fullname",
        username: "$subscribedUserDetails.username",
        avatar: "$subscribedUserDetails.avatar",
        subscribedAt: "$createdAt",
      },
    },
    {
      $sort: { subscribedAt: -1 },
    },
  ]);
  const options = {
    limit: parseInt(limit),
    page: parseInt(page),
  };

  const paginatedSubscribedList = await Subscription.aggregatePaginate(
    subscribedChannel,
    options
  );

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        paginatedSubscribedList,
        "Successfully fetched subscribed channels"
      )
    );
});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
