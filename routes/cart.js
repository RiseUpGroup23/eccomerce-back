const express = require('express');
const Cart = require('../models/cart/cartModel');
const Producto = require('../models/product/productModel');
const router = express.Router();

router.get("/check/:cartId", async (req, res) => {
    try {
        const { cartId } = req.params
        const cartDB = await Cart.findById(cartId);
        return res.json(cartDB)
    } catch (error) {
        res.status(404).send("Carrito no encontrado")
    }

})

// Endpoint para obtener el minicart
router.post("/get-minicart", async (req, res) => {
    const { cart } = req.body;

    try {
        // Extraer los IDs de los productos del carrito
        const productIds = cart.map(item => item.product);

        // Buscar los productos con sus variantes
        const products = await Producto.find({ _id: { $in: productIds } });

        // Construir la respuesta con detalles de variantes y sucursales
        const result = cart.map(item => {
            const product = products.find(p => p._id.toString() === item.product);
            const variant = product.variants.id(item.variant); // Obtener la variante específica

            return {
                ...product.toObject(),
                variant: variant, // Incluir detalles de la variante
                pickup: item.pickup, // Incluir la sucursal seleccionada
                quantity: item.quantity
            };
        });

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
        // Obtener los productos con sus variantes
        const productIds = cartItems.map(item => item.product);
        const products = await Producto.find({ _id: { $in: productIds } });

        // Verificar la disponibilidad de cada ítem
        const productsAvailability = cartItems.map(item => {
            const product = products.find(p => p._id.toString() === item.product);
            const variant = product.variants.id(item.variant); // Obtener la variante
            const stockEntry = variant.stockByPickup.find(sp => sp.pickup.equals(item.pickup)); // Buscar stock en la sucursal

            if (!stockEntry || stockEntry.quantity < item.quantity) {
                return {
                    product: item.product,
                    variant: item.variant,
                    pickup: item.pickup,
                    stockAvailable: false
                };
            }

            return {
                product: item.product,
                variant: item.variant,
                pickup: item.pickup,
                stockAvailable: true
            };
        });

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
        // Verificar si el carrito existe
        let cart = cartId && await Cart.findOne({ _id: cartId });

        // Si el carrito no existe, crear uno nuevo
        if (!cart) {
            cart = new Cart({
                items: cartItems
            });
        }

        // Actualizar la fecha de modificación del carrito
        cart.updatedAt = new Date();

        // Obtener los productos con sus variantes
        const productIds = cartItems.map(item => item.product);
        const products = await Producto.find({ _id: { $in: productIds } });

        // Reducir el stock de los productos reservados
        for (const item of cartItems) {
            const product = products.find(p => p._id.toString() === item.product);
            const variant = product.variants.id(item.variant); // Obtener la variante
            const stockEntry = variant.stockByPickup.find(sp => sp.pickup.equals(item.pickup)); // Buscar stock en la sucursal

            if (!stockEntry || stockEntry.quantity < item.quantity) {
                return res.status(400).json({ message: `Stock insuficiente para la variante ${item.variant} en la sucursal ${item.pickup}` });
            }

            // Reducir el stock
            stockEntry.quantity -= item.quantity;
            await product.save();
        }

        // Guardar los cambios en el carrito
        cart.items = cartItems;
        await cart.save();

        res.json({ message: 'Productos reservados con éxito', cartId: cart._id });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al reservar los productos' });
    }
});

// Endpoint para vaciar el carrito y restaurar el stock
router.delete('/:cartId', async (req, res) => {
    try {
        const cart = await Cart.findById(req.params.cartId);
        if (!cart) return res.status(404).json({ error: 'Carrito no encontrado' });

        // Restaurar el stock de los productos en el carrito
        for (const item of cart.items) {
            const product = await Producto.findById(item.product);
            const variant = product.variants.id(item.variant); // Obtener la variante
            const stockEntry = variant.stockByPickup.find(sp => sp.pickup.equals(item.pickup)); // Buscar stock en la sucursal

            if (stockEntry) {
                stockEntry.quantity += item.quantity; // Restaurar el stock
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