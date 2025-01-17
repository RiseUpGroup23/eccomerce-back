const express = require('express');
const Category = require('../models/category/categoryModel');

const router = express.Router();

// Crear una categoría (POST)
router.post('/', async (req, res) => {
    try {
        const newCategory = new Category(req.body);
        const categorySaved = await newCategory.save();
        res.status(201).json(categorySaved);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Obtener todas las categorías (GET)
router.get('/', async (req, res) => {
    try {
        const categories = await Category.find().populate('subcategories');
        res.json(categories);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Obtener una categoría por ID (GET)
router.get('/:id', async (req, res) => {
    try {
        const category = await Category.findById(req.params.id).populate('subcategories');
        if (!category) return res.status(404).json({ error: 'Categoría no encontrada' });
        res.json(category);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Obtener subcategorías de una categoría por ID (GET)
router.get('/:idCategoria/subcategorias', async (req, res) => {
    try {
        const { idCategoria } = req.params;

        // Buscar la categoría por su ID
        const category = await Category.findById(idCategoria);
        if (!category) return res.status(404).json({ error: 'Categoría no encontrada' });

        // Devolver las subcategorías asociadas
        const subcategorias = await Category.find({ _id: { $in: category.subcategories } });

        if (!subcategorias || subcategorias.length === 0) {
            return res.status(404).json({ error: 'No se encontraron subcategorías para esta categoría' });
        }

        res.json(subcategorias);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Actualizar una categoría (PUT)
router.put('/:id', async (req, res) => {
    try {
        const categoryUpdated = await Category.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        if (!categoryUpdated) return res.status(404).json({ error: 'Categoría no encontrada' });
        res.json(categoryUpdated);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Eliminar una categoría (DELETE)
router.delete('/:id', async (req, res) => {
    try {
        const categoryDeleted = await Category.findByIdAndDelete(req.params.id);
        if (!categoryDeleted) return res.status(404).json({ error: 'Categoría no encontrada' });
        res.json({ message: 'Categoría eliminada con éxito' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Agregar una subcategoría a una categoría (POST)
router.post('/:id/subcategory', async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);
        if (!category) return res.status(404).json({ error: 'Categoría no encontrada' });

        // Verifica que el ID de la subcategoría sea válido
        const subcategoryId = req.body.subcategoryId;
        const subcategory = await Category.findById(subcategoryId);
        if (!subcategory) return res.status(404).json({ error: 'Subcategoría no encontrada' });

        // Agregar la subcategoría al array de subcategorías de la categoría principal
        category.subcategories.push(subcategoryId);
        await category.save();

        res.status(201).json(category);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Eliminar una subcategoría de una categoría (DELETE)
router.delete('/:id/subcategory/:subcategoryId', async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);
        if (!category) return res.status(404).json({ error: 'Categoría no encontrada' });

        // Eliminar la subcategoría del array de subcategorías
        const subcategoryIndex = category.subcategories.indexOf(req.params.subcategoryId);
        if (subcategoryIndex === -1) return res.status(404).json({ error: 'Subcategoría no encontrada' });

        category.subcategories.splice(subcategoryIndex, 1);
        await category.save();

        res.json({ message: 'Subcategoría eliminada con éxito' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
