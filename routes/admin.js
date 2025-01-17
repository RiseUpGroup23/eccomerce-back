const express = require('express');
const Product = require('../models/product/productModel');

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

        // Filtrar por nombre (q)
        if (q) {
            filterConditions.name = { $regex: q, $options: 'i' };  // Buscamos de manera insensible a mayúsculas/minúsculas
        }

        // Filtros de categoría y subcategoría
        if (category) filterConditions.category = category;
        if (subcategory) filterConditions.subcategory = subcategory;

        // Consultar los productos con filtros y paginación, y poblar las relaciones
        const productos = await Product.find(filterConditions)
            .skip(skip)
            .limit(limit)
            .populate('category')        // Poblar la relación con la categoría
            .populate('subcategory');    // Poblar la relación con la subcategoría

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

module.exports = rout
