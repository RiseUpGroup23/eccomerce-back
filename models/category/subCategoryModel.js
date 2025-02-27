const mongoose = require('mongoose');

const subcategorySchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    description: { type: String },
    categoryLink: { type: String, unique: true }, // El campo categoryLink será un enlace único para la subcategoría
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Categoria' } // Agregar referencia a Categoria
}, { timestamps: true });

module.exports = mongoose.model('Subcategoria', subcategorySchema);
