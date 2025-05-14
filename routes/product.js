const express = require('express');
const Product = require('../models/product/productModel');
const Categoria = require('../models/category/categoryModel');
const SubCategoria = require('../models/category/subCategoryModel');
const quantityInCarts = require('./modules/quantityInCarts');

const router = express.Router();

async function migrate() {
    try {
        const productos = await Product.find({});

        for (const prod of productos) {
            const total = prod.variants.reduce((acc, variant) => {
                return acc + variant.stockByPickup.reduce((sum, sp) => sum + sp.quantity, 0);
            }, 0);

            if (prod.totalStock !== total) {
                prod.totalStock = total;
                await prod.save();
                console.log(`  • Actualizado ${prod._id}: totalStock = ${total}`);
            }
        }
    } catch (err) {
        console.error('Error durante la migración:', err);
    }
}



// Crear un producto (POST)
router.post('/', async (req, res) => {
    try {
        const { name, category, subcategory } = req.body;

        // Verifica si la categoría existe
        const categoriaExistente = await Categoria.findById(category);
        if (!categoriaExistente) return res.status(404).json({ error: 'Categoría no encontrada' });

        // Verifica si la subcategoría existe solo si está definida
        let subcategoriaExistente = null;
        if (subcategory) {
            subcategoriaExistente = await SubCategoria.findById(subcategory);
            if (!subcategoriaExistente) return res.status(404).json({ error: 'Subcategoría no encontrada' });
        }

        // Crear el link único para el producto
        let link = name.toLowerCase().replace(/\s+/g, '-'); // Convierte el nombre a minúsculas y reemplaza los espacios por guiones

        // Verificar si ya existe un producto con ese link
        let existingProduct = await Product.findOne({ link });
        let counter = 1;
        // Si el link ya existe, agregamos un contador al final hasta encontrar uno único
        while (existingProduct) {
            link = `${link}-${counter}`;
            existingProduct = await Product.findOne({ link });
            counter++;
        }

        // Crea el nuevo producto con el link único
        const nuevoProducto = new Product({
            ...req.body,
            link,  // Asignar el link único
            subcategory: subcategoriaExistente ? subcategoriaExistente._id : null, // Asocia la subcategoría si existe
        });

        const productoGuardado = await nuevoProducto.save();
        res.status(201).json(productoGuardado);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/', async (req, res) => {
    try {
        const productos = await Product.find();
        res.json(productos);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


router.get('/:id', async (req, res) => {
    try {
        const producto = await Product.findById(req.params.id);
        const quantityInCart = await quantityInCarts(producto._id)
        if (!producto) return res.status(404).json({ error: 'Producto no encontrado' });
        res.json({ ...producto.toObject(), quantityInCart });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/link/:linkProducto', async (req, res) => {
    try {
        migrate();
        const producto = await Product.findOne({ link: req.params.linkProducto });
        if (!producto) return res.status(404).json({ error: 'Producto no encontrado' });
        res.json(producto);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/categoria/:categoryLink', async (req, res) => {
    try {
        const { categoryLink } = req.params;

        // Buscar la categoría por su categoryLink
        const categoria = await Categoria.findOne({ categoryLink: { $regex: categoryLink, $options: 'i' } });

        if (!categoria) {
            return res.status(404).json({ error: 'Categoría no encontrada' });
        }

        // Ahora buscar los productos que tienen esta categoría
        const productos = await Product.find({ category: categoria._id }).populate('category').populate('subcategory');

        if (!productos || productos.length === 0) {
            return res.status(404).json({ error: 'No se encontraron productos para esta categoría' });
        }

        res.json(productos);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// Obtener productos por subcategoría (GET)
router.get('/subcategoria/:idSubcategoria', async (req, res) => {
    try {
        const { idSubcategoria } = req.params;

        // Busca productos que tengan la subcategoría especificada
        const productos = await Product.find({ subcategory: idSubcategoria }).populate('category').populate('subcategory');
        if (!productos || productos.length === 0) {
            return res.status(404).json({ error: 'No se encontraron productos para esta subcategoría' });
        }

        res.json(productos);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


router.put('/:id', async (req, res) => {
    try {
        // Verificar si subcategory está vacío y asignar null si es necesario
        if (req.body.subcategory === "") {
            req.body.subcategory = null;
        }

        // Buscar el producto por su ID
        const producto = await Product.findById(req.params.id);

        // Si no se encuentra el producto, devolver un error 404
        if (!producto) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }

        // Si se ha proporcionado una cantidad de stock en el req.body, actualizamos el stock de la variante y sucursal específica
        if (req.body.stock !== undefined && req.body.variantId && req.body.pickup) {
            // Buscar la variante específica
            const variant = producto.variants.id(req.body.variantId);
            if (!variant) {
                return res.status(404).json({ error: 'Variante no encontrada' });
            }

            // Buscar el stock de la sucursal específica
            const stockEntry = variant.stockByPickup.find(sp => sp.pickup.equals(req.body.pickup));
            if (!stockEntry) {
                // Si no existe un registro de stock para esta sucursal, crear uno nuevo
                variant.stockByPickup.push({
                    pickup: req.body.pickup,
                    quantity: req.body.stock
                });
            } else {
                // Si existe, sumar la cantidad proporcionada al stock actual
                stockEntry.quantity += req.body.stock;
            }
        }

        // Actualizar cualquier otro campo del producto con los datos proporcionados en req.body
        Object.keys(req.body).forEach((key) => {
            if (key !== 'stock' && key !== 'variantId' && key !== 'pickup') { // No actualizamos estos campos directamente desde el body
                producto[key] = req.body[key];
            }
        });

        // Guardar el producto actualizado
        await producto.save();

        // Enviar el producto actualizado como respuesta
        res.json(producto);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const productoEliminado = await Product.findByIdAndDelete(req.params.id);
        if (!productoEliminado) return res.status(404).json({ error: 'Product no encontrado' });
        res.json({ message: 'Producto eliminado con éxito' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
