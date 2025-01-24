const express = require('express');
const router = express.Router();
const Order = require('../models/orders/orderModel');

// Crear una nueva orden
router.post('/create', async (req, res) => {
    const { user, products, totalAmount, orderStatus, shippingAddress, paymentMethod, paymentStatus } = req.body;

    try {
        const newOrder = new Order({
            user,
            products,
            totalAmount,
            orderStatus: orderStatus || 'pending',  // Valor por defecto
            shippingAddress,
            paymentMethod,
            paymentStatus: paymentStatus || 'pending', // Valor por defecto
        });

        await newOrder.save();
        res.status(201).json(newOrder);  // Responde con la orden creada
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al crear la orden' });
    }
});

// Obtener todas las órdenes
router.get('/', async (req, res) => {
    try {
        const orders = await Order.find().populate('user').populate('products.productId'); // Populate para obtener los detalles completos del usuario y producto
        res.status(200).json(orders);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener las órdenes' });
    }
});

// Obtener una orden por ID
router.get('/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const order = await Order.findById(id).populate('user').populate('products.productId');

        if (!order) {
            return res.status(404).json({ message: 'Orden no encontrada' });
        }

        res.status(200).json(order);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener la orden' });
    }
});

// Actualizar una orden por ID
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { products, totalAmount, orderStatus, shippingAddress, paymentMethod, paymentStatus } = req.body;

    try {
        const order = await Order.findById(id);

        if (!order) {
            return res.status(404).json({ message: 'Orden no encontrada' });
        }

        // Actualizamos los campos que se pasan en el cuerpo de la solicitud
        order.products = products || order.products;
        order.totalAmount = totalAmount || order.totalAmount;
        order.orderStatus = orderStatus || order.orderStatus;
        order.shippingAddress = shippingAddress || order.shippingAddress;
        order.paymentMethod = paymentMethod || order.paymentMethod;
        order.paymentStatus = paymentStatus || order.paymentStatus;
        order.updatedAt = Date.now();  // Actualizamos la fecha de modificación

        await order.save();
        res.status(200).json(order);  // Responde con la orden actualizada
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al actualizar la orden' });
    }
});

// Eliminar una orden por ID
router.delete('/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const order = await Order.findById(id);

        if (!order) {
            return res.status(404).json({ message: 'Orden no encontrada' });
        }

        await order.remove();
        res.status(200).json({ message: 'Orden eliminada exitosamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al eliminar la orden' });
    }
});
