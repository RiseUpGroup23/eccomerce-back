const express = require('express');
const moment = require('moment-timezone');

const Product = require('../models/product/productModel');
const Category = require('../models/category/categoryModel');
const Order = require('../models/orders/orderModel');
const Collection = require('../models/collection/collectionModel');
const User = require('../models/user/userModel');
const quantityInCarts = require('./modules/quantityInCarts');

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
        if (['totalStock', 'sellingPrice', 'name'].includes(sortBy)) {
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

        // Obtener el quantityInCart para cada producto
        const productsWithQuantity = await Promise.all(productos.map(async (product) => {
            const quantityInCart = await quantityInCarts(product._id); // Obtener la cantidad en carritos
            return { ...product.toObject(), quantityInCart }; // Mapear el producto y agregar quantityInCart
        }));

        // Enviar la respuesta con los productos, el total de elementos y si hay una siguiente página
        res.json({
            products: productsWithQuantity,
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

        const skip = (page - 1) * itemsPerPage;
        const limit = parseInt(itemsPerPage, 10);

        const filterConditions = {};

        if (q) {
            const regex = new RegExp(q, 'i');
            const qNumber = Number(q);
            const isNumeric = !isNaN(qNumber);

            let userIds = [];
            if (!isNumeric) {
                const matchingUsers = await mongoose.model('User').find({ name: { $regex: regex } }).select('_id');
                userIds = matchingUsers.map(u => u._id);
            }

            filterConditions.$or = [
                ...(isNumeric ? [{ orderId: qNumber }] : []),
                ...(userIds.length > 0 ? [{ user: { $in: userIds } }] : [])
            ];
        }

        const sortConditions = {};
        if (sortBy === 'customerName') {
            sortConditions['user.name'] = sortOrder === 'asc' ? 1 : -1;
        } else if (sortBy === 'createdAt') {
            sortConditions['createdAt'] = sortOrder === 'asc' ? 1 : -1;
        } else if (sortBy === 'totalAmount') {
            sortConditions['totalAmount'] = sortOrder === 'asc' ? 1 : -1;
        } else {
            sortConditions['orderId'] = sortOrder === 'asc' ? -1 : 1;
        }

        const orders = await Order.find(filterConditions)
            .populate("user")
            .populate("paymentMethod")
            .populate("products.product")
            .populate("logistics.pickup")
            .skip(skip)
            .limit(limit)
            .sort(sortConditions);

        const totalOfItems = await Order.countDocuments(filterConditions);
        const nextPage = (page * itemsPerPage) < totalOfItems;

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

// Ruta para obtener colecciones con paginación, filtros por nombre
router.get('/collections', async (req, res) => {
    try {
        const { page = 1, itemsPerPage = 10, q } = req.query;

        // Calcular la cantidad de saltos (skip) y el límite (limit) de las colecciones
        const skip = (page - 1) * itemsPerPage;
        const limit = parseInt(itemsPerPage, 10);

        // Filtro de nombre (q) si se pasa en la consulta
        const filterConditions = {};

        // Filtro por nombre de categoría
        if (q) {
            filterConditions.title = { $regex: new RegExp(q, 'i') }; // Asegurarse de que la regex sea correcta
        }

        // Consultar las colecciones con los filtros y paginación
        const collections = await Collection.find(filterConditions)
            .skip(skip)
            .limit(limit);

        // Contar el total de colecciones para calcular el total de páginas
        const totalOfItems = await Collection.countDocuments(filterConditions);

        // Determinar si hay más páginas
        const nextPage = (page * itemsPerPage) < totalOfItems;

        // Enviar la respuesta con las colecciones, el total de elementos y si hay una siguiente página
        res.json({
            collections,
            nextPage,
            totalOfItems
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// Endpoint /stats para obtener las ventas y las órdenes de los últimos 14 días
router.get('/stats/orders', async (req, res) => {
    try {
        // Obtener la fecha actual en la zona horaria de Argentina
        const today = moment().tz('America/Argentina/Buenos_Aires');
        const fourteenDaysAgo = today.clone().subtract(14, 'days');

        // Filtrar las órdenes de los últimos 14 días
        const orders = await Order.find({
            createdAt: { $gte: fourteenDaysAgo.toDate() } // Convertir a objeto Date
        });

        // Función para obtener solo el número del día en hora local
        const getDayNumberLocal = (date) => {
            return moment(date).tz('America/Argentina/Buenos_Aires').date(); // Número del día (1-31)
        };

        // Inicializar las estructuras para almacenar las órdenes por día
        const last14Days = Array.from({ length: 14 }, (_, i) => {
            const day = today.clone().subtract(i, 'days');
            return getDayNumberLocal(day); // Solo el número del día
        }).reverse();

        const salesData = {
            xAxis: last14Days,
            yAxisOrders: new Array(14).fill(0) // Inicia con 0 órdenes por día
        };

        // Recorremos las órdenes y las asignamos al día correspondiente
        orders.forEach(order => {
            const orderDayNumber = getDayNumberLocal(order.createdAt); // Número del día de la orden
            const dayIndex = salesData.xAxis.indexOf(orderDayNumber);
            if (dayIndex !== -1) {
                salesData.yAxisOrders[dayIndex] += 1; // Incrementamos la cantidad de órdenes
            }
        });

        // Responder con las estadísticas estructuradas
        res.status(200).json({
            xAxis: salesData.xAxis, // Solo números del día (ej: [15, 16, 17, ...])
            yAxisOrders: salesData.yAxisOrders
        });
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener las estadísticas de órdenes' });
    }
});

// Endpoint /stats/mostSold para obtener los productos más vendidos sin incluir aquellos con 0 ventas
router.get('/stats/mostSold', async (req, res) => {
    try {
        // Agregamos un campo 'totalSold' que es la suma de totalSold en cada variante
        const mostSoldProducts = await Product.aggregate([
            {
                $addFields: {
                    totalSold: {
                        $sum: {
                            $map: {
                                input: "$variants",
                                as: "variant",
                                in: { $sum: "$$variant.stockByPickup.totalSold" }
                            }
                        }
                    }
                }
            },
            // Filtrar los productos que tienen totalSold mayor a 0
            { $match: { totalSold: { $gt: 0 } } },
            // Ordenar de mayor a menor según totalSold
            { $sort: { totalSold: -1 } },
            // Limitar a los 10 productos más vendidos
            { $limit: 10 }
        ]);

        res.status(200).json({ products: mostSoldProducts });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
