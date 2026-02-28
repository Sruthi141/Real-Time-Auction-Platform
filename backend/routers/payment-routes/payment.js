const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
require('dotenv').config();

const PaymentModel = require("../../models/PaymentModel");
const { itemmodel } = require("../../models/itemmodel");

// Initialize Stripe
let stripeClient = null;
if (process.env.STRIPE_SECRET_KEY) {
  stripeClient = require('stripe')(process.env.STRIPE_SECRET_KEY);
} else {
  console.warn('STRIPE_SECRET_KEY not found - Stripe checkout will be disabled');
}

// Debug: Log when this router is loaded
console.log("✅ Payment routes loaded");

// ✅ Debug endpoint: List last 10 items with _id, pid, name, current_price
router.get("/debug/items", async (req, res) => {
  try {
    const items = await itemmodel.find({}, '_id pid name current_price paid sold person').sort({ createdAt: -1 }).limit(10);
    console.log(`[Payment Debug] Found ${items.length} items`);
    return res.json({
      message: `Found ${items.length} items`,
      items: items.map(i => ({
        _id: i._id.toString(),
        pid: i.pid || 'N/A',
        name: i.name,
        current_price: i.current_price,
        paid: i.paid,
        sold: i.sold,
        person: i.person
      }))
    });
  } catch (err) {
    console.error("GET /payment/debug/items error:", err.message);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
});

// ✅ Get item by id (used in payment page)
// Items now stay in the items collection permanently, so findById works directly
router.get("/item/:id", async (req, res) => {
  const itemId = req.params.id;
  console.log(`[Payment] GET /item/${itemId} - Request received`);
  
  try {
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(itemId)) {
      console.log(`[Payment] Invalid ObjectId format: ${itemId}`);
      return res.status(400).json({ message: "Invalid item ID format" });
    }

    // Items stay in the collection permanently, so findById works directly
    const item = await itemmodel.findById(itemId);
    
    if (!item) {
      console.log(`[Payment] Item not found: ${itemId}`);
      return res.status(404).json({ message: "Item not found" });
    }
    
    console.log(`[Payment] Item found: ${item.name} (sold: ${item.sold}, paid: ${item.paid})`);
    return res.json(item);
  } catch (err) {
    console.error("GET /payment/item/:id error:", err.message);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
});

// ✅ Create Payment (PENDING)
router.post("/create", async (req, res) => {
  try {
    const { itemId, userId, method } = req.body;

    if (!itemId || !userId) {
      return res.status(400).json({ message: "itemId and userId are required" });
    }

    // Items stay in collection permanently, so findById works directly
    if (!mongoose.Types.ObjectId.isValid(itemId)) {
      return res.status(400).json({ message: "Invalid item ID format" });
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

// ✅ Stripe Checkout Session
router.post("/create-checkout-session", async (req, res) => {
  try {
    if (!stripeClient) {
      return res.status(500).json({ error: 'Stripe is not configured. Please add STRIPE_SECRET_KEY to environment variables.' });
    }

    const { items, itemId, userId } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Items array is required' });
    }

    const session = await stripeClient.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: items.map(item => ({
        price_data: {
          currency: 'usd',
          product_data: { name: item.name },
          unit_amount: Math.round(item.price * 100),
        },
        quantity: item.quantity || 1,
      })),
      metadata: { itemId: itemId || '', userId: userId || '' },
      success_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment-success`,
      cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/cancel`,
    });

    res.json({ id: session.id });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    res.status(500).json({ error: error.message || 'Failed to create checkout session' });
  }
});

module.exports = router;
