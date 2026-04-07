import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const commentSentimentSchema = new Schema(
  {
    label: {
      type: String,
      enum: ["positive", "neutral", "negative"],
      default: "neutral",
    },
    score: {
      type: Number,
      default: 0,
    },
    confidence: {
      type: Number,
      default: 0,
    },
    positiveTerms: [
      {
        type: String,
        trim: true,
      },
    ],
    negativeTerms: [
      {
        type: String,
        trim: true,
      },
    ],
    analyzedAt: {
      type: Date,
      default: null,
    },
  },
  {
    _id: false,
  }
);

const commentSchema = new Schema(
  {
    content: {
      type: String,
      required: true,
      trim: true,
    },
    video: {
      type: Schema.Types.ObjectId,
      ref: "Video",
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    sentiment: {
      type: commentSentimentSchema,
      default: () => ({}),
    },
  },
  {
    timestamps: true,
  }
);

commentSchema.plugin(mongooseAggregatePaginate);

export const Comment = mongoose.model("Comment", commentSchema);
