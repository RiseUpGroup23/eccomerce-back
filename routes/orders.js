const express = require('express');
const router = express.Router();
const Order = require('../models/orders/orderModel');
const Product = require('../models/product/productModel');
const User = require('../models/user/userModel');

router.post('/create', async (req, res) => {
    try {
        // Buscar el usuario por el email
        let user = await User.findOne({ email: req.body.user.email });

        // Si el usuario no existe, crearlo
        if (!user) {
            user = new User(req.body.user);  // Crear el usuario con los datos proporcionados
            await user.save();  // Guardar el nuevo usuario en la base de datos
        }

        // Crear la nueva orden y asignar el user.id
        const newOrder = new Order({
            ...req.body,
            user: user._id // Asignar el ID del usuario encontrado o creado
        });

        // Iterar sobre los productos de la orden y restar el stock
        for (let productItem of req.body.products) {
            // Buscar el producto por su ID
            let product = await Product.findById(productItem.product);

            // Si el producto existe y tiene suficiente stock, restar la cantidad
            if (product && product.stock >= productItem.quantity) {
                product.stock -= productItem.quantity;
                await product.save(); // Guardar el producto con el nuevo stock
            } else {
                // Si no hay suficiente stock, devolver un error
                return res.status(400).json({
                    message: `No hay suficiente stock para el producto ${product.name}`
                });
            }
        }

        // Guardar la nueva orden
        await newOrder.save();

        // Responder con la orden creada
        res.status(201).json(newOrder);
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

// Obtener una orden por orderId
router.get('/:orderId', async (req, res) => {
    const { orderId } = req.params;

    try {
        const order = await Order.findOne({ orderId }).populate('user').populate('products.product').populate('paymentMethod').populate('logistics.pickup');

        if (!order) {
            return res.status(404).json({ message: 'Orden no encontrada' });
        }

        res.status(200).json(order);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener la orden' });
    }
});

// Actualizar una orden por orderId
router.put('/:orderId', async (req, res) => {
    const { orderId } = req.params;
    const body = req.body;  // Usamos el objeto completo del cuerpo de la solicitud

    try {
        const order = await Order.findOne({ orderId });

        if (!order) {
            return res.status(404).json({ message: 'Orden no encontrada' });
        }

        // Usamos $set para actualizar directamente los campos en la base de datos
        await Order.updateOne({ orderId }, {
            $set: {
                ...body,  // Usamos todo el cuerpo para actualizar los campos
                updatedAt: Date.now()  // Aseguramos que la fecha de actualización sea correcta
            }
        });

        // Buscamos la orden actualizada y la devolvemos
        const updatedOrder = await Order.findOne({ orderId }).populate('user').populate('products.product').populate('paymentMethod');
        res.status(200).json(updatedOrder);  // Responde con la orden actualizada
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

module.exports = router