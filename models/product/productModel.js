const mongoose = require('mongoose');

const productoSchema = new mongoose.Schema({
    nombre: { type: String, required: true },
    descripcion: { type: String, required: true },
    precio: { type: Number, required: true },
    stock: { type: Number, required: true },
    categoria: { type: mongoose.Schema.Types.ObjectId, ref: 'Categoria', required: true }, // Referencia a la categoría
    imagen: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Producto', productoSchema);
