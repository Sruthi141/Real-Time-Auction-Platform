// ================= IMPORTS =================
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
const multer = require("multer");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
require("dotenv").config();

const { itemmodel } = require("./models/itemmodel");
const SellerModel = require("./models/sellermodel");
const UserModel = require("./models/usermodel");
const FeedBack = require("./models/FeedBackModel");
const PerformanceLog = require("./models/PerformanceLog");
const getRedisClient = require("./redis");

const { storage } = require("./routers/seller-routes/storage");

const app = express();
const upload = multer({ storage });

// ================= MIDDLEWARE =================
app.use(cors({
  origin: true,
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static("uploads"));

morgan.token("body", (req) => JSON.stringify(req.body));
app.use(morgan(":method :url :status :response-time ms - :body"));

// ================= DB =================
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.error("MongoDB connection error:", err));

// ================= BASIC ROUTES =================
app.get("/", (req, res) => {
  res.send("Hello, welcome to Hexart 🚀");
});

// ================= USER ROUTES =================
app.use("/register", require("./routers/user-routes/user_register"));
app.use("/login", require("./routers/user-routes/user_login"));
app.use("/user", require("./routers/user-routes/user_home"));
app.use("/auction", require("./routers/user-routes/user_auctionpage"));
app.use("/auth", require("./routers/user-routes/authrouter"));
app.use("/verify", require("./routers/user-routes/verifymail"));
app.use("/liked", require("./routers/user-routes/LikedRoutes"));

// ================= SELLER ROUTES =================
app.use("/sellerregister", require("./routers/seller-routes/seller_register"));
app.use("/sellerlogin", require("./routers/seller-routes/seller_login"));
app.use("/sellerhome", require("./routers/seller-routes/seller_home"));
app.use("/create", require("./routers/seller-routes/create_auction"));
app.use("/sell", require("./routers/seller-routes/sell_item"));
app.use("/seller/verify", require("./routers/seller-routes/sellerverification"));

// ================= ADMIN =================
app.use("/admin/login", require("./routers/admin-routes/admin_login"));
app.use("/admin/home", require("./routers/admin-routes/admin_home"));
app.use("/delete", require("./routers/admin-routes/deleteitem"));

// ================= FEEDBACK =================
app.post("/feedback", async (req, res) => {
  try {
    const newFeedback = new FeedBack({
      name: req.body.name,
      email: req.body.email,
      Feedback: req.body.feedback,
      Rating: req.body.rating,
      CreatedAt: new Date(),
    });

    await newFeedback.save();
    res.json({ message: "Feedback saved successfully" });

  } catch (error) {
    console.error("Feedback error:", error);
    res.status(500).json({ error: "Failed to save feedback" });
  }
});

app.get("/feedbacks", async (req, res) => {
  try {
    const feedbacks = await FeedBack.find();
    res.json(feedbacks);
  } catch {
    res.status(500).json({ error: "Failed to fetch feedbacks" });
  }
});

// ================= UPDATE ITEM (FIXED) =================
app.put("/item/update/:id", upload.single("image"), async (req, res) => {
  try {
    const updateData = { ...req.body };

    if (req.file?.path) {
      updateData.url = req.file.path;
    }

    if (updateData.date) {
      const [year, month, day] = updateData.date.split("-").map(Number);

      if (updateData.StartTime) {
        const [h, m] = updateData.StartTime.split(":").map(Number);
        updateData.StartTime = new Date(year, month - 1, day, h, m);
      }

      if (updateData.EndTime) {
        const [h, m] = updateData.EndTime.split(":").map(Number);
        updateData.EndTime = new Date(year, month - 1, day, h, m);
      }
    }

    const updatedItem = await itemmodel.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    const client = await getRedisClient();
    await client.flushAll();

    res.json(updatedItem);

  } catch (error) {
    console.error("Update item error:", error);
    res.status(500).json({ error: error.message });
  }
});

// ================= SELLER UPDATE =================
app.post("/seller/edit/:id", async (req, res) => {
  try {
    const updatedSeller = await SellerModel.findByIdAndUpdate(
      req.params.id,
      { name: req.body.name, email: req.body.email },
      { new: true }
    );

    const client = await getRedisClient();
    await client.flushAll();

    res.json(updatedSeller);
  } catch (error) {
    console.error("Update seller error:", error);
    res.status(500).json({ error: error.message });
  }
});

// ================= GLOBAL 404 =================
app.use((req, res) => {
  res.status(404).json({ error: "Not Found", path: req.originalUrl });
});

// ================= GLOBAL ERROR HANDLER =================
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: err.message || "Internal Server Error" });
});

// ================= SERVER =================
app.listen(4000, () => {
  console.log("🚀 Running on port 4000");
  console.log("http://localhost:4000/");
});

module.exports = app;