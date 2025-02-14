const mongoose = require('mongoose');

const productoSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    link: { type: String, required: true },
    sellingPrice: { type: Number, required: true },
    listPrice: { type: Number },
    variants: [{
        attributes: {
            name: String
        },
        stockByPickup: [{
            pickup: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Pickup',
                required: true
            },
            quantity: {
                type: Number,
                default: 0
            }
        }]
    }],
    quantity: { type: Number, required: false },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Categoria'}, // Categoría principal
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

productoSchema.virtual('totalStock').get(function () {
    return this.variants.reduce((acc, variant) => {
        return acc + variant.stockByPickup.reduce((sum, sp) => sum + sp.quantity, 0);
    }, 0);
});

module.exports = mongoose.model('Producto', productoSchema);
