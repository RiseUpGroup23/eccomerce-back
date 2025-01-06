const express = require('express');
const { DispositionModel } = require('../models/disposition/dispositionModel');

const router = express.Router();

// Crear o actualizar un único DispositionItem (POST/PUT)
// Si ya existe un documento, lo actualiza; si no, lo crea
router.post("/", async (req, res) => {
    try {
        // Intentamos encontrar un documento existente
        let disposition = await DispositionModel.findOne();

        if (disposition) {
            // Si ya existe, lo actualizamos
            disposition = await DispositionModel.findOneAndUpdate({}, req.body, { new: true });
            return res.json(disposition);
        }

        // Si no existe, creamos un nuevo documento
        disposition = new DispositionModel(req.body);
        await disposition.save();
        res.status(201).json(disposition);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Obtener el único DispositionItem (GET)
// Siempre devuelve el único documento
router.get("/", async (req, res) => {
    try {
        const disposition = await DispositionModel.findOne();
        if (!disposition) {
            return res.status(404).json({ error: "No se ha encontrado el documento de disposición" });
        }
        res.json(disposition);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Obtener el único DispositionItem por su ID (GET)
// Como solo hay un documento, no necesitamos usar un ID
router.get("/:id", async (req, res) => {
    try {
        const disposition = await DispositionModel.findOne();
        if (!disposition) {
            return res.status(404).json({ error: "No se ha encontrado el documento de disposición" });
        }
        res.json(disposition);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Eliminar el único DispositionItem (DELETE)
// Elimina el único documento de disposición en la base de datos
router.delete("/", async (req, res) => {
    try {
        const deletedDisposition = await DispositionModel.findOneAndDelete();
        if (!deletedDisposition) {
            return res.status(404).json({ error: "No se ha encontrado el documento de disposición para eliminar" });
        }
        res.json({ message: "Documento de disposición eliminado" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
