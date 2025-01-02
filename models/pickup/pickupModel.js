const mongoose = require('mongoose');

const pickupSchema = new mongoose.Schema({
    address: { type: String, required: true },
    workingHours: { type: String, required: true }, 
    contact: { type: String, required: true }, 
}, { timestamps: true });

module.exports = mongoose.model('Pickup', pickupSchema);
