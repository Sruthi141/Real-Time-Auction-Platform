const bcrypt = require('bcryptjs');
const users = require("../../models/usermodel");
const unverified_users = require("../../models/unverifiedusers_model");
const nodemailer = require('nodemailer');
const getRedisClient = require('../../redis');
const PerformanceLog = require('../../models/PerformanceLog');

// Generate a 6-digit OTP
function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

async function userregister_post(req, res) {
    const start = Date.now();
    const { username, email, password } = req.body;
    const client = await getRedisClient(); // Ensure Redis client is connected
    let responseTime = 0;
    try {
        const cachedUser = await client.get(`user:${email}`);
        if (cachedUser) {
            responseTime = Date.now() - start;
            return res.status(200).send({ message: "Email Already Exists" });
        }

        // Check if user already exists in verified users
        const verifiedUser = await users.findOne({ email });
        if (verifiedUser) {
            responseTime = Date.now() - start;
            return res.status(200).send({ message: "Email Already Exists" });
        }

        // Check if user already exists in unverified users
        const existingUnverified = await unverified_users.findOne({ email });
        if (existingUnverified) {
            // Delete existing unverified user to allow re-registration
            await unverified_users.deleteOne({ email });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Generate OTP
        const otp = generateOTP();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // OTP valid for 10 minutes

        // Create unverified user with OTP
        const newUnverifiedUser = new unverified_users({
            username,
            email,
            password: hashedPassword,
            otp,
            otpExpiry,
            items: []
        });

        await newUnverifiedUser.save();

        // Remove admin data cache
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
                subject: 'Verify Your HexArt Account - OTP',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #333;">Welcome to HexArt!</h2>
                        <p>Hello ${username},</p>
                        <p>Thank you for registering with HexArt. Please use the following OTP to verify your email address:</p>
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
            console.log(`[DEV] OTP for ${email}: ${otp}`);
        }

        responseTime = Date.now() - start;
        
        await PerformanceLog.create({
            endpoint: '/user/register',
            method: req.method,
            source: 'db',
            responseTime
        });

        res.status(201).send({ 
            message: emailSent ? "Verification Email Sent To Your Email" : "Registration successful. Check console for OTP (email service unavailable)",
            userId: newUnverifiedUser._id,
            // Include OTP in response for development when email fails
            ...((!emailSent && process.env.NODE_ENV !== 'production') && { devOtp: otp })
        });
    } catch (error) {
        console.error("Error during registration:", error);
        res.status(500).send({ message: "Internal Server Error" });
    }
}

module.exports = { userregister_post };
