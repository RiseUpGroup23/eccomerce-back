const express = require("express");
const mongoose = require("mongoose");
const Product = require("../models/product/productModel");
const Categoria = require("../models/category/categoryModel");
const SubCategoria = require("../models/category/subCategoryModel");
const Collection = require("../models/collection/collectionModel");

const router = express.Router();

router.get("/", async (req, res) => {
  const {
    name,
    category,
    subCategory,
    collection,
    page = "1",
    priceRange,
    sortBy,
  } = req.query;

  try {
    const pageNumber = parseInt(page, 10) || 1;
    const limit = 20;
    const skip = (pageNumber - 1) * limit;

    // Construcción dinámica de filtros
    const filterConditions = {};
    let searchTitle = "";
    let listingDescription = "";

    if (name) {
      filterConditions.$or = [
        { name: { $regex: new RegExp(name, "i") } },
        { brand: { $regex: new RegExp(name, "i") } },
      ];
      searchTitle = `Resultados para: ${name}`;
    }

    if (category) {
      const query = mongoose.Types.ObjectId.isValid(category)
        ? { _id: category }
        : { categoryLink: category };
      const cat = await Categoria.findOne(query).populate({
        path: "subcategories",
        model: SubCategoria,
      });
      if (cat) {
        filterConditions.category = cat._id;
        searchTitle = cat.name;
        listingDescription = cat.description;
      }
    }

    if (subCategory) {
      const query = mongoose.Types.ObjectId.isValid(subCategory)
        ? { _id: subCategory }
        : { name: new RegExp(`^${subCategory}$`, "i") };
      const subCat = await SubCategoria.findOne(query);
      if (subCat) {
        filterConditions.subcategory = subCat._id;
        searchTitle = subCat.name;
      }
    }

    if (collection) {
      const col = await Collection.findOne({ collectionId: collection }).populate("products");
      if (col) {
        filterConditions._id = { $in: col.products.map((p) => p._id) };
        searchTitle = col.title;
      }
    }

    //=== FILTRO POR RANGO DE PRECIO ===
    if (priceRange) {
      // esperamos algo como "minAmax", ej "3125300a3450900"
      const [minPrice, maxPrice] = priceRange.split("a").map(Number);
      if (!isNaN(minPrice) && !isNaN(maxPrice)) {
        filterConditions.sellingPrice = { $gte: minPrice, $lte: maxPrice };
      }
    }

    // Contamos total de items antes de paginar
    const totalOfItems = await Product.countDocuments(filterConditions);

    let products;
    //=== ORDENAMIENTO POR RELEVANCIA (totalSold) ===
    if (sortBy === "relevance") {
      // traemos todos, calculamos totalSold en memoria y luego paginamos
      const all = await Product.find(filterConditions)
        .populate({
          path: "category",
          populate: { path: "subcategories", model: SubCategoria },
        })
        .populate("subcategory")
        .lean();

      // calculamos totalSold para cada producto
      all.forEach((prod) => {
        prod.totalSold = prod.variants.reduce((sumV, variant) => {
          const soldInVariant = variant.stockByPickup.reduce(
            (sumP, pickup) => sumP + (pickup.totalSold || 0),
            0
          );
          return sumV + soldInVariant;
        }, 0);
      });

      // ordenamos de mayor a menor totalSold
      all.sort((a, b) => b.totalSold - a.totalSold);

      // paginación manual
      products = all.slice(skip, skip + limit);
    } else {
      // para name, priceHigh y priceLow usamos .sort() de Mongo
      const sortConditions = {};
      if (sortBy === "name") sortConditions.name = 1;
      else if (sortBy === "priceHigh") sortConditions.sellingPrice = -1;
      else if (sortBy === "priceLow") sortConditions.sellingPrice = 1;
      // si sortBy no está o es inválido, no aplicamos sort

      let query = Product.find(filterConditions);
      if (Object.keys(sortConditions).length) query = query.sort(sortConditions);

      products = await query
        .populate({
          path: "category",
          populate: { path: "subcategories", model: SubCategoria },
        })
        .populate("subcategory")
        .skip(skip)
        .limit(limit);
    }

    const nextPage = pageNumber * limit < totalOfItems;

    // Reconstrucción de filtros activos para el front
    const categoriesSet = new Set();
    const subcategoriesSet = new Set();
    const prices = [];

    products.forEach((product) => {
      if (product.category) categoriesSet.add(product.category._id.toString());
      if (product.subcategory) subcategoriesSet.add(product.subcategory._id.toString());
      if (product.sellingPrice != null) prices.push(product.sellingPrice);
    });

    const categoriesArray = await Categoria.find({
      _id: { $in: Array.from(categoriesSet) },
    }).populate("subcategories");

    const usedSubcategoryIds = new Set(
      products.map((p) => p.subcategory?._id?.toString()).filter(Boolean)
    );

    const formattedCategories = categoriesArray.map((c) => {
      const filteredSubs = c.subcategories.filter((sub) =>
        usedSubcategoryIds.has(sub._id.toString())
      );
      return {
        _id: c._id,
        name: c.name,
        categoryLink: c.categoryLink,
        subcategories: filteredSubs.map((sub) => ({
          _id: sub._id,
          name: sub.name,
          categoryLink: sub.categoryLink,
        })),
      };
    });

    const priceRangeResult =
      prices.length > 0 ? [Math.min(...prices), Math.max(...prices)] : [0, 0];

    res.json({
      products,
      filters: {
        categories: formattedCategories,
        priceRange: priceRangeResult,
      },
      pagination: {
        nextPage,
        totalOfItems,
      },
      searchTitle,
      listingDescription,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
