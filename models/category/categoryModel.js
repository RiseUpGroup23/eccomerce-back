const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    description: { type: String },
    subcategories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Categoria' }] // Subcategorías como referencias
}, { timestamps: true });

module.exports = mongoose.model('Categoria', categorySchema);
