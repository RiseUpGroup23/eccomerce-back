const mongoose = require('mongoose');

const pickupSchema = new mongoose.Schema({
    name: { type: String, required: true },  // Nombre de la sucursal
    availability: { type: String, required: false },  // Disponibilidad de la sucursal
    address: { type: String, required: true },  // Dirección de la sucursal
    contact: { type: String, required: false },  // Información de contacto de la sucursal
    defaultDelivery: { type: Boolean, required: true, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Pickup', pickupSchema);
