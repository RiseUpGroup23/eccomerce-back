const express = require('express');
const cloudinary = require('cloudinary').v2;  // Asegúrate de importar Cloudinary
const multer = require('multer');  // Asegúrate de importar multer
const upload = multer({ storage: multer.memoryStorage() });  // Configuración de multer para almacenamiento en memoria

const router = express.Router();

// Configurar Cloudinary solo una vez
cloudinary.config({
    cloud_name: "dwqcfuief",
    api_key: "381134874894872",
    api_secret: "XfgRi_QxAhGa01VnckWH7AAx9rE",
});

// Endpoint para cargar varias imágenes
router.post('/cloudinary', upload.array('photos', 6), async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: 'No se proporcionaron imágenes.' });
        }

        // Cargar las imágenes a Cloudinary
        const uploadPromises = req.files.map((file) =>
            new Promise((resolve, reject) => {
                const uploadStream = cloudinary.uploader.upload_stream(
                    { resource_type: 'image' },
                    (error, result) => {
                        if (error) reject(error);
                        else resolve(result);
                    }
                );
                uploadStream.end(file.buffer);
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
