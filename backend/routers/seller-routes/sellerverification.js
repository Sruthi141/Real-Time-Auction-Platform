const express = require("express");
const SellerVerificationController = require("../../controllers/seller/verifyemail");
const { logSellerActions } = require("../../middleware/Seller");

const router = express.Router();

// Verify OTP
router.post("/otp", logSellerActions, SellerVerificationController.verifyOTP);

// Resend OTP
router.post("/resend-otp", logSellerActions, SellerVerificationController.resendOTP);

// Verify seller email by ID (legacy)
router.get("/:id", logSellerActions, SellerVerificationController.verifyEmail);

module.exports = router;
