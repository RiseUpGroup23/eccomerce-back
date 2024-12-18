const express = require('express');
const Category = require('../models/category/categoryModel');

const router = express.Router();

router.post('/', async (req, res) => {
    try {
        const newCategory = new Category(req.body);
        const categorySaved = await newCategory.save();
        res.status(201).json(categorySaved);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/', async (req, res) => {
    try {
        const categorys = await Category.find();
        res.json(categorys);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);
        if (!category) return res.status(404).json({ error: 'Categoría no encontrada' });
        res.json(category);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

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

router.delete('/:id', async (req, res) => {
    try {
        const categoryDeleted = await Category.findByIdAndDelete(req.params.id);
        if (!categoryDeleted) return res.status(404).json({ error: 'Categoría no encontrada' });
        res.json({ message: 'Categoría eliminada con éxito' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
