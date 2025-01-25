const mongoose = require('mongoose');

const pickupSchema = new mongoose.Schema({
    id: { type: String, required: true },  // ID para identificar la sucursal
    name: { type: String, required: true },  // Nombre de la sucursal
    availability: { type: String, required: false },  // Disponibilidad de la sucursal
    address: { type: String, required: true },  // Dirección de la sucursal
    contact: { type: String, required: false },  // Información de contacto de la sucursal
}, { timestamps: true });

module.exports = mongoose.model('Pickup', pickupSchema);
