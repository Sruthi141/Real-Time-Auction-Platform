const express = require("express");
const router = express.Router();

const PaymentModel = require("../../models/PaymentModel");
const { itemmodel } = require("../../models/itemmodel");

// ✅ Get item by id (used in payment page)
router.get("/item/:id", async (req, res) => {
  try {
    const item = await itemmodel.findById(req.params.id);
    if (!item) return res.status(404).json({ message: "Item not found" });
    return res.json(item);
  } catch (err) {
    console.error("GET /payment/item/:id error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// ✅ Create Payment (PENDING)
router.post("/create", async (req, res) => {
  try {
    const { itemId, userId, method } = req.body;

    if (!itemId || !userId) {
      return res.status(400).json({ message: "itemId and userId are required" });
    }

    const item = await itemmodel.findById(itemId);
    if (!item) return res.status(404).json({ message: "Item not found" });

    if (item.paid === true) {
      return res.status(409).json({ message: "Item already paid" });
    }

    // current_price is STRING in your schema
    const amount = Number(item.current_price);

    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({ message: "Invalid item price" });
    }

    const payment = await PaymentModel.create({
      itemId,
      userId: String(userId),
      amount,
      method: method || "upi",
      status: "pending",
      transactionId: "TXN_" + Date.now(),
    });

    return res.status(201).json({ message: "Payment created", payment });
  } catch (err) {
    console.error("POST /payment/create error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// ✅ Confirm Payment (PAID + Update Item)
router.post("/confirm", async (req, res) => {
  try {
    const { paymentId } = req.body;

    if (!paymentId) {
      return res.status(400).json({ message: "paymentId is required" });
    }

    const payment = await PaymentModel.findById(paymentId);
    if (!payment) return res.status(404).json({ message: "Payment not found" });

    if (payment.status === "paid") {
      return res.json({ message: "Already paid", payment });
    }

    payment.status = "paid";
    await payment.save();

    // update item document
    await itemmodel.findByIdAndUpdate(payment.itemId, {
      paid: true,
      paidAmount: payment.amount,
      paymentId: payment._id,
      paidBy: payment.userId,
    });

    return res.json({ message: "Payment confirmed ✅", payment });
  } catch (err) {
    console.error("POST /payment/confirm error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// ✅ Status by itemId
router.get("/status/:itemId", async (req, res) => {
  try {
    const payment = await PaymentModel.findOne({ itemId: req.params.itemId }).sort({ createdAt: -1 });

    if (!payment) return res.json({ status: "none" });

    return res.json({ status: payment.status, payment });
  } catch (err) {
    console.error("GET /payment/status/:itemId error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;