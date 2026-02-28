const mongoose = require("mongoose");
const sellermodel = require("../../models/sellermodel");
const usermodel = require("../../models/usermodel");
const { itemmodel } = require("../../models/itemmodel");
const getRedisClient = require("../../redis");

const deleteItem = async (req, res) => {
  let client;
  try {
    const { type, id } = req.params;

    // ✅ Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).send("Invalid id format");
    }

    // Optional: Redis client (only if you really need it)
    client = await getRedisClient();

    switch (type) {
      case "user": {
        const deleted = await usermodel.findByIdAndDelete(id);
        if (!deleted) return res.status(404).send("User not found");

        // ✅ Instead of flushAll, delete only relevant keys if you have any:
        // await client.del(`user:${id}`);

        return res.status(200).send("User deleted successfully");
      }

      case "seller": {
        const seller = await sellermodel.findById(id).lean();
        if (!seller) return res.status(404).send("Seller not found");

        // ✅ Delete all items belonging to seller (handles ObjectId array OR object array)
        const itemIds = (seller.items || []).map((x) =>
          typeof x === "object" && x !== null ? x._id : x
        );

        if (itemIds.length) {
          await itemmodel.deleteMany({ _id: { $in: itemIds } });
        }

        await sellermodel.findByIdAndDelete(id);

        // await client.del(`seller:${id}`);
        return res.status(200).send("Seller deleted successfully");
      }

      case "item": {
        const item = await itemmodel.findById(id);
        if (!item) return res.status(404).send("Item not found");

        const sellerId = item.pid; // ensure your schema uses pid as seller reference
        if (!sellerId) return res.status(400).send("Item has no seller reference (pid)");

        // ✅ Pull item from seller in BOTH possible formats
        await sellermodel.updateOne(
          { _id: sellerId },
          {
            $pull: {
              items: mongoose.Types.ObjectId.isValid(id)
                ? mongoose.Types.ObjectId(id) // handles items: [ObjectId]
                : id,
            },
          }
        );

        await sellermodel.updateOne(
          { _id: sellerId },
          {
            $pull: {
              items: { _id: id }, // handles items: [{_id: ObjectId}]
            },
          }
        );

        await itemmodel.findByIdAndDelete(id);

        // await client.del(`item:${id}`);
        return res.status(200).send("Item deleted successfully");
      }

      default:
        return res.status(400).send("Invalid type");
    }
  } catch (error) {
    console.error("Delete error:", error);
    return res.status(500).send("Internal Server Error");
  }
};

module.exports = { deleteItem };