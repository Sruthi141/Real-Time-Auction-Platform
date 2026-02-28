const bcrypt = require('bcryptjs');
const sellermodel = require("../../models/sellermodel");
const unverified_sellers = require("../../models/unverifiedsellers");
const nodemailer = require('nodemailer');
const getRedisClient = require("../../redis");

// Generate a 6-digit OTP
function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sellerregister_post(req, res) {
    const { name, email, phone, password } = req.body;
    const client = await getRedisClient();
    try {
        // Check if seller already exists in verified sellers
        const verifiedSeller = await sellermodel.findOne({ email });
        if (verifiedSeller) {
            return res.status(200).send({ message: "Email Already Exists" });
        }

        // Check if seller already exists in unverified sellers
        const existingUnverified = await unverified_sellers.findOne({ email });
        if (existingUnverified) {
            // Delete existing unverified seller to allow re-registration
            await unverified_sellers.deleteOne({ email });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // Generate OTP
        const otp = generateOTP();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // OTP valid for 10 minutes

        // Create unverified seller with OTP
        const newUnverifiedSeller = new unverified_sellers({
            name,
            email,
            phone,
            password: hashedPassword,
            otp,
            otpExpiry,
            items: []
        });

        await newUnverifiedSeller.save();
        await client.del("admin:data");

        // Try to send OTP email, but don't fail registration if email fails
        let emailSent = false;
        try {
            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: process.env.EMAIL_USER || "hexart637@gmail.com",
                    pass: process.env.EMAIL_PASS || 'zetk dsdm imvx keoa'
                }
            });

            const mailOptions = {
                from: process.env.EMAIL_USER || 'hexart637@gmail.com',
                to: email,
                subject: 'Verify Your HexArt Seller Account - OTP',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #333;">Welcome to HexArt Seller Portal!</h2>
                        <p>Hello ${name},</p>
                        <p>Thank you for registering as a seller on HexArt. Please use the following OTP to verify your email address:</p>
                        <div style="background-color: #f4f4f4; padding: 20px; text-align: center; margin: 20px 0;">
                            <h1 style="color: #6b46c1; letter-spacing: 5px; margin: 0;">${otp}</h1>
                        </div>
                        <p>This OTP is valid for <strong>10 minutes</strong>.</p>
                        <p>If you didn't request this, please ignore this email.</p>
                        <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
                        <p style="color: #666; font-size: 12px;">This is an automated message from HexArt. Please do not reply.</p>
                    </div>
                `
            };

            await transporter.sendMail(mailOptions);
            emailSent = true;
        } catch (emailError) {
            console.error("Failed to send OTP email:", emailError.message);
            // Log OTP to console for development/testing when email fails
            console.log(`[DEV] Seller OTP for ${email}: ${otp}`);
        }

        res.status(200).send({ 
            message: emailSent ? "Verification Email Sent To Your Email" : "Registration successful. Check console for OTP (email service unavailable)",
            sellerId: newUnverifiedSeller._id,
            // Include OTP in response for development when email fails
            ...((!emailSent && process.env.NODE_ENV !== 'production') && { devOtp: otp })
        });
    } catch (error) {
        console.error("Error during registration:", error);
        res.status(500).send({ message: "Internal Server Error" });
    }
}

module.exports = { sellerregister_post };
