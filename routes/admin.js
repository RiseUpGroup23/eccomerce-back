const express = require('express');
const Product = require('../models/product/productModel');
const Category = require('../models/category/categoryModel');
const Order = require('../models/orders/orderModel');
const User = require('../models/user/userModel');

const router = express.Router();

// Ruta para obtener productos con paginación, filtros por nombre, categoría y subcategoría
router.get('/products', async (req, res) => {
    try {
        const { page = 1, itemsPerPage = 10, category, subcategory, q, sortBy = 'name', sortOrder = 'asc' } = req.query;

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

        // Ordenar por el campo seleccionado
        const sortFields = {};
        if (['stock', 'sellingPrice', 'name'].includes(sortBy)) {
            sortFields[sortBy] = sortOrder === 'desc' ? -1 : 1; // 1 es ascendente, -1 es descendente
        } else {
            // Si no se proporciona un campo válido, ordenar por nombre de forma ascendente por defecto
            sortFields['name'] = 1;
        }

        // Consultar los productos con filtros, paginación, y ordenar por los campos seleccionados
        const productos = await Product.find(filterConditions)
            .skip(skip)
            .limit(limit)
            .sort(sortFields) // Aplicar el orden
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

router.get('/orders', async (req, res) => {
    try {
        const { page = 1, itemsPerPage = 10, q, sortBy = 'orderId', sortOrder = 'asc' } = req.query;

        // Calcular la cantidad de saltos (skip) y el límite (limit) de las órdenes
        const skip = (page - 1) * itemsPerPage;
        const limit = parseInt(itemsPerPage, 10);

        // Filtro de nombre (q) si se pasa en la consulta
        const filterConditions = {};

        // Filtro por nombre de pedido (q)
        if (q) {
            filterConditions.orderId = { $regex: new RegExp(q, 'i') }; // Asegurarse de que la regex sea correcta
        }

        // Crear el objeto de ordenación
        const sortConditions = {};
        if (sortBy === 'customerName') {
            sortConditions['user.name'] = sortOrder === 'asc' ? 1 : -1;
        } else if (sortBy === 'createdAt') {
            sortConditions['createdAt'] = sortOrder === 'asc' ? 1 : -1;
        } else if (sortBy === 'totalAmount') {
            sortConditions['totalAmount'] = sortOrder === 'asc' ? 1 : -1;
        } else {
            // Por defecto, ordenar por orderId
            sortConditions['orderId'] = sortOrder === 'asc' ? 1 : -1;
        }

        // Consultar las órdenes con los filtros y paginación
        const orders = await Order.find(filterConditions)
            .populate("user") // Suponiendo que la propiedad 'user' es un ObjectId de la colección de usuarios
            .skip(skip)
            .limit(limit)
            .sort(sortConditions);  // Aplicar la ordenación

        // Contar el total de órdenes para calcular el total de páginas
        const totalOfItems = await Order.countDocuments(filterConditions);

        // Determinar si hay más páginas
        const nextPage = (page * itemsPerPage) < totalOfItems;

        // Enviar la respuesta con las órdenes, el total de elementos y si hay una siguiente página
        res.json({
            orders,
            nextPage,
            totalOfItems
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// Ruta para obtener usuarios con paginación y filtro por nombre, email o teléfono
router.get('/users', async (req, res) => {
    try {
        const { page = 1, itemsPerPage = 10, q } = req.query;  // Obtener la página, items por página y la query de búsqueda

        // Calcular la cantidad de saltos (skip) y el límite (limit) de la paginación
        const skip = (page - 1) * itemsPerPage;
        const limit = parseInt(itemsPerPage, 10);

        // Construir las condiciones de búsqueda (filtro por name, email o phone)
        const filterConditions = {};

        if (q) {
            filterConditions.$or = [
                { name: { $regex: new RegExp(q, 'i') } },  // Filtro por nombre
                { email: { $regex: new RegExp(q, 'i') } }, // Filtro por correo
                { phone: { $regex: new RegExp(q, 'i') } }  // Filtro por teléfono
            ];
        }

        // Consultar los usuarios con los filtros y la paginación
        const users = await User.find(filterConditions)
            .skip(skip)
            .limit(limit);

        // Contar el total de usuarios que coinciden con las condiciones para calcular el total de páginas
        const totalOfItems = await User.countDocuments(filterConditions);

        // Determinar si hay más páginas
        const nextPage = (page * itemsPerPage) < totalOfItems;

        // Enviar la respuesta con los usuarios, el total de elementos y si hay una siguiente página
        res.json({
            users,
            nextPage,
            totalOfItems
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
