import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const videoSummarySchema = new Schema(
  {
    short: {
      type: String,
      trim: true,
      default: "",
    },
    detailed: {
      type: String,
      trim: true,
      default: "",
    },
    keyTakeaways: [
      {
        type: String,
        trim: true,
      },
    ],
    keywords: [
      {
        type: String,
        trim: true,
      },
    ],
    sourceType: {
      type: String,
      enum: ["transcript", "description", "title", "empty"],
      default: "empty",
    },
    generatedAt: {
      type: Date,
      default: null,
    },
  },
  {
    _id: false,
  }
);

const videoSchema = new Schema(
  {
    videoFile: {
      url: {
        type: String,
        required: true,
      },
      public_id: {
        type: String,
        required: true,
      },
    },
    thumbnail: {
      url: {
        type: String,
        required: true,
      },
      public_id: {
        type: String,
        required: true,
      },
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    transcript: {
      type: String,
      trim: true,
      default: "",
    },
    summary: {
      type: videoSummarySchema,
      default: () => ({}),
    },
    duration: {
      type: Number,
      required: true,
    },
    views: {
      type: Number,
      required: true,
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

videoSchema.plugin(mongooseAggregatePaginate);

export const Video = mongoose.model("Video", videoSchema);
