const express = require('express');
const Collection = require('../models/collection/collectionModel');
const Product = require('../models/product/productModel');

const router = express.Router();

// Create an empty collection (POST)
router.post('/', async (req, res) => {
    try {
        const { title, products } = req.body;

        // Create a new empty collection
        const newCollection = new Collection({ title, products });
        const savedCollection = await newCollection.save();
        res.status(201).json(savedCollection);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get all collections (GET)
router.get('/', async (req, res) => {
    try {
        const collections = await Collection.find();
        res.json(collections);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Obtener una colección por collectionId (GET)
router.get('/:collectionId', async (req, res) => {
    try {
        const collection = await Collection.findById(req.params.collectionId).populate('products');
        if (!collection) return res.status(404).json({ error: 'Colección no encontrada' });
        res.json(collection);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete a collection by ID (DELETE)
router.delete('/:id', async (req, res) => {
    try {
        const deletedCollection = await Collection.findByIdAndDelete(req.params.id);
        if (!deletedCollection) return res.status(404).json({ error: 'Colección no encontrada' });
        res.json({ message: 'Colección eliminada con éxito' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Edit a collection by ID (PUT)
router.put('/:id', async (req, res) => {
    try {
        const updatedCollection = await Collection.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        if (!updatedCollection) return res.status(404).json({ error: 'Colección no encontrada' });
        res.json(updatedCollection);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Add a product to a collection (PUT)
router.put('/:id/add-product', async (req, res) => {
    try {
        const { productId } = req.body;

        // Verifica si el producto existe
        const existingProduct = await Product.findById(productId);
        if (!existingProduct) {
            console.error(`Producto con ID ${productId} no encontrado`); // Log de error si no se encuentra el producto
            return res.status(404).json({ error: 'Producto no encontrado' });
        }

        // Encuentra la colección por su ID
        const collection = await Collection.findById(req.params.id);
        if (!collection) {
            console.error(`Colección con ID ${req.params.id} no encontrada`); // Log de error si no se encuentra la colección
            return res.status(404).json({ error: 'Colección no encontrada' });
        }

        // Agrega el producto a la colección (si no está ya en ella)
        if (!collection.products.includes(productId)) {
            collection.products.push(productId);
            await collection.save();
            res.status(200).json({ message: 'Producto agregado a la colección', collection });
        } else {
            console.error(`El producto con ID ${productId} ya está en la colección`); // Log de error si el producto ya está en la colección
            res.status(400).json({ error: 'El producto ya está en la colección' });
        }
    } catch (err) {
        console.error(err); // Log del error
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
