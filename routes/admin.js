const express = require('express');
const Product = require('../models/product/productModel');
const Category = require('../models/category/categoryModel');
const Order = require('../models/orders/orderModel');

const router = express.Router();

// Ruta para obtener productos con paginación, filtros por nombre, categoría y subcategoría
router.get('/products', async (req, res) => {
    try {
        const { page = 1, itemsPerPage = 10, category, subcategory, q } = req.query;

        // Calcular la cantidad de saltos (skip) y el límite (limit) de los productos
        const skip = (page - 1) * itemsPerPage;
        const limit = parseInt(itemsPerPage, 10);

        // Filtros de nombre, categoría y subcategoría (si se proporcionan)
        const filterConditions = {};

        // Filtrar por nombre (q) si se pasa en la consulta
        if (q) {
            filterConditions.name = { $regex: new RegExp(q, 'i') }; // Asegurarse de que la regex sea correcta
        }

        // Filtros de categoría por ID
        if (category) {
            // Verificar que el category es un ID válido antes de buscarlo
            const validCategory = await Category.findById(category);
            if (validCategory) {
                // Si se pasa una categoría, filtrar por el ID de la categoría
                filterConditions.category = category;
            } else {
                return res.status(400).json({ error: 'Categoría no válida.' });
            }
        }

        // Filtros de subcategoría por nombre dentro de la categoría seleccionada
        if (subcategory && category) {
            // Verificar si la categoría tiene la subcategoría proporcionada
            const validCategory = await Category.findById(category);
            if (validCategory) {
                // Verificar si la subcategoría está en el arreglo de subcategorías de la categoría
                if (validCategory.subcategories.includes(subcategory)) {
                    filterConditions.subcategory = subcategory;
                } else {
                    return res.status(400).json({ error: 'Subcategoría no válida para esta categoría.' });
                }
            } else {
                return res.status(400).json({ error: 'Categoría no válida.' });
            }
        }

        // Consultar los productos con filtros y paginación, y poblar las relaciones
        const productos = await Product.find(filterConditions)
            .skip(skip)
            .limit(limit)
            .populate('category')        // Poblar la relación con la categoría
            .populate('subcategory');        // Poblar la relación con la categoría

        // Contar el total de productos para calcular el total de páginas
        const totalOfItems = await Product.countDocuments(filterConditions);

        // Determinar si hay más páginas
        const nextPage = (page * itemsPerPage) < totalOfItems;

        // Enviar la respuesta con los productos, el total de elementos y si hay una siguiente página
        res.json({
            products: productos,
            nextPage,
            totalOfItems
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Ruta para obtener categorías con paginación, filtros por nombre
router.get('/categories', async (req, res) => {
    try {
        const { page = 1, itemsPerPage = 10, q } = req.query;

        // Calcular la cantidad de saltos (skip) y el límite (limit) de las categorías
        const skip = (page - 1) * itemsPerPage;
        const limit = parseInt(itemsPerPage, 10);

        // Filtro de nombre (q) si se pasa en la consulta
        const filterConditions = {};

        // Filtro por nombre de categoría
        if (q) {
            filterConditions.name = { $regex: new RegExp(q, 'i') }; // Asegurarse de que la regex sea correcta
        }

        // Consultar las categorías con los filtros y paginación
        const categories = await Category.find(filterConditions)
            .skip(skip)
            .limit(limit);

        // Contar el total de categorías para calcular el total de páginas
        const totalOfItems = await Category.countDocuments(filterConditions);

        // Determinar si hay más páginas
        const nextPage = (page * itemsPerPage) < totalOfItems;

        // Enviar la respuesta con las categorías, el total de elementos y si hay una siguiente página
        res.json({
            categories,
            nextPage,
            totalOfItems
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Ruta para obtener ordenes con paginación, filtros por nombre
router.get('/orders', async (req, res) => {
    try {
        const { page = 1, itemsPerPage = 10, q } = req.query;

        // Calcular la cantidad de saltos (skip) y el límite (limit) de las categorías
        const skip = (page - 1) * itemsPerPage;
        const limit = parseInt(itemsPerPage, 10);

        // Filtro de nombre (q) si se pasa en la consulta
        const filterConditions = {};

        // Filtro por nombre de categoría
        if (q) {
            filterConditions.name = { $regex: new RegExp(q, 'i') }; // Asegurarse de que la regex sea correcta
        }

        // Consultar las categorías con los filtros y paginación
        const orders = await Order.find(filterConditions)
            .skip(skip)
            .limit(limit);

        // Contar el total de categorías para calcular el total de páginas
        const totalOfItems = await Order.countDocuments(filterConditions);

        // Determinar si hay más páginas
        const nextPage = (page * itemsPerPage) < totalOfItems;

        // Enviar la respuesta con las categorías, el total de elementos y si hay una siguiente página
        res.json({
            orders,
            nextPage,
            totalOfItems
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
