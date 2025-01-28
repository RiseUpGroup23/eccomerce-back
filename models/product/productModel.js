const mongoose = require('mongoose');

const productoSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    link: { type: String, required: true },
    sellingPrice: { type: Number, required: true },
    listPrice: { type: Number },
    stock: { type: Number, required: true },
    quantity: { type: Number, required: false },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Categoria', required: true }, // Categoría principal
    subcategory: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subcategoria',
        default: null // Permitir que subcategory sea null o un ObjectId de subcategoría
    },
    images: [{ type: String }],
    brand: { type: String },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

module.exports = mongoose.model('Producto', productoSchema);
