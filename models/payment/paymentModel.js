const mongoose = require('mongoose');

// Definición del esquema de Payment
const paymentSchema = new mongoose.Schema({
    id: {
        type: String,  // Identificador del método de pago
        required: true,
        unique: true  // Asegura que el id sea único para cada método de pago
    },
    active: {
        type: Boolean,  // Si el método de pago está activo o no
        required: true,
        default: true  // Por defecto, un método de pago está activo
    },
    name: {
        type: String,  // Nombre del método de pago
        required: true
    },
    availability: {
        type: String,  // Estado de disponibilidad del método de pago
        required: false
    },
    info: {
        type: String,  // Información adicional sobre el método de pago
        default: ''
    },
    activeInMethods: [
        {
            type: String
        }
    ]
}, {
    timestamps: true  // Agrega los campos createdAt y updatedAt automáticamente
});

// Crear y exportar el modelo
const Payment = mongoose.model('Payment', paymentSchema);

module.exports = Payment;
