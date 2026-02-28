const unverified_users = require('../../models/unverifiedusers_model');
const users = require('../../models/usermodel');
const getRedisClient = require('../../redis');

// Verify OTP for user registration
async function verifyOTP(req, res) {
    const { email, otp } = req.body;
    
    try {
        const unverifiedUser = await unverified_users.findOne({ email });
        
        if (!unverifiedUser) {
            return res.status(404).send({ message: "User not found or already verified" });
        }

        // Check if OTP has expired
        if (new Date() > unverifiedUser.otpExpiry) {
            return res.status(400).send({ message: "OTP has expired. Please register again." });
        }

        // Verify OTP
        if (unverifiedUser.otp !== otp) {
            return res.status(400).send({ message: "Invalid OTP" });
        }

        // Create verified user
        const verifiedUser = new users({
            username: unverifiedUser.username,
            email: unverifiedUser.email,
            password: unverifiedUser.password,
            items: unverifiedUser.items
        });

        await verifiedUser.save();
        await unverified_users.deleteOne({ email });

        // Cache the verified user
        const client = await getRedisClient();
        await client.set(`user:${email}`, JSON.stringify(verifiedUser), { EX: 3600 });
        await client.del("admin:data");

        res.status(200).send({ 
            message: "Email verified successfully! Your account is now active.",
            userId: verifiedUser._id
        });
    } catch (error) {
        console.error("Error verifying OTP:", error);
        res.status(500).send({ message: "Internal Server Error" });
    }
}

// Resend OTP
async function resendOTP(req, res) {
    const { email } = req.body;
    const nodemailer = require('nodemailer');
    
    try {
        const unverifiedUser = await unverified_users.findOne({ email });
        
        if (!unverifiedUser) {
            return res.status(404).send({ message: "User not found. Please register first." });
        }

        // Generate new OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

        // Update OTP in database
        await unverified_users.updateOne(
            { email },
            { otp, otpExpiry }
        );

        // Get email credentials from environment
        const emailUser = process.env.EMAIL_USER || "hexart637@gmail.com";
        const emailPass = process.env.EMAIL_PASS || 'zetk dsdm imvx keoa';

        // Log email configuration (without password) for debugging
        console.log(`[OTP Resend] Attempting to send OTP to ${email} using sender: ${emailUser}`);

        // Try to send new OTP email
        let emailSent = false;
        try {
            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: emailUser,
                    pass: emailPass
                }
            });

            const mailOptions = {
                from: emailUser,
                to: email,
                subject: 'Your New HexArt OTP',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #333;">New OTP Request</h2>
                        <p>Hello ${unverifiedUser.username},</p>
                        <p>Here is your new OTP to verify your email address:</p>
                        <div style="background-color: #f4f4f4; padding: 20px; text-align: center; margin: 20px 0;">
                            <h1 style="color: #6b46c1; letter-spacing: 5px; margin: 0;">${otp}</h1>
                        </div>
                        <p>This OTP is valid for <strong>10 minutes</strong>.</p>
                        <p>If you didn't request this, please ignore this email.</p>
                    </div>
                `
            };

            await transporter.sendMail(mailOptions);
            emailSent = true;
            console.log(`[OTP Resend] Email sent successfully to ${email}`);
        } catch (emailError) {
            console.error("[OTP Resend] Failed to send email:", emailError.message);
            // Log OTP to console for development/testing when email fails
            console.log(`[DEV] New OTP for ${email}: ${otp}`);
        }

        if (emailSent) {
            res.status(200).send({ message: "New OTP sent to your email" });
        } else {
            // Return success but indicate email issue - OTP is still stored
            res.status(200).send({ 
                message: "OTP generated. Check console for OTP (email service unavailable)",
                ...(process.env.NODE_ENV !== 'production' && { devOtp: otp })
            });
        }
    } catch (error) {
        console.error("Error resending OTP:", error);
        res.status(500).send({ message: "Internal Server Error" });
    }
}

// Legacy verify by ID (keep for backward compatibility)
async function verifyEmail(req, res) {
    const userid = req.params.id;
    try {
        const unverifiedUser = await unverified_users.findOne({ _id: userid });
        if (!unverifiedUser) {
            return res.status(404).send({ message: "User not found or already verified" });
        }

        const verifiedUser = new users({
            username: unverifiedUser.username,
            email: unverifiedUser.email,
            password: unverifiedUser.password,
            items: unverifiedUser.items
        });

        await verifiedUser.save();
        await unverified_users.deleteOne({ _id: userid });
        
        const client = await getRedisClient();
        await client.set(`user:${unverifiedUser.email}`, JSON.stringify(verifiedUser), { EX: 3600 });
        
        res.status(200).send({ message: "Email verified successfully! Your account is now active." });
    } catch (error) {
        console.error("Error verifying email:", error);
        res.status(500).send({ message: "Internal Server Error" });
    }
}

module.exports = { verifyEmail, verifyOTP, resendOTP };
