const express = require('express');
const UserVerificationController = require('../../controllers/user/verifyemail');
const { loguserActions, userErrorMiddleware } = require('../../middleware/User');

const router = express.Router();

// Route for verifying OTP
router.post("/otp", loguserActions, userErrorMiddleware, UserVerificationController.verifyOTP);

// Route for resending OTP
router.post("/resend-otp", loguserActions, userErrorMiddleware, UserVerificationController.resendOTP);

// Route for verifying the user based on the email ID passed in the request params (legacy)
router.get("/:id", loguserActions, userErrorMiddleware, (req, res) => {
    UserVerificationController.verifyEmail(req, res);
});

module.exports = router;
