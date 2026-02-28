const mongoose = require("mongoose");
const sellermodel = require("../../models/sellermodel");
const usermodel = require("../../models/usermodel");
const { itemmodel } = require("../../models/itemmodel");
const getRedisClient = require("../../redis");

async function sellingPageGet(req, res) {
  try {
    const seller = await sellermodel.findById(req.params.seller);
    if (!seller) return res.status(404).send({ message: "Seller not found" });

    const item = await itemmodel.findById(req.params.itemid);
    if (!item) return res.status(404).send({ message: "Item Sold" });

    res.status(200).send({ data: { user: req.params.seller, username: seller.name, item } });
  } catch (error) {
    console.error("sellingPageGet Error:", error);
    res.status(500).send({ message: "Internal Server Error", error: error.message });
  }
}

async function sellingPagePost(req, res) {
  try {
    const { seller: sellerId, itemid: itemId } = req.params;

    // ✅ validate ids
    if (!mongoose.Types.ObjectId.isValid(sellerId) || !mongoose.Types.ObjectId.isValid(itemId)) {
      return res.status(400).send({ message: "Invalid sellerId or itemId" });
    }

    const item = await itemmodel.findById(itemId);
    if (!item) return res.status(404).send({ message: "Item already sold / not found" });

    if (!item.current_bidder_id) {
      return res.status(400).send({ message: "No bidder found. Cannot sell item." });
    }

    // ✅ remove from seller.items + add to seller.solditems using IDs
    const seller = await sellermodel.findByIdAndUpdate(
      sellerId,
      {
        $pull: { items: item._id },          // ✅ correct for ObjectId array
        $addToSet: { solditems: item._id },  // ✅ store item id
      },
      { new: true }
    );

    if (!seller) return res.status(404).send({ message: "Seller not found" });

    // ✅ add item to buyer using ID
    const user = await usermodel.findByIdAndUpdate(
      item.current_bidder_id,
      { $addToSet: { items: item._id } },
      { new: true }
    );

    if (!user) return res.status(404).send({ message: "Buyer not found" });

    // ✅ mark item sold (avoid deleting to prevent broken refs)
    item.person = item.current_bidder; // optional
    item.isSold = true;
    item.soldAt = new Date();
    item.soldTo = item.current_bidder_id;
    await item.save();

    // ✅ redis flush safely
    try {
      const client = await getRedisClient();
      if (client?.flushAll) await client.flushAll();
    } catch (e) {
      console.log("Redis flush skipped:", e.message);
    }

    return res.status(200).send({ message: "Item sold successfully", item });
  } catch (error) {
    console.error("sellingPagePost Error:", error); // ✅ fixed
    return res.status(500).send({ message: "Internal server error", error: error.message });
  }
}

module.exports = { sellingPageGet, sellingPagePost };