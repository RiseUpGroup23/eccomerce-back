const express = require('express');
const mongoose = require('mongoose');
const Category = require('../models/category/categoryModel');
const SubCategory = require('../models/category/subCategoryModel');

const router = express.Router();

// Función utilitaria para generar links amigables
const generateLink = (base, name) => {
    if (!name || typeof name !== 'string') return '';

    const slug = name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^[-]+|[-]+$/g, '');

    return base ? `${base}/${slug}` : slug;
};

// Crear una categoría con subcategorías
router.post('/', async (req, res) => {
    try {
        const { name, description, subcategories = [] } = req.body;
        const categoryLink = generateLink('', name);

        const newCategory = new Category({ name, description, categoryLink, subcategories: [] });
        const savedCategory = await newCategory.save();

        const subcategoryIds = [];
        for (const { name: subName, description: subDesc } of subcategories) {
            const subLink = generateLink(savedCategory.categoryLink, subName);
            let sub = await SubCategory.findOne({ categoryLink: subLink });
            if (!sub) {
                sub = await new SubCategory({ name: subName, description: subDesc, categoryLink: subLink }).save();
            }
            subcategoryIds.push(sub._id);
        }

        savedCategory.subcategories = subcategoryIds;
        await savedCategory.save();

        res.status(201).json(savedCategory);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Obtener todas las categorías
router.get('/', async (_req, res) => {
    try {
        const categories = await Category.find().populate('subcategories');
        res.json(categories);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Obtener categoría por ID o categoryLink
router.get('/:idOrLink', async (req, res) => {
    try {
        const value = req.params.idOrLink.trim().toLowerCase();
        const category = mongoose.Types.ObjectId.isValid(value)
            ? await Category.findById(value).populate('subcategories')
            : await Category.findOne({ categoryLink: value }).populate('subcategories');

        if (!category) return res.status(404).json({ error: 'Categoría no encontrada' });

        const validSubs = await SubCategory.find({ '_id': { $in: category.subcategories } }).select('_id');
        const validIds = validSubs.map(sub => sub._id.toString());
        category.subcategories = category.subcategories.filter(sub => validIds.includes(sub._id.toString()));

        await category.save();
        res.json(category);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Obtener subcategorías de una categoría
router.get('/:id/subcategorias', async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);
        if (!category) return res.status(404).json({ error: 'Categoría no encontrada' });

        const subcategories = await SubCategory.find({ _id: { $in: category.subcategories } });
        res.json(subcategories);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Actualizar una categoría y sus subcategorías
router.put('/:id', async (req, res) => {
    try {
        const { name, description, subcategories = [] } = req.body;

        // Generar nuevo link de la categoría
        const categoryLink = generateLink('', name);

        // Buscar y actualizar la categoría
        const category = await Category.findById(req.params.id);
        if (!category) return res.status(404).json({ error: 'Categoría no encontrada' });

        category.name = name;
        category.description = description;
        category.categoryLink = categoryLink;

        const updatedSubcategoryIds = [];

        for (const sub of subcategories) {
            if (sub._id) {
                // Actualizar subcategoría existente
                const existingSub = await SubCategory.findById(sub._id);
                if (existingSub) {
                    existingSub.name = sub.name;
                    existingSub.description = sub.description;
                    existingSub.categoryLink = generateLink(categoryLink, sub.name);
                    await existingSub.save();
                    updatedSubcategoryIds.push(existingSub._id);
                }
            }
        }

        // Asignar subcategorías válidas
        category.subcategories = updatedSubcategoryIds;
        await category.save();

        const populatedCategory = await Category.findById(category._id).populate('subcategories');
        res.json(populatedCategory);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Eliminar una categoría
router.delete('/:id', async (req, res) => {
    try {
        const deleted = await Category.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ error: 'Categoría no encontrada' });
        res.json({ message: 'Categoría eliminada con éxito' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Agregar subcategoría a una categoría
router.post('/:id/subcategory', async (req, res) => {
    try {
        const { name, description } = req.body;
        if (!name) return res.status(400).json({ error: 'Falta el campo name para la subcategoría' });

        const category = await Category.findById(req.params.id);
        if (!category) return res.status(404).json({ error: 'Categoría no encontrada' });

        const subLink = generateLink(category.categoryLink, name);
        let sub = await SubCategory.findOne({ categoryLink: subLink });

        if (!sub) {
            sub = await new SubCategory({ name, description, categoryLink: subLink }).save();
        }

        category.subcategories.push(sub._id);

        const validSubs = await SubCategory.find({ '_id': { $in: category.subcategories } }).select('_id');
        const validIds = validSubs.map(sub => sub._id.toString());
        category.subcategories = category.subcategories.filter(id => validIds.includes(id.toString()));

        await category.save();
        res.status(201).json(category);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Eliminar subcategoría de una categoría
router.delete('/:id/subcategory/:subcategoryId', async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);
        if (!category) return res.status(404).json({ error: 'Categoría no encontrada' });

        category.subcategories = category.subcategories.filter(
            id => id.toString() !== req.params.subcategoryId
        );

        await SubCategory.findByIdAndDelete(req.params.subcategoryId);

        await category.save();
        res.json({ message: 'Subcategoría eliminada con éxito' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Obtener una subcategoría por ID
router.get('/subcategory/:id', async (req, res) => {
    try {
        const subcategory = await SubCategory.findById(req.params.id);
        if (!subcategory) return res.status(404).json({ error: 'Subcategoría no encontrada' });
        res.json(subcategory);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
