const express = require('express');
const Cart = require('../models/cart/cartModel');
const Producto = require('../models/product/productModel');
const crypto = require('crypto');
const clearExpiredCarts = require("./modules/cleanExpiredCarts")
const router = express.Router();

// Endpoint para obtener el minicart: recibo los id me devuelve todos los datos de los productos
router.post("/get-minicart", async (req, res) => {
    const { cart } = req.body;

    try {
        // Extraemos solo los IDs de los productos del carrito
        const productIds = cart.map(item => item._id);

        // Realizamos la búsqueda de todos los productos que coinciden con los IDs
        const products = await Producto.find({
            _id: { $in: productIds }
        })  // Traemos _id, stock, name y price de los productos

        // Para devolver un array con los productos y su cantidad (de acuerdo al carrito)
        const result = cart.map(item => {
            const product = products.find(p => p._id.toString() === item._id);
            return {
                ...product.toObject(), // Convirtiendo el objeto de mongoose a JSON
                quantity: item.quantity  // Añadimos la cantidad del producto en el carrito
            };
        });

        // Respondemos con los productos encontrados y sus cantidades
        res.json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error al obtener los productos" });
    }
});

// Endpoint para simular el carrito (verificar disponibilidad sin reservar productos)
router.post('/simulate-cart', async (req, res) => {
    const { cartItems, cartId } = req.body;

    try {
        // 1. Obtener los productos necesarios con los campos que necesitamos
        const productIds = cartItems.map(item => item.product);

        // Usamos `.select()` para traer solo los campos que necesitamos: _id y stock
        const products = await Producto.find({ '_id': { $in: productIds } })
            .select('_id stock name'); // Traemos solo _id, stock y nombre

        const cart = cartId && await Cart.findOne({ _id: cartId });

        // 2. Verificar la disponibilidad de los productos
        const productsAvailability = cartItems.map((item) => {
            const product = products.find(p => p._id.toString() === item.product.toString());
            const alreadyInCart = cart && cart.items.find(elem => elem.product.toString() === item.product.toString());

            if (product) {
                const isAvailable = (product.stock + (alreadyInCart ? alreadyInCart.quantity : 0)) >= item.quantity;
                return {
                    name: product.name,
                    product: product._id, // Solo devolver el _id del producto
                    stockAvailable: isAvailable, // Si el stock es suficiente
                };
            } else {
                return {
                    product: item.product, // Si no se encuentra el producto, devolver el productId de la solicitud
                    stockAvailable: false, // No disponible si no se encontró el producto
                };
            }
        });

        // 3. Enviar la respuesta con la disponibilidad de los productos
        res.json({ simulation: productsAvailability });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al verificar la disponibilidad de los productos' });
    }
});


// Endpoint para reservar los productos en el carrito
router.post('/reserve-cart', async (req, res) => {
    const { cartId, cartItems } = req.body;

    try {
        // 1. Verificar si el carrito existe
        let cart = cartId && await Cart.findOne({ _id: cartId });

        // Si el carrito no existe, crear uno nuevo
        if (!cart) {
            cart = new Cart({
                items: cartItems
            });
            await cart.save();
        }

        // 2. Actualizar la fecha de modificación del carrito para renovar la expiración
        cart.updatedAt = new Date();

        // 3. Obtener los productos necesarios con los campos que necesitamos
        const productIds = cartItems.map(item => item.product);

        // Usamos `.select()` para traer solo los campos que necesitamos: _id y stock
        const products = await Producto.find({ '_id': { $in: productIds } })
            .select('_id stock name'); // Traemos solo _id y stock

        // 4. Reducir el stock de los productos que están disponibles
        let itemsUpdated = [];

        for (const item of cartItems) {
            const product = products.find(p => p._id.toString() === item.product);

            if (product && product.stock >= item.quantity) {
                // Reducir el stock de los productos reservados
                product.stock -= item.quantity;
                await product.save();
                // Agregar el producto al carrito
                itemsUpdated.push({
                    product: item.product,
                    quantity: item.quantity
                });
            } else {
                // Si el producto no tiene stock suficiente, retornar un error
                return res.status(400).json({ message: `Producto ${item.product} no tiene suficiente stock` });
            }
        }

        // 5. Reemplazar los items actuales con los nuevos productos
        cart.items = itemsUpdated;

        // Guardar los cambios en el carrito
        await cart.save();


        // 6. Confirmar la reserva sin devolver información del stock
        res.json({ message: 'Productos reservados con éxito', cartId: cart._id });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al reservar los productos' });
    }
});


// Validar un carrito por ID
router.get('/check/:cartId', async (req, res) => {
    try {
        const cart = await Cart.findOne({ _id: req.params.cartId })

        if (!cart) {
            return res.status(404).json({ error: 'Carrito no encontrado' });
        }

        // Actualizar el campo updatedAt
        cart.updatedAt = new Date();
        await cart.save(); // Guardar los cambios en el carrito

        res.json(cart);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Vaciar el carrito y restaurar el stock de los productos
router.delete('/:cartId', async (req, res) => {
    try {
        const cart = await Cart.findById(req.params.cartId);
        if (!cart) return res.status(404).json({ error: 'Carrito no encontrado' });

        // Restaurar el stock de los productos en el carrito
        for (const item of cart.items) {
            const product = await Producto.findById(item.product);
            if (product) {
                product.stock += item.quantity;  // Restaurar el stock
                await product.save();
            }
        }

        // Eliminar el carrito
        await Cart.deleteOne({ _id: cart._id });

        res.json({ message: 'Carrito eliminado y stock restaurado con éxito' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


module.exports = router;
