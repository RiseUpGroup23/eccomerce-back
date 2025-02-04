const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
    items: [{
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Producto', required: true },
        variant: { type: mongoose.Schema.Types.ObjectId, required: true }, // _id de la variante
        pickup: { type: mongoose.Schema.Types.ObjectId, ref: 'Pickup', required: true },
        quantity: { type: Number, required: true }
    }],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Cart', cartSchema);
