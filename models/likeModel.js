const mongoose = require("mongoose");

const likeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    imageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GeneratedImage",
      required: true,
    },
  },
  { timestamps: true }
);

likeSchema.index({ userId: 1, imageId: 1 }, { unique: true });
likeSchema.index({ imageId: 1 });

module.exports = mongoose.model("ImageLike", likeSchema);
