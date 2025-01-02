const express = require('express');
const Transport = require('../models/transport/transportModel');

const router = express.Router();

// Create a Transport (POST)
router.post('/', async (req, res) => {
    try {
        const newTransport = new Transport(req.body);
        const savedTransport = await newTransport.save();
        res.status(201).json(savedTransport);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get all Transports (GET)
router.get('/', async (req, res) => {
    try {
        const transports = await Transport.find();
        res.json(transports);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get a Transport by ID (GET)
router.get('/:id', async (req, res) => {
    try {
        const transport = await Transport.findById(req.params.id);
        if (!transport) return res.status(404).json({ error: 'Transport not found' });
        res.json(transport);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update a Transport (PUT)
router.put('/:id', async (req, res) => {
    try {
        const updatedTransport = await Transport.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        if (!updatedTransport) return res.status(404).json({ error: 'Transport not found' });
        res.json(updatedTransport);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete a Transport (DELETE)
router.delete('/:id', async (req, res) => {
    try {
        const deletedTransport = await Transport.findByIdAndDelete(req.params.id);
        if (!deletedTransport) return res.status(404).json({ error: 'Transport not found' });
        res.json({ message: 'Transport successfully deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
