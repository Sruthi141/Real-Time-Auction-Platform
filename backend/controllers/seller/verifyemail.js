const unverified_sellers = require('../../models/unverifiedsellers');
const sellers = require('../../models/sellermodel');
const getRedisClient = require('../../redis');
const nodemailer = require('nodemailer');

// Verify OTP for seller registration
async function verifyOTP(req, res) {
    const { email, otp } = req.body;
    
    try {
        const unverifiedSeller = await unverified_sellers.findOne({ email });
        
        if (!unverifiedSeller) {
            return res.status(404).send({ message: "Seller not found or already verified" });
        }

        // Check if OTP has expired
        if (new Date() > unverifiedSeller.otpExpiry) {
            return res.status(400).send({ message: "OTP has expired. Please register again." });
        }

        // Verify OTP
        if (unverifiedSeller.otp !== otp) {
            return res.status(400).send({ message: "Invalid OTP" });
        }

        // Create verified seller
        const verifiedSeller = new sellers({
            name: unverifiedSeller.name,
            email: unverifiedSeller.email,
            password: unverifiedSeller.password,
            phone: unverifiedSeller.phone,
            subscription: "free",
            items: unverifiedSeller.items,
            solditems: [],
            likeditems: []
        });

        await verifiedSeller.save();
        await unverified_sellers.deleteOne({ email });

        // Clear cache
        const client = await getRedisClient();
        await client.del("admin:data");

        res.status(200).send({ 
            message: "Email verified successfully! Your account is now active.",
            sellerId: verifiedSeller._id
        });
    } catch (error) {
        console.error("Error verifying OTP:", error);
        res.status(500).send({ message: "Internal Server Error" });
    }
}

// Resend OTP
async function resendOTP(req, res) {
    const { email } = req.body;
    
    try {
        const unverifiedSeller = await unverified_sellers.findOne({ email });
        
        if (!unverifiedSeller) {
            return res.status(404).send({ message: "Seller not found. Please register first." });
        }

        // Generate new OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

        // Update OTP in database
        await unverified_sellers.updateOne(
            { email },
            { otp, otpExpiry }
        );

        // Get email credentials from environment
        const emailUser = process.env.EMAIL_USER || "hexart637@gmail.com";
        const emailPass = process.env.EMAIL_PASS || 'zetk dsdm imvx keoa';

        // Log email configuration (without password) for debugging
        console.log(`[Seller OTP Resend] Attempting to send OTP to ${email} using sender: ${emailUser}`);

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
                subject: 'Your New HexArt Seller OTP',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #333;">New OTP Request</h2>
                        <p>Hello ${unverifiedSeller.name},</p>
                        <p>Here is your new OTP to verify your seller account:</p>
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
            console.log(`[Seller OTP Resend] Email sent successfully to ${email}`);
        } catch (emailError) {
            console.error("[Seller OTP Resend] Failed to send email:", emailError.message);
            // Log OTP to console for development/testing when email fails
            console.log(`[DEV] Seller OTP for ${email}: ${otp}`);
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
    const sellerid = req.params.id;
    try {
        const unverifiedSeller = await unverified_sellers.findOne({ _id: sellerid });
        if (!unverifiedSeller) {
            return res.status(404).send({ message: "Seller not found or already verified" });
        }

        const verifiedSeller = new sellers({
            name: unverifiedSeller.name,
            email: unverifiedSeller.email,
            password: unverifiedSeller.password,
            phone: unverifiedSeller.phone,
            subscription: "free",
            items: unverifiedSeller.items,
            solditems: [],
            likeditems: []
        });

        await verifiedSeller.save();
        await unverified_sellers.deleteOne({ _id: sellerid });

        const client = await getRedisClient();
        await client.del("admin:data");

        res.status(200).send({ message: "Email verified successfully! Your account is now active." });
    } catch (error) {
        console.error("Error verifying email:", error);
        res.status(500).send({ message: "Internal Server Error" });
    }
}

module.exports = { verifyEmail, verifyOTP, resendOTP };
