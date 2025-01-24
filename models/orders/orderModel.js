const mongoose = require('mongoose');

// Definición del esquema de Order
const orderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    products: [{
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Producto',
            required: true
        },
        quantity: {
            type: Number,
            required: true,
            min: 1
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
        type: String,
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

// Pre-save hook para actualizar el campo `updatedAt` cada vez que se modifique una orden
orderSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

// Crear y exportar el modelo
const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
