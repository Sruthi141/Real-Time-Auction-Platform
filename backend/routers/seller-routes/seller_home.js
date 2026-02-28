const express = require("express");
const SellerHomeController = require("../../controllers/seller/seller_home");
const { logSellerActions } = require("../../middleware/Seller");

const router = express.Router();

router.get("/:id", logSellerActions, SellerHomeController.renderSellerHome);

module.exports = router;