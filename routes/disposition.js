const express = require('express');
const { DispositionModel } = require('../models/disposition/dispositionModel');

const router = express.Router();

// Crear un nuevo DispositionItem (POST)
// Solo permitirá crear un único documento en la base de datos
router.post("/", async (req, res) => {
    try {
        // Verificar si ya existe un documento
        const existingDisposition = await DispositionModel.findOne();
        if (existingDisposition) {
            return res.status(400).json({ error: "Ya existe un documento de disposición." });
        }

        // Crear el nuevo documento
        const disposition = new DispositionModel(req.body);
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

// Actualizar el único DispositionItem (PUT)
// Actualiza el único documento de disposición en la base de datos
router.put("/", async (req, res) => {
    try {
        const updatedDisposition = await DispositionModel.findOneAndUpdate({}, req.body, { new: true });
        if (!updatedDisposition) {
            return res.status(404).json({ error: "No se ha encontrado el documento de disposición para actualizar" });
        }
        res.json(updatedDisposition);
    } catch (err) {
        res.status(400).json({ error: err.message });
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
