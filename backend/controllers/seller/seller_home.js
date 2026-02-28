const sellermodel = require("../../models/sellermodel");
const { itemmodel } = require("../../models/itemmodel");
const getRedisClient = require("../../redis");
const PerformanceLog = require("../../models/PerformanceLog");

const logPerformance = async (req, source, responseTime) => {
  await PerformanceLog.create({
    endpoint: "/sellerhome/:id", // ✅ corrected label
    method: req.method,
    source,
    responseTime,
  });
};

async function renderSellerHome(req, res) {
  const start = Date.now();
  const { id } = req.params;

  console.log("✅ renderSellerHome called for seller:", id); // ✅ debug

  try {
    let client;
    try {
      client = getRedisClient();
    } catch (err) {
      console.error("Error obtaining redis client:", err);
      client = null;
    }

    let seller;
    let source;
    let time = 0;

    let cachedSeller = null;
    if (client) {
      try {
        cachedSeller = await client.get(`seller:${id}`);
      } catch (err) {
        console.error("Redis GET failed (continuing without cache):", err);
        cachedSeller = null;
      }
    }

    if (cachedSeller) {
      try {
        seller = JSON.parse(cachedSeller);
      } catch {
        seller = await sellermodel.findById(id).lean();
      }
      time = Date.now() - start;
      source = "cache";
    } else {
      seller = await sellermodel.findById(id).lean();
      if (!seller) return res.status(404).json({ message: "Seller not found" });
      time = Date.now() - start;

      if (client) {
        try {
          await client.set(`seller:${id}`, JSON.stringify(seller), { EX: 3600 });
        } catch (err) {
          console.error("Redis SET failed (ignored):", err);
        }
      }
      source = "db";
    }

    const sellerBasic = {
      name: seller.name,
      email: seller.email,
      subscription: seller.subscription,
      _id: seller._id,
    };

    const now = new Date();
    const items = await itemmodel
      .find({ pid: id, $or: [{ EndTime: { $gt: now } }, { EndTime: null }] })
      .sort({ createdAt: -1 })
      .limit(200)
      .select("name base_price current_price StartTime EndTime auction_history visited_users url pid")
      .lean();

    logPerformance(req, source, time).catch((err) =>
      console.error("Perf log failed:", err)
    );

    return res.status(200).json({
      message: "Data Fetched Successfully",
      source,
      responseTime: time,
      seller: sellerBasic,
      items,
    });
  } catch (error) {
    console.error("Error fetching data:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}

module.exports = { renderSellerHome };