const express = require('express');
const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const sharp = require('sharp');
const upload = multer({ storage: multer.memoryStorage() });
const auth = require('../middlewares/auth');

const router = express.Router();

// Configuración de Cloudinary
cloudinary.config({
    cloud_name: "dwqcfuief",
    api_key: "381134874894872",
    api_secret: "XfgRi_QxAhGa01VnckWH7AAx9rE",
});

// Función para redimensionar y comprimir las imágenes
const processImage = async (buffer) => {
    try {
        // Redimensionar y comprimir la imagen para que no supere 1MB y tenga un tamaño adecuado
        const processedImage = await sharp(buffer)
            .resize(1300, 600, {
                fit: sharp.fit.inside,
                withoutEnlargement: true  // No redimensionar si la imagen es más pequeña
            })
            .webp({ quality: 85 })  // Comprimir la imagen (calidad 80, puedes ajustar el valor)
            .toBuffer();  // Convertir a buffer para poder subirla

        return processedImage;
    } catch (error) {
        throw new Error('Error al procesar la imagen: ' + error.message);
    }
};

// Endpoint para cargar varias imágenes
router.post('/', auth, upload.array('photos', 6), async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: 'No se proporcionaron imágenes.' });
        }

        // Cargar las imágenes a Cloudinary
        const uploadPromises = req.files.map((file) =>
            new Promise((resolve, reject) => {
                processImage(file.buffer)  // Procesar la imagen antes de cargarla
                    .then((processedBuffer) => {
                        const uploadStream = cloudinary.uploader.upload_stream(
                            { resource_type: 'image' },
                            (error, result) => {
                                if (error) reject(error);
                                else resolve(result);
                            }
                        );
                        uploadStream.end(processedBuffer);  // Subir la imagen procesada
                    })
                    .catch(reject);  // Si hay error, lo rechazamos
            })
        );

        // Esperar a que todas las imágenes se suban
        const results = await Promise.all(uploadPromises);

        // Obtener las URLs de las imágenes cargadas
        const imageUrls = results.map((result) => result.secure_url);

        res.json({ imageUrls });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

module.exports = router;
