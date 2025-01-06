const express = require('express');
const DispositionModel = require('../models/disposition/dispositionModel');

const router = express.Router();

// Crear un nuevo DispositionItem (POST)
router.post("/disposition", async (req, res) => {
    try {
        const disposition = new DispositionModel(req.body);
        await disposition.save();
        res.status(201).json(disposition);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Obtener todos los DispositionItems (GET)
router.get("/dispositions", async (req, res) => {
    try {
        const dispositions = await DispositionModel.find();
        res.json(dispositions);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Obtener un DispositionItem por su ID (GET)
router.get("/dispositions/:id", async (req, res) => {
    try {
        const disposition = await DispositionModel.findById(req.params.id);
        if (!disposition) {
            return res.status(404).json({ error: "Disposition no encontrada" });
        }
        res.json(disposition);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Actualizar un DispositionItem por su ID (PUT)
router.put("/dispositions/:id", async (req, res) => {
    try {
        const updatedDisposition = await DispositionModel.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updatedDisposition) {
            return res.status(404).json({ error: "Disposition no encontrada" });
        }
        res.json(updatedDisposition);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Eliminar un DispositionItem por su ID (DELETE)
router.delete("/dispositions/:id", async (req, res) => {
    try {
        const deletedDisposition = await DispositionModel.findByIdAndDelete(req.params.id);
        if (!deletedDisposition) {
            return res.status(404).json({ error: "Disposition no encontrada" });
        }
        res.json({ message: "Disposition eliminada" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;