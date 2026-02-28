const express = require("express");
const multer = require("multer");
const AuctionController = require("../../controllers/seller/create_auction");
const { logSellerActions } = require("../../middleware/Seller");
const { storage } = require("./storage");
const cloudinary = require("cloudinary").v2;

const router = express.Router();

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

const upload = multer({ storage });

router.post(
  "/:seller",
  logSellerActions,
  upload.single("image"),
  AuctionController.createAuctionPost
);

module.exports = router;