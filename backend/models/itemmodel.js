const mongoose = require('mongoose');

const itemschema = mongoose.Schema({
    name: String,
    person: String,
    pid: { type: String, index: true }, // seller ID (kept for backward compat)
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: "sellers" },
    url: String,
    base_price: Number,
    current_bidder: String,
    current_bidder_id: String,
    current_price: String,

    // ✅ SOLD/OWNERSHIP FIELDS
    sold: { type: Boolean, default: false },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "userdetails" }, // buyer after sold

    // ✅ PAYMENT FIELDS
    paid: { type: Boolean, default: false },
    paidAmount: { type: Number, default: 0 },
    paymentId: { type: mongoose.Schema.Types.ObjectId, ref: "payment" },
    paidBy: { type: String, default: "" },

    type: String,
    aution_active: Boolean,
    date: { type: Date, index: true },
    StartTime: Date,
    EndTime: Date,
    visited_users: [{ id: String, email: String }],
    auction_history: [{ bidder: String, price: String }]
}, {
    timestamps: true
});

itemschema.index({ pid: 1 });
itemschema.index({ date: 1 });
itemschema.index({ EndTime: 1 });

const itemmodel = mongoose.model("items", itemschema);

module.exports = {
    itemschema,
    itemmodel
}