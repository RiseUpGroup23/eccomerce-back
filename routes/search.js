const express = require('express');
const mongoose = require('mongoose');
const Product = require('../models/product/productModel');
const Categoria = require('../models/category/categoryModel');
const SubCategoria = require('../models/category/subCategoryModel');
const Collection = require('../models/collection/collectionModel');

const router = express.Router();

router.get('/', async (req, res) => {
    const { name, category, subCategory, collection, page } = req.query;

    try {
        const pageNumber = parseInt(page) || 1;
        const limit = 20;
        const skip = (pageNumber - 1) * limit;

        const filterConditions = {};

        if (name) {
            filterConditions.$or = [
                { name: { $regex: new RegExp(name, 'i') } },
                { brand: { $regex: new RegExp(name, 'i') } }
            ];
        }

        if (category) {
            let query = {};
            // Si category es un ObjectId válido, buscar por _id, de lo contrario por categoryLink
            if (mongoose.Types.ObjectId.isValid(category)) {
                query = { _id: category };
            } else {
                query = { categoryLink: category };
            }
            const categoriaEncontrada = await Categoria.findOne(query);
            if (categoriaEncontrada) {
                filterConditions.category = categoriaEncontrada._id;
            }
        }

        if (subCategory) {
            let query = {};
            // Si subCategory es un ObjectId válido, buscar por _id, de lo contrario por subCategoryLink
            if (mongoose.Types.ObjectId.isValid(subCategory)) {
                query = { _id: subCategory };
            } else {
                query = { subCategoryLink: subCategory };
            }
            const subCategoriaEncontrada = await SubCategoria.findOne(query);
            if (subCategoriaEncontrada) {
                filterConditions.subcategory = subCategoriaEncontrada._id;
            }
        }

        if (collection) {
            const coleccion = await Collection.findById(collection).populate('products');
            if (coleccion) {
                const productIds = coleccion.products.map((p) => p._id);
                filterConditions._id = { $in: productIds };
            }
        }

        const products = await Product.find(filterConditions)
            .populate('category')
            .populate('subcategory')
            .skip(skip)
            .limit(limit);

        const totalOfItems = await Product.countDocuments(filterConditions);
        const nextPage = pageNumber * limit < totalOfItems;

        const categoriesSet = new Set();
        const prices = [];

        products.forEach((product) => {
            if (product.category) categoriesSet.add(product.category);
            if (product.sellingPrice) prices.push(product.sellingPrice);
        });

        const categoriesArray = Array.from(categoriesSet).map((c) => ({
            _id: c._id,
            name: c.name,
            subcategories: c.subcategories,
        }));

        const priceRange = prices.length > 0
            ? [Math.min(...prices), Math.max(...prices)]
            : [0, 0];

        res.json({
            products,
            filters: [{
                categories: categoriesArray,
                priceRange,
            }],
            pagination: {
                nextPage,
                totalOfItems,
            },
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
