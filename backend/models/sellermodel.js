const mongoose = require('mongoose');

const sellerschema = mongoose.Schema({
    name: String,
    email: { type: String, index: true, unique: true },
    phone: { type: String, index: true },
    password: String,
    items: [{ type: mongoose.Schema.Types.ObjectId, ref: 'items' }],
    solditems: [{ type: mongoose.Schema.Types.ObjectId, ref: 'items' }],
    likeditems: [{ type: mongoose.Schema.Types.ObjectId, ref: 'items' }],
    subscription:{
        type: String,
        enum: ['free', 'standard' , 'premium'],
        default: 'free'
    }
}, {
    timestamps: true // This will add createdAt and updatedAt fields automatically
});

// Ensure indexes are created
sellerschema.index({ email: 1 }, { unique: true });
sellerschema.index({ phone: 1 });

const sellermodel = mongoose.model("sellers", sellerschema);

module.exports = sellermodel;