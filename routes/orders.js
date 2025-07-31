const express = require('express');
const router = express.Router();
const Order = require('../models/orders/orderModel');
const Product = require('../models/product/productModel');
const User = require('../models/user/userModel');
const Cart = require('../models/cart/cartModel');
const { sendEmail, thanksEmailTemplate } = require('./modules/mailer');
const auth = require('../middlewares/auth');

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

        // Eliminar el carrito relacionado
        await Cart.deleteOne({ _id: req.body.cartId });

        // Guardar la nueva orden
        await newOrder.save();

        // Enviar mail de confirmacion
        const htmlEmailTemplate = await thanksEmailTemplate({
            order: newOrder,
            user: user
        })
        await sendEmail({
            toEmail: user.email,
            toName: user.name,
            subject: "Confirmación de compra",
            htmlContent: htmlEmailTemplate,
            textContent: ""
        })

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

// Obtener órdenes por intervalo de fechas
router.get('/getByInterval', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        if (!startDate || !endDate) {
            return res.status(400).json({ message: 'Debes proporcionar startDate y endDate en la query.' });
        }

        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        const orders = await Order.find({
            createdAt: { $gte: start, $lte: end }
        })
            .select('orderId createdAt orderStatus totalAmount logistics paymentMethod user products') // ⬅️ solo campos necesarios
            .populate({
                path: 'user',
                select: 'name' // solo nombre del cliente
            })
            .populate({
                path: 'products.product',
                select: 'name' // solo nombre del producto
            })
            .populate({
                path: 'paymentMethod',
                select: 'name' // solo nombre del método de pago
            })
            .populate({
                path: 'logistics.pickup',
                select: 'name' // solo nombre del punto de retiro
            });

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
router.put('/:orderId',auth, async (req, res) => {
    const { orderId } = req.params;
    const body = req.body;  // Usamos el objeto completo del cuerpo de la solicitud

    try {
        const order = await Order.findOne({ orderId });

        if (!order) {
            return res.status(404).json({ message: 'Orden no encontrada' });
        }

        if (body.orderStatus === "canceled") {
            // Restaurar el stock de los productos
            for (const item of order.products) {
                const product = await Product.findById(item.product).populate();

                if (product) {
                    // Buscar la variante y sucursal correspondiente
                    const variant = product.variants.find(v => v.id === item.variant);
                    if (variant) {
                        const stockEntry = variant.stockByPickup.find(sp => sp.pickup.toString() === item.seller);
                        if (stockEntry) {
                            // Restaurar el stock
                            stockEntry.totalSold -= item.quantity;
                            stockEntry.quantity += item.quantity;
                            await product.save();
                        }
                    }
                }
            }
        }

        // Usamos $set para actualizar directamente los campos en la base de datos
        await Order.updateOne({ orderId }, {
            $set: {
                ...body,  // Usamos todo el cuerpo para actualizar los campos
                updatedAt: Date.now()  // Aseguramos que la fecha de actualización sea correcta
            }
        });

        // Buscamos la orden actualizada y la devolvemos
        const updatedOrder = await Order.findOne({ orderId }).populate('user').populate('products.product').populate('paymentMethod').populate('logistics.pickup');
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
        const deletedOrder = await Order.findByIdAndDelete(id);

        if (!deletedOrder) {
            return res.status(404).json({ message: 'Orden no encontrada' });
        }

        res.status(200).json({ message: 'Orden eliminada correctamente' });
    } catch (error) {
        console.error('Error al eliminar la orden:', error);
        res.status(500).json({ message: 'Error del servidor al eliminar la orden' });
    }
});

module.exports = router