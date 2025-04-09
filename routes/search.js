const express = require('express');
const mongoose = require('mongoose');
const Product = require('../models/product/productModel');
const Categoria = require('../models/category/categoryModel');
const SubCategoria = require('../models/category/subCategoryModel');
const Collection = require('../models/collection/collectionModel');

const router = express.Router();

router.get('/', async (req, res) => {
    const { name, category, subCategory, collection, page, range } = req.query;

    try {
        const pageNumber = parseInt(page) || 1;
        const limit = 20;
        const skip = (pageNumber - 1) * limit;

        const filterConditions = {};
        let searchTitle = "";

        if (name) {
            filterConditions.$or = [
                { name: { $regex: new RegExp(name, 'i') } },
                { brand: { $regex: new RegExp(name, 'i') } }
            ];
            searchTitle = `Resultados para: ${name}`;
        }

        if (category) {
            let query = {};
            if (mongoose.Types.ObjectId.isValid(category)) {
                query = { _id: category };
            } else {
                query = { categoryLink: category };
            }
            const categoriaEncontrada = await Categoria.findOne(query).populate({ path: 'subcategories', model: SubCategoria });
            if (categoriaEncontrada) {
                filterConditions.category = categoriaEncontrada._id;
                searchTitle = categoriaEncontrada.name;
            }
        }

        if (subCategory) {
            let query = {};
            if (mongoose.Types.ObjectId.isValid(subCategory)) {
                query = { _id: subCategory };
            } else {
                query = { name: new RegExp(`^${subCategory}$`, 'i') };
            }
            const subCategoriaEncontrada = await SubCategoria.findOne(query);
            if (subCategoriaEncontrada) {
                filterConditions.subcategory = subCategoriaEncontrada._id;
                searchTitle = subCategoriaEncontrada.name;
            }
        }

        if (collection) {
            const coleccion = await Collection.findOne({ collectionId: collection }).populate('products');
            if (coleccion) {
                const productIds = coleccion.products.map((p) => p._id);
                filterConditions._id = { $in: productIds };
                searchTitle = coleccion.title; 
            }
        }

        if (range) {
            const [minPrice, maxPrice] = range.split('a').map(Number);
            if (!isNaN(minPrice) && !isNaN(maxPrice)) {
                filterConditions.sellingPrice = { $gte: minPrice, $lte: maxPrice };
            }
        }

        const products = await Product.find(filterConditions)
            .populate({
                path: 'category',
                populate: { path: 'subcategories', model: SubCategoria }
            })
            .populate('subcategory')
            .skip(skip)
            .limit(limit);

        const totalOfItems = await Product.countDocuments(filterConditions);
        const nextPage = pageNumber * limit < totalOfItems;

        const categoriesSet = new Set();
        const subcategoriesSet = new Set();
        const prices = [];

        products.forEach((product) => {
            if (product.category) categoriesSet.add(product.category);
            if (product.subcategory) subcategoriesSet.add(product.subcategory);
            if (product.sellingPrice) prices.push(product.sellingPrice);
        });

        const categoriesArray = await Categoria.find({ _id: { $in: Array.from(categoriesSet).map(cat => cat._id) } }).populate('subcategories');

        const formattedCategories = categoriesArray.map(c => ({
            _id: c._id,
            name: c.name,
            categoryLink: c.categoryLink,
            subcategories: c.subcategories.map(sub => ({
                _id: sub._id,
                name: sub.name,
                categoryLink: sub.categoryLink
            }))
        }));

        const subcategoriesArray = await SubCategoria.find({ _id: { $in: Array.from(subcategoriesSet).map(sub => sub._id) } });

        const formattedSubcategories = subcategoriesArray.map(sub => ({
            _id: sub._id,
            name: sub.name,
            categoryLink: sub.categoryLink,
        }));

        const priceRange = prices.length > 0
            ? [Math.min(...prices), Math.max(...prices)]
            : [0, 0];

        res.json({
            products,
            filters: {
                categories: formattedCategories,
                subcategories: formattedSubcategories,
                priceRange,
            },
            pagination: {
                nextPage,
                totalOfItems,
            },
            searchTitle,
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
