const express = require('express');
const Pickup = require('../models/pickup/pickupModel');
const Product = require('../models/product/productModel');
const router = express.Router();

// Create a Pickup (POST)
router.post('/', async (req, res) => {
    try {
        const newPickup = new Pickup(req.body);
        const savedPickup = await newPickup.save();
        res.status(201).json(savedPickup);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get all Pickups (GET)
router.get('/', async (req, res) => {
    try {
        const pickups = await Pickup.find();
        res.json(pickups);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get a Pickup by ID (GET)
router.get('/:id', async (req, res) => {
    try {
        const pickup = await Pickup.findById(req.params.id);
        if (!pickup) return res.status(404).json({ error: 'Pickup not found' });
        res.json(pickup);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update a Pickup (PUT)
router.put('/:id', async (req, res) => {
    try {
        const updatedPickup = await Pickup.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        if (!updatedPickup) return res.status(404).json({ error: 'Pickup not found' });
        res.json(updatedPickup);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete a Pickup (DELETE)
router.delete('/:id', async (req, res) => {
    const session = await Pickup.startSession();
    session.startTransaction();
    try {
        // 1) Eliminar el pickup
        const deletedPickup = await Pickup.findByIdAndDelete(req.params.id).session(session);
        if (!deletedPickup) {
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json({ error: 'Pickup not found' });
        }

        // 2) Quitar referencias en todos los productos:
        //    Para cada variante, hacemos $pull de los elementos stockByPickup cuyo pickup sea el eliminado
        await Product.updateMany(
            {},
            { $pull: { 'variants.$[].stockByPickup': { pickup: deletedPickup._id } } },
            { session }
        );

        await session.commitTransaction();
        session.endSession();

        res.json({ message: 'Pickup successfully deleted and references cleaned up' });
    } catch (err) {
        await session.abortTransaction();
        session.endSession();
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
