const mongoose = require('mongoose');

// Definición del esquema de Order
const orderSchema = new mongoose.Schema({
    orderId: {
        type: Number,
        unique: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    products: [{
        quantity: {
            type: Number,
            required: true
        },
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Producto',
            required: true
        }
    }],
    totalAmount: {
        type: Number,
        required: true
    },
    orderStatus: {
        type: String,
        default: 'pending'
    },
    logistics: {
        selectedMethod: {
            type: String,
            enum: ["delivery", "pickup"]
        },
        delivery: {
            address: {
                type: String,
                default: ''
            },
            geo: {
                type: [Number],
                default: []
            },
            observations: {
                type: String,
                default: ''
            },
            receiverPhone: {
                type: String,
                default: ''
            },
            receiverName: {
                type: String,
                default: ''
            }
        },
        pickup: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Pickup'
        }
    },
    paymentMethod: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Payment',
        required: true
    },
    paymentStatus: {
        type: String,
        default: 'pending'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Pre-save hook para actualizar el campo `updatedAt` y generar el `orderId` automáticamente
orderSchema.pre('save', async function (next) {
    this.updatedAt = Date.now();

    // Si es una nueva orden (no tiene `orderId` asignado), generar el `orderId`
    if (!this.orderId) {
        try {
            const lastOrder = await mongoose.model('Order').findOne().sort({ orderId: -1 }); // Obtener el último orderId
            this.orderId = lastOrder ? lastOrder.orderId + 1 : 1; // Si existe, incrementar el último orderId; sino, comienza en 1
            next(); // Continúa con la operación de guardado
        } catch (error) {
            next(error); // Manejo de errores
        }
    } else {
        next(); // Si ya tiene un orderId, simplemente pasa al siguiente paso
    }
});

// Crear y exportar el modelo
const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
