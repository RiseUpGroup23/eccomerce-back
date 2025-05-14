const mongoose = require('mongoose');

const productoSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String },
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
            },
            totalSold: {
                type: Number,
                default: 0
            }
        }]
    }],
    quantity: { type: Number },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Categoria' },
    subcategory: { type: mongoose.Schema.Types.ObjectId, ref: 'Subcategoria', default: null },
    images: [{ type: String }],
    brand: { type: String },
    totalStock: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

productoSchema.pre('save', function (next) {
    this.totalStock = this.variants.reduce((acc, variant) => {
        return acc + variant.stockByPickup.reduce((sum, sp) => sum + sp.quantity, 0);
    }, 0);
    next();
});

module.exports = mongoose.model('Producto', productoSchema);
