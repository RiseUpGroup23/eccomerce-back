const express = require('express');
const Product = require('../models/product/productModel');

const router = express.Router();

router.get('/', async (req, res) => {
    const { name } = req.query;  // Obtenemos el parámetro 'name' de la consulta
    try {
        let products = [];

        // Si 'name' está presente en la query, buscamos primero por 'name'
        if (name) {
            const nameQuery = { name: { $regex: name, $options: 'i' } };
            products = await Product.find(nameQuery);

            // Si no encontramos productos por nombre, intentamos con 'brand'
            if (products.length === 0) {
                const brandQuery = { brand: { $regex: name, $options: 'i' } };
                products = await Product.find(brandQuery);
            }

            // Si aún no encontramos productos, intentamos por 'category' o 'subcategory'
            if (products.length === 0) {
                const categoryQuery = {
                    $or: [
                        { category: { $regex: name, $options: 'i' } },
                        { subcategory: { $regex: name, $options: 'i' } }
                    ]
                };
                products = await Product.find(categoryQuery);
            }
        } else {
            // Si no se pasa 'name', retornamos todos los productos
            products = await Product.find();
        }

        // Enviamos la respuesta
        if (products.length > 0) {
            res.json(products);  // Si encontramos productos, los devolvemos
        } else {
            res.status(404).json({ message: 'No se encontraron productos.' });  // Si no encontramos nada, devolvemos un error 404
        }
    } catch (err) {
        res.status(500).json({ error: err.message });  // En caso de error, respondemos con el error
    }
});

module.exports = router;
