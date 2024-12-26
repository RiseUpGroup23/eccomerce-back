const express = require('express');
const Product = require('../models/product/productModel');
const Categoria = require('../models/category/categoryModel');

const router = express.Router();


// Crear un producto (POST)
router.post('/', async (req, res) => {
    try {
        const { category } = req.body;

        // Verifica si la categoría existe || RECIBE ID DEL FRONT
        const categoriaExistente = await Categoria.findById(category);
        if (!categoriaExistente) return res.status(404).json({ error: 'Categoría no encontrada' });

        const nuevoProducto = new Product(req.body);
        const productoGuardado = await nuevoProducto.save();
        res.status(201).json(productoGuardado);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/', async (req, res) => {
    try {
        const productos = await Product.find();
        res.json(productos);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


router.get('/:id', async (req, res) => {
    try {
        const producto = await Product.findById(req.params.id);
        if (!producto) return res.status(404).json({ error: 'Producto no encontrado' });
        res.json(producto);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/link/:linkProducto', async (req, res) => {
    try {
        const producto = await Product.findOne({ link: req.params.linkProducto });
        if (!producto) return res.status(404).json({ error: 'Producto no encontrado' });
        res.json(producto);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


router.put('/:id', async (req, res) => {
    try {
        const productoActualizado = await Product.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        if (!productoActualizado) return res.status(404).json({ error: 'Producto no encontrado' });
        res.json(productoActualizado);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const productoEliminado = await Product.findByIdAndDelete(req.params.id);
        if (!productoEliminado) return res.status(404).json({ error: 'Product no encontrado' });
        res.json({ message: 'Producto eliminado con éxito' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
