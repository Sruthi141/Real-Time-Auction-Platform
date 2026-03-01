//index.js
const mongoose = require("mongoose");
const express = require("express");
const bodyParser = require("body-parser");
const session = require("express-session");
const cors = require("cors");
const multer = require("multer");
const SellerModel = require("./models/sellermodel");
require('dotenv').config();
const cookieParser = require("cookie-parser");
const { itemmodel } = require("./models/itemmodel");
const FeedBack= require('./models/FeedBackModel')
const nodemailer = require('nodemailer');
const app = express();
const email = "hexart637@gmail.com";
const PaymentModel = require("./models/PaymentModel");
const morgan = require('morgan');
const PerformanceLog = require('./models/PerformanceLog');
const UserModel = require('./models/usermodel')
const YAML = require('yamljs');
const swaggerUi = require('swagger-ui-express');
const fs = require('fs');
const getRedisClient = require('./redis'); // Import Redis client
const { v2: cloudinary } = require('cloudinary');
const {storage} = require('./routers/seller-routes/storage');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});


// Configure multer for memory storage

const upload = multer({ storage });

const CSS_URL = "https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.1.0/swagger-ui.min.css";

// ============================================
// CORS MUST BE FIRST - before any routes!
// ============================================
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:4000",
  "https://real-time-auction-platform-sruthi.vercel.app",
  "https://fdfed-2-server.vercel.app",
];

app.use(
  cors({
    origin: (origin, cb) => {
      // allow server-to-server / Postman
      if (!origin) return cb(null, true);

      // allow exact domains
      if (allowedOrigins.includes(origin)) return cb(null, true);

      // allow vercel preview deployments (optional but helpful)
      if (/^https:\/\/.*\.vercel\.app$/.test(origin)) return cb(null, true);

      // IMPORTANT: don't throw error (prevents 500 on OPTIONS)
      return cb(null, false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Preflight
app.options("*", cors());

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));

//Inbuilt middleware
app.use(express.static("uploads"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Swagger setup
const swaggerSpec = YAML.load(`${__dirname}/swagger.yaml`); // Use absolute path

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss:
    '.swagger-ui .opblock .opblock-summary-path-description-wrapper { align-items: center; display: flex; flex-wrap: wrap; gap: 0 10px; padding: 0 10px; width: 100%; }',
  customCssUrl: CSS_URL,
}));

// Payment routes (now AFTER CORS middleware)
app.use("/payment", require("./routers/payment-routes/payment"));
const mongoUri = process.env.MONGO_URI;
mongoose.connect(mongoUri)
  .then(() => {
    console.log("MongoDB Connected");
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });
app.use(express.json()); // To parse JSON body

//Third party middleware
morgan.token('body', (req) => JSON.stringify(req.body)); // Logs request body
morgan.token('response-time-ms', (req, res) => `${res.getHeader('X-Response-Time') || 'N/A'}ms`);
app.use(
  morgan(':method :url :status :response-time ms - :body')
);
app.listen(4000, function (param) { console.log("Running on port 4000"); console.log("http://localhost:4000/"); })
app.get('/' , function (req, res) {
  res.send("hello welcome to hexart")
}
)
app.delete('/item/:id', function (req, res) {
  itemmodel.findByIdAndDelete(req.params.id).then(()=>{
    res.status(200).send({message:"Item deleted successfully"});
  }).catch(err => {
    console.error('Error deleting item:', err);
    res.status(500).send({ message: 'Error deleting item' });
  })
})
app.post('/feedback', async (req, res) => {
  const { name, email, feedback, rating } = req.body;
  try {
    // Save Feedback to DB
    const newFeedback = new FeedBack({
      name,
      email,
      Feedback: feedback,
      Rating: rating,
      CreatedAt: new Date(),
    });
    await newFeedback.save();


    res.status(200).json({ message: 'Feedback saved and email sent successfully!' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'An error occurred while processing your request.' });
  }
});
app.get('/feedbacks', function (req, res) {
  FeedBack.find().then(feedbacks => {
    res.json(feedbacks);
  }).catch(err => {
    res.status(500).json({ error: 'An error occurred while retrieving feedbacks.' });
  });
})

//user routes
app.get("/", function (req, res) { console.log(req.headers.host);  res.send("hello welcome to hexart")})
app.use("/register", require("./routers/user-routes/user_register"))
app.use("/login",require("./routers/user-routes/user_login"))
app.use("/user", require("./routers/user-routes/user_home") )
app.use("/auction", require("./routers/user-routes/user_auctionpage")) //auction page for users
app.use("/auth", require("./routers/user-routes/authrouter"))
app.use("/verify" , require("./routers/user-routes/verifymail"))
app.use("/liked", require("./routers/user-routes/LikedRoutes"))


//seller routes
app.get("/seller", function (req, res) {  res.sendFile(__dirname+"/views/sellerintro.html")})
app.use("/sellerregister", require("./routers/seller-routes/seller_register") )
app.use("/sellerlogin",require("./routers/seller-routes/seller_login") )
app.use("/sellerhome",require("./routers/seller-routes/seller_home"))
app.use("/create", require("./routers/seller-routes/create_auction") )
app.use("/sell",require("./routers/seller-routes/sell_item")) //route for owner of the item
app.use("/seller/auth", require("./routers/user-routes/authrouter"))
app.use("/seller/verify" , require("./routers/seller-routes/sellerverification"))


//admin 
app.use("/admin/login",require("./routers/admin-routes/admin_login"))
app.use("/admin/home",require("./routers/admin-routes/admin_home"))
app.use("/delete" ,require("./routers/admin-routes/deleteitem") )


app.post('/item/unsold/:id', async (req, res) => {
  try {
    const item = await itemmodel.findById(req.params.id);
    if (!item) {
      return res.status(404).send({ message: "Item not found" });
    }
    const beforeUpdate = item.aution_active;
    const updatedItem = await itemmodel.findByIdAndUpdate(req.params.id, { aution_active: false }, { new: true });
    const afterUpdate = updatedItem ? updatedItem.aution_active : null;

    console.log(beforeUpdate);
    console.log(afterUpdate);
    res.status(200).send({
      message: `Item ${req.params.id} marked as unsold`,
      beforeUpdate,
      afterUpdate,
    });

    const client = await getRedisClient();
    await client.flushAll();
  } catch (error) {
    console.error('Error marking item as unsold:', error);
    res.status(500).json({ error: 'An error occurred while marking the item as unsold.' });
  }
})

// Flush Redis cache (useful after schema changes)
app.get("/flush-cache", async (req, res) => {
  try {
    const client = await getRedisClient();
    await client.flushAll();
    res.json({ message: "Cache flushed successfully" });
  } catch (error) {
    console.error('Error flushing cache:', error);
    res.status(500).json({ error: 'An error occurred while flushing cache.' });
  }
});

app.get("/performance" , async (req, res) => {
  const logs = await PerformanceLog.find();
  res.json(logs);
})

app.post('/seller/:seller/subscribe', async (req, res) => {
  const { seller } = req.params;
  const { plan } = req.body;
  const client = await getRedisClient(); // Ensure Redis client is connected

  try {
    // Update seller subscription in the database
    const updatedSeller = await SellerModel.findByIdAndUpdate(
      seller,
      { subscription: plan },
      { new: true }
    );
    await client.flushAll();
    if (!updatedSeller) {
      return res.status(404).json({ error: 'Seller not found' });
    }

    res.status(200).json({ message: 'Subscription updated successfully', seller: updatedSeller });
  } catch (error) {
    console.error('Error updating subscription:', error);
    res.status(500).json({ error: 'An error occurred while updating the subscription.' });
  }
});


app.delete('/user/:id', async (req, res) => {
  const { id } = req.params;
  const client = await getRedisClient()
  try {
    const deletedUser = await UserModel.findByIdAndDelete(id);
    client.flushAll();
    res.json(deletedUser);
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'An error occurred while deleting the user.' });
  }
})

app.post('/user/edit/:id', async (req, res) => {
  const { id } = req.params;
  const { username, email } = req.body;
  const client = await getRedisClient()
  try {
    const updatedUser = await UserModel.findByIdAndUpdate(
      id,
      { username, email },
      { new: true }
    );
    client.flushAll();
    res.json(updatedUser);
 
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'An error occurred while updating the user.' });
  }
});
app.get('/user/delete/:id', async (req, res) => {
  const { id } = req.params;
   const client = await getRedisClient()
  try {
    const deletedUser = await UserModel.findByIdAndDelete(id);
    client.flushAll();
    res.json(deletedUser);
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'An error occurred while deleting the user.' });
  }
});


app.post("/seller/edit/:id", async (req, res) => {
  const { id } = req.params;
  const { name, email } = req.body;
  const client = await getRedisClient()
  try {
    const updatedSeller = await SellerModel.findByIdAndUpdate(
      id,
      { name, email },
      { new: true }
    );
    client.flushAll();
    res.json(updatedSeller);
 
  } catch (error) {
    console.error('Error updating seller:', error);
    res.status(500).json({ error: 'An error occurred while updating the seller.' });
  }
})
app.get('/seller/delete/:id', async (req, res) => {
  const { id } = req.params;
   const client = await getRedisClient()
  try {
    const deletedSeller = await SellerModel.findByIdAndDelete(id);
    client.flushAll();
    res.json(deletedSeller);
  } catch (error) {
    console.error('Error deleting seller:', error);
    res.status(500).json({ error: 'An error occurred while deleting the seller.' });
  }
})

app.get('/item/delete/:id', async (req, res) => {
  const { id } = req.params;
   const client = await getRedisClient()
  try {
    const deletedItem = await itemmodel.findByIdAndDelete(id);
    client.flushAll();
    res.json(deletedItem);
  } catch (error) {
    console.error('Error deleting item:', error);
    res.status(500).json({ error: 'An error occurred while deleting the item.' });
  }
})

app.put('/item/update/:id', upload.single('image'), async (req, res) => {
  const { id } = req.params;
  const client = await getRedisClient();
  try {
    const updateData = { ...req.body };
    
    // Handle image upload if new image was provided
  
      updateData.url = req.file.path;
    // Convert string dates to Date objects
    const dateParts = updateData.date.split('-');
      const year = parseInt(dateParts[0]);
      const month = parseInt(dateParts[1]) - 1; // Months are 0-indexed
      const day = parseInt(dateParts[2]);

      // Handle StartTime if provided
      if (updateData.StartTime) {
        const [hours, minutes] = updateData.StartTime.split(':').map(Number);
        updateData.StartTime = new Date(year, month, day, hours, minutes);
        
        // Validate the date
        if (isNaN(updateData.StartTime.getTime())) {
          throw new Error('Invalid StartTime date');
        }
      }

      // Handle EndTime if provided
      if (updateData.EndTime) {
        const [hours, minutes] = updateData.EndTime.split(':').map(Number);
        updateData.EndTime = new Date(year, month, day, hours, minutes);
        
        // Validate the date
        if (isNaN(updateData.EndTime.getTime())) {
          throw new Error('Invalid EndTime date');
        }
      }


    const updatedItem = await itemmodel.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );

    await client.flushAll();
    res.json(updatedItem);
  } catch (error) {
    console.error('Error updating item:', error);
    res.status(500).json({ 
      error: 'An error occurred while updating the item.',
      details: error.message 
    });
  }
});


// 404 handler for API routes
app.use((req, res, next) => {
  res.status(404).json({ error: 'Not Found', path: req.originalUrl });
});

// Generic error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  const status = err.status || 500;
  res.status(status).json({ error: err.message || 'Internal Server Error' });
});

module.exports = app;
