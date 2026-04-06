const express = require("express");
const { verifyToken, optionalVerifyToken } = require("../middlewares");
const {
  handleGenerateImage,
  handleGuestGenerateImage,
  handleStorePromptImage,
  handleYourGenerations,
  handleListMyImages,
  handleTrending,
  handleToggleLike,
} = require("../controllers/imageController");

const router = express.Router();

router.get("/trending", optionalVerifyToken, handleTrending);

router.post("/guest-generate", handleGuestGenerateImage);

router.post("/generate", verifyToken, handleGenerateImage);
router.post("/entries", verifyToken, handleStorePromptImage);
router.get("/your-generations", verifyToken, handleYourGenerations);
router.get("/mine", verifyToken, handleListMyImages);
router.post("/:id/like", verifyToken, handleToggleLike);

module.exports = router;
