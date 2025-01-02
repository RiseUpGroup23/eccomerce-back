const express = require('express');
const User = require('../models/user/userModel');
const bcrypt = require('bcrypt');

const router = express.Router();

// Create a user (POST)
router.post('/', async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        // Check if the email is already registered
        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ error: 'El email ya está registrado' });

        const newUser = new User({ name, email, password, role });
        const savedUser = await newUser.save();
        res.status(201).json(savedUser);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get all users (GET)
router.get('/', async (req, res) => {
    try {
        const users = await User.find();
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get a user by ID (GET)
router.get('/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update a user (PUT)
router.put('/:id', async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        // If updating the password, hash it
        let updatedFields = { name, email, role };
        if (password) {
            const salt = await bcrypt.genSalt(10);
            updatedFields.password = await bcrypt.hash(password, salt);
        }

        const updatedUser = await User.findByIdAndUpdate(req.params.id, updatedFields, { new: true });
        if (!updatedUser) return res.status(404).json({ error: 'Usuario no encontrado' });
        res.json(updatedUser);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete a user (DELETE)
router.delete('/:id', async (req, res) => {
    try {
        const deletedUser = await User.findByIdAndDelete(req.params.id);
        if (!deletedUser) return res.status(404).json({ error: 'Usuario no encontrado' });
        res.json({ message: 'Usuario eliminado con éxito' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
