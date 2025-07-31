const express = require("express");
const mongoose = require("mongoose");
const Product = require("../models/product/productModel");
const Categoria = require("../models/category/categoryModel");
const SubCategoria = require("../models/category/subCategoryModel");
const Collection = require("../models/collection/collectionModel");

const router = express.Router();

// 🔤 Función para eliminar tildes del input (opcional si lo normalizás de otra forma)
const removeDiacritics = (str) =>
  str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

// 🔤 Función para construir regex que matchee con y sin tildes
const toLooseRegex = (word) => {
  return word
    .replace(/a/g, "[aá]")
    .replace(/e/g, "[eé]")
    .replace(/i/g, "[ií]")
    .replace(/o/g, "[oó]")
    .replace(/u/g, "[uúü]")
    .replace(/n/g, "[nñ]");
};

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

    const filterConditions = {};
    let searchTitle = "";
    let listingDescription = "";

    // 🔍 Búsqueda con regex flexible
    if (name) {
      const normalizedInput = removeDiacritics(name.trim().toLowerCase());
      const nameWords = normalizedInput.split(/\s+/);

      filterConditions.$and = nameWords.map((word) => {
        const looseRegex = new RegExp(toLooseRegex(word), "i");
        return {
          $or: [
            { name: { $regex: looseRegex } },
            { brand: { $regex: looseRegex } },
            { "variants.attributes.name": { $regex: looseRegex } },
          ],
        };
      });

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
      let query;
      let subCat
      if (mongoose.Types.ObjectId.isValid(subCategory)) {
        query = { _id: subCategory };
        subCat = await SubCategoria.findOne(query);
      } else {
        subCat = await SubCategoria.findOne({ categoryLink: `${category}/${subCategory}` });
      }

      if (subCat) {
        filterConditions.subcategory = subCat._id;
        searchTitle = subCat.name;
        listingDescription = subCat.description;
      }
    }

    if (collection) {
      const col = await Collection.findOne({ collectionId: collection }).populate("products");
      if (col) {
        filterConditions._id = { $in: col.products.map((p) => p._id) };
        searchTitle = col.title;
      }
    }

    if (priceRange) {
      const [minPrice, maxPrice] = priceRange.split("a").map(Number);
      if (!isNaN(minPrice) && !isNaN(maxPrice)) {
        filterConditions.sellingPrice = { $gte: minPrice, $lte: maxPrice };
      }
    }

    const totalOfItems = await Product.countDocuments(filterConditions);

    let products;
    if (sortBy === "relevance") {
      const all = await Product.find(filterConditions)
        .populate({
          path: "category",
          populate: { path: "subcategories", model: SubCategoria },
        })
        .populate("subcategory")
        .lean();

      all.forEach((prod) => {
        const variants = Array.isArray(prod.variants) ? prod.variants : [];
        prod.totalSold = variants.reduce((sumV, variant) => {
          const pickups = Array.isArray(variant.stockByPickup)
            ? variant.stockByPickup
            : [];
          return sumV + pickups.reduce((sumP, pickup) => sumP + (pickup.totalSold || 0), 0);
        }, 0);
      });

      all.sort((a, b) => b.totalSold - a.totalSold);
      products = all.slice(skip, skip + limit);
    } else {
      const sortConditions = {};
      if (sortBy === "name") sortConditions.name = 1;
      else if (sortBy === "priceHigh") sortConditions.sellingPrice = -1;
      else if (sortBy === "priceLow") sortConditions.sellingPrice = 1;

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

    const categoriesSet = new Set();
    const prices = [];

    products.forEach((product) => {
      if (product.category) categoriesSet.add(product.category._id.toString());
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
