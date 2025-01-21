const express = require('express');
const Category = require('../models/category/categoryModel');
const SubCategory = require('../models/category/subCategoryModel');
const mongoose = require('mongoose');
const router = express.Router();

// Crear una categoría y sus subcategorías (POST)
router.post('/', async (req, res) => {
    try {
        // Crear la nueva categoría
        const newCategory = new Category({ ...req.body, subcategories: [] });
        const categorySaved = await newCategory.save();

        // Si la categoría tiene subcategorías, crear y asociarlas
        if (req.body.subcategories && Array.isArray(req.body.subcategories)) {
            const subcategoriesToAdd = [];

            // Crear subcategorías y asociarlas con la categoría
            for (const subcategoryData of req.body.subcategories) {
                const { name, description } = subcategoryData;

                // Crear el link de la subcategoría
                const subcategoryLink = `${categorySaved.categoryLink ? categorySaved.categoryLink + '/' : ''}${name.toLowerCase().replace(/\s+/g, '-')}`;

                // Verificar si ya existe una subcategoría con ese categoryLink
                let subcategory = await SubCategory.findOne({ categoryLink: subcategoryLink });

                if (!subcategory) {
                    // Si no existe, crear la subcategoría
                    subcategory = new SubCategory({
                        name: name,
                        description: description,
                        categoryLink: subcategoryLink,
                    });

                    // Guardar la subcategoría
                    await subcategory.save();
                }

                // Agregar el ID de la subcategoría al array de subcategorías de la categoría
                subcategoriesToAdd.push(subcategory._id);
            }

            // Asociar las subcategorías creadas con la categoría principal
            categorySaved.subcategories = subcategoriesToAdd;

            // Guardar la categoría con las subcategorías asociadas
            await categorySaved.save();
        }

        // Responder con la categoría recién creada y sus subcategorías
        res.status(201).json(categorySaved);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});



// Obtener todas las categorías (GET)
router.get('/', async (req, res) => {
    try {
        const categories = await Category.find();
        res.json(categories);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Obtener una categoría por ID o por nombre (GET)
router.get('/:idOrName', async (req, res) => {
    try {
        // Verificar si el parámetro es un ID de MongoDB válido o un nombre
        let category;
        const idOrName = req.params.idOrName.trim().toLowerCase();  // Convertir a minúsculas el parámetro de búsqueda

        if (mongoose.Types.ObjectId.isValid(idOrName)) {
            // Buscar por ID si el parámetro es un ID válido
            category = await Category.findById(idOrName).populate('subcategories');
        } else {
            // Buscar por nombre, ignorando mayúsculas y minúsculas
            category = await Category.findOne({
                categoryLink: idOrName
            }).populate('subcategories');
        }

        // Verificar si la categoría fue encontrada
        if (!category) return res.status(404).json({ error: 'Categoría no encontrada' });

        // Obtener todos los IDs de las subcategorías que existen en la base de datos
        const validSubcategories = await SubCategory.find({
            '_id': { $in: category.subcategories } // Busca los _id de las subcategorías que existen en la base de datos
        }).select('_id'); // Solo traer los IDs de las subcategorías existentes

        // Extraer los IDs válidos de las subcategorías existentes
        const validSubcategoryIds = validSubcategories.map(sub => sub._id.toString());

        // Filtrar las subcategorías para eliminar las que no existen
        const updatedSubcategories = category.subcategories.filter(subcategory =>
            validSubcategoryIds.includes(subcategory._id.toString())
        );

        // Actualizar la categoría con los IDs válidos de subcategorías
        category.subcategories = updatedSubcategories;

        // Guardar la categoría con los cambios
        await category.save();

        // Enviar la categoría con las subcategorías válidas
        res.json(category);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Obtener subcategorías de una categoría por ID (GET)
router.get('/:idCategoria/subcategorias', async (req, res) => {
    try {
        const { idCategoria } = req.params;

        // Buscar la categoría por su ID
        const category = await Category.findById(idCategoria);
        if (!category) return res.status(404).json({ error: 'Categoría no encontrada' });

        // Devolver las subcategorías asociadas
        const subcategorias = await SubCategory.find({ _id: { $in: category.subcategories } });

        res.json(subcategorias);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Actualizar una categoría (PUT)
router.put('/:id', async (req, res) => {
    try {
        const categoryUpdated = await Category.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        if (!categoryUpdated) return res.status(404).json({ error: 'Categoría no encontrada' });
        res.json(categoryUpdated);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Eliminar una categoría (DELETE)
router.delete('/:id', async (req, res) => {
    try {
        const categoryDeleted = await Category.findByIdAndDelete(req.params.id);
        if (!categoryDeleted) return res.status(404).json({ error: 'Categoría no encontrada' });
        res.json({ message: 'Categoría eliminada con éxito' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Agregar una subcategoría a una categoría (POST)
router.post('/:id/subcategory', async (req, res) => {
    try {
        // Buscar la categoría principal
        const category = await Category.findById(req.params.id);
        if (!category) return res.status(404).json({ error: 'Categoría no encontrada' });

        // Verificar si los datos de la subcategoría fueron enviados
        const { name, description } = req.body;
        if (!name) {
            return res.status(400).json({ error: 'Falta el campo name para la subcategoría' });
        }

        // Generar el categoryLink para la subcategoría, concatenando con el categoryLink de la categoría principal
        const subcategoryLink = `${category.categoryLink ? category.categoryLink + '/' : ''}${name.toLowerCase().replace(/\s+/g, '-')}`;

        // Verificar si ya existe una subcategoría con ese categoryLink
        let subcategory = await SubCategory.findOne({ categoryLink: subcategoryLink });

        // Si no existe, crear la subcategoría
        if (!subcategory) {
            subcategory = new SubCategory({
                name: name,
                description: description,
                categoryLink: subcategoryLink,  // El link de la subcategoría
            });

            // Guardar la subcategoría recién creada
            await subcategory.save();
        }

        // Agregar la subcategoría al array de subcategorías de la categoría principal
        category.subcategories.push(subcategory._id);

        // Filtrar y eliminar subcategorías que no existen
        const validSubcategories = await SubCategory.find({
            '_id': { $in: category.subcategories }
        }).select('_id');

        // Extraer los IDs válidos de las subcategorías existentes
        const validSubcategoryIds = validSubcategories.map(sub => sub._id.toString());

        // Filtrar las subcategorías para eliminar las que no existen
        category.subcategories = category.subcategories.filter(subcategoryId =>
            validSubcategoryIds.includes(subcategoryId.toString())
        );

        // Guardar la categoría principal con los cambios
        await category.save();

        // Responder con la categoría actualizada
        res.status(201).json(category);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// Eliminar una subcategoría de una categoría (DELETE)
router.delete('/:id/subcategory/:subcategoryId', async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);
        if (!category) return res.status(404).json({ error: 'Categoría no encontrada' });

        // Eliminar la subcategoría del array de subcategorías
        const subcategoryIndex = category.subcategories.indexOf(req.params.subcategoryId);
        if (subcategoryIndex === -1) return res.status(404).json({ error: 'Subcategoría no encontrada' });

        category.subcategories.splice(subcategoryIndex, 1);
        await category.save();

        res.json({ message: 'Subcategoría eliminada con éxito' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
