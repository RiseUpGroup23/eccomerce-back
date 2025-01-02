const mongoose = require('mongoose');

const collectionSchema = new mongoose.Schema(
    {
        title: { type: String, required: true },
        products: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Producto' }] // Referencia a productos
    },
    { timestamps: true }
);

module.exports = mongoose.model('Collection', collectionSchema);
