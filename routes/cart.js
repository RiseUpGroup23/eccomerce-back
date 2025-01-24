const express = require('express');
const Cart = require('../models/cart/cartModel');
const Producto = require('../models/product/productModel');
const crypto = require('crypto');

const router = express.Router();

// GET Minicart: recibo los id me devuelve todos los datos de los productos
router.post("/get-minicart", async (req, res) => {
    const { cart } = req.body;

    try {
        // Extraemos solo los IDs de los productos del carrito
        const productIds = cart.map(item => item.id);

        // Realizamos la búsqueda de todos los productos que coinciden con los IDs
        const products = await Producto.find({
            _id: { $in: productIds }
        });

        // Para devolver un array con los productos y su cantidad (de acuerdo al carrito)
        const result = cart.map(item => {
            const product = products.find(p => p._id.toString() === item.id);
            return {
                ...product.toObject(), // Convirtiendo el objeto de mongoose a JSON
                quantity: item.quantity
            };
        });

        // Respondemos con los productos encontrados y sus cantidades
        res.json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error al obtener los productos" });
    }
});


// Crear un carrito nuevo | a la hora de tocar el boton del carrito si aun no agregamos productos o creacion de pag
router.post('/', async (req, res) => {
    try {
        const cartId = crypto.randomUUID(); // Generar un ID único para el carrito
        const newCart = new Cart({ cartId, items: [] }); // Incluye el cartId generado
        const cartSaved = await newCart.save();
        res.status(201).json(cartSaved);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// Obtener un carrito por ID | a la hora de querer mostrar el creado con el anterior id
router.get('/:cartId', async (req, res) => {
    try {
        const cart = await Cart.findOne({ _id: req.params.cartId }).populate('items.productId', 'nombre precio');
        if (!cart) return res.status(404).json({ error: 'Carrito no encontrado' });
        res.json(cart);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Agregar un producto al carrito | creo que se podria generar el carrito cuando se agregue aunque tambien estaria bien mostrarlo vacio
router.post('/:cartId', async (req, res) => {
    try {
        const { productId, quantity } = req.body;

        let cart = await Cart.findById(req.params.cartId);

        if (!cart) {
            // Si no existe el carrito, crearlo | opte por esto para no crear carritos cada vez que e habra la pag, se podria ver de usar uno que se guarde en local storage, cookies y blabla, dejo las dos opciones pa queelijas
            cart = new Cart({ _id: req.params.cartId, items: [] });
        }

        const productIndex = cart.items.findIndex(item => item.productId.toString() === productId);
        if (productIndex > -1) {
            cart.items[productIndex].quantity += quantity;
        } else {
            cart.items.push({ productId, quantity });
        }

        const updatedCart = await cart.save();
        res.json(updatedCart);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Eliminar un producto del carrito | boton en el prodcuto en el carrito
router.delete('/:cartId/:productId', async (req, res) => {
    try {
        const { cartId, productId } = req.params;

        const cart = await Cart.findById(cartId);
        if (!cart) return res.status(404).json({ error: 'Carrito no encontrado' });

        cart.items = cart.items.filter(item => item.productId.toString() !== productId);
        const updatedCart = await cart.save();
        res.json(updatedCart);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Vaciar el carrito | "eliminar todos los productos" queda creado pero vacio
router.delete('/:cartId', async (req, res) => {
    try {
        const cart = await Cart.findById(req.params.cartId);
        if (!cart) return res.status(404).json({ error: 'Carrito no encontrado' });

        cart.items = [];
        const updatedCart = await cart.save();
        res.json({ message: 'Carrito vaciado con éxito', cart: updatedCart });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router