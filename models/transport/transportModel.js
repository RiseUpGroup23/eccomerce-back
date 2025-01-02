const mongoose = require('mongoose');

const transportSchema = new mongoose.Schema({
    estimatedDeliveryTime: { type: String, required: true },
    shippingCost: { type: Number, required: true }, 
}, { timestamps: true });

module.exports = mongoose.model('Transport', transportSchema);
