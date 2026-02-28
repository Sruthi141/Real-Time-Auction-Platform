const sellermodel = require("../../models/sellermodel");
const { itemmodel } = require("../../models/itemmodel");
const getRedisClient = require("../../redis");
const cloudinary = require("cloudinary").v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

async function createAuctionPost(req, res) {
  try {
    const client = await getRedisClient(); // Redis client

    console.log('--- createAuctionPost start ---')
    console.log('headers:', req.headers)
    console.log('content-type:', req.headers['content-type'])
    console.log('createAuctionPost body keys:', Object.keys(req.body || {}))
    console.log('createAuctionPost body:', req.body)
    console.log('createAuctionPost file:', req.file)

    const seller = await sellermodel.findById(req.params.seller);
    if (!seller) return res.status(404).json({ message: "Seller not found" });

    // Basic validation: require name and basePrice or url/file
    if (!req.body.name || (!req.body.basePrice && !req.body.base_price)) {
      return res.status(400).json({ message: 'Missing required fields: name and basePrice' });
    }

    if (!req.file && !req.body.url && !req.body.image) {
      // allow items without image but log a warning
      console.warn('No image provided for new item (file/url missing)')
    }

    const dateString = req.body.date;
    // Parse times carefully and validate
    let startTime = null;
    let endTime = null;
    if (dateString && req.body.StartTime) {
      startTime = new Date(`${dateString}T${req.body.StartTime}:00`);
      if (isNaN(startTime.getTime())) startTime = null;
    }
    if (dateString && req.body.EndTime) {
      endTime = new Date(`${dateString}T${req.body.EndTime}:00`);
      if (isNaN(endTime.getTime())) endTime = null;
    }

    // Parse numeric fields
    const basePriceNum = Number(req.body.basePrice) || 0;

    // Build a usable URL for locally-stored files when diskStorage is used
    let fileUrl = "";
    if (req.file) {
      if (req.file.secure_url) fileUrl = req.file.secure_url;
      else if (req.file.url) fileUrl = req.file.url;
      else if (req.file.path) fileUrl = req.file.path;
      else if (req.file.filename) {
        // Serve via express.static('uploads') configured in index.js
        fileUrl = `${req.protocol}://${req.get('host')}/${req.file.filename}`;
      }
    }

    const item = new itemmodel({
      name: req.body.name || "",
      person: seller.name,
      pid: req.params.seller,
      url: fileUrl || req.body.url || "",
      base_price: basePriceNum,
      type: req.body.type || "",
      current_price: basePriceNum,
      current_bidder: "",
      current_bidder_id: "",
      aution_active: true,
      date: dateString ? new Date(dateString) : null,
      StartTime: startTime,
      EndTime: endTime,
      visited_users: [],
      auction_history: []
    });

    const saved = await item.save();
    seller.items.push(saved);
    await seller.save();

    // Invalidate cache (if redis client is available). Do not let failures
    // here block the response.
    if (client) {
      try {
        if (typeof client.flushAll === 'function') await client.flushAll();
      } catch (err) {
        console.error('Redis FLUSH failed (ignored):', err);
      }
    }

    return res.status(200).send({ message: "Item created successfully", item: saved });
  } catch (error) {
    console.error("Error creating auction:", error);
    return res.status(500).send({ message: "An error occurred while creating auction" });
  }
}

module.exports = { createAuctionPost };
