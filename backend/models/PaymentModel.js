const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    itemId: { type: mongoose.Schema.Types.ObjectId, ref: "item", required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },

    amount: { type: Number, required: true },
    method: { type: String, enum: ["card", "upi", "cash"], default: "upi" },

    status: { type: String, enum: ["pending", "paid", "failed"], default: "pending" },

    transactionId: { type: String }, // optional (you can store anything)
  },
  { timestamps: true }
);

module.exports = mongoose.model("payment", paymentSchema);