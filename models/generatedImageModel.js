const mongoose = require("mongoose");

const generatedImageSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    prompt: {
      type: String,
      required: true,
    },
    revisedPrompt: {
      type: String,
    },
    imageUrl: {
      type: String,
      required: true,
    },
    model: {
      type: String,
      default: "dall-e-3",
    },
    size: {
      type: String,
    },
    likesCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true }
);

generatedImageSchema.index({ likesCount: -1, createdAt: -1 });

module.exports = mongoose.model("GeneratedImage", generatedImageSchema);
