const express = require("express");
const SellerVerificationController = require("../../controllers/seller/verifyemail");
const { logSellerActions } = require("../../middleware/Seller");

const router = express.Router();

// Verify seller email
router.get("/:id", logSellerActions, SellerVerificationController.verifyEmail);

module.exports = router;