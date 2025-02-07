const express = require('express');
const User = require('../models/user/userModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

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
router.get('/get/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update a user (PUT)
router.put('/edit/:id', async (req, res) => {
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
router.delete('/delete/:id', async (req, res) => {
    try {
        const deletedUser = await User.findByIdAndDelete(req.params.id);
        if (!deletedUser) return res.status(404).json({ error: 'Usuario no encontrado' });
        res.json({ message: 'Usuario eliminado con éxito' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//LOGIN

const secretKey = "5b4a3d9c2a1c8924b9a1019258788c32561908c35745f7f10f59b7e3f3d5a1a0"

router.post("/login", async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(200).json({ logged: false, message: "Usuario no encontrado" });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(200).json({ logged: false, message: "Usuario o contraseña incorrectos" });
        }

        const token = jwt.sign({ email }, secretKey, { expiresIn: '1h' });
        res.status(200).json({ logged: true, message: "Login exitoso", token });
    } catch (error) {
        console.error(error.message);
        res.status(500).send();
    }
});

router.post("/newUser", async (req, res) => {
    try {
        let existingUser = await User.findOne({ email: req.body.email });

        if (existingUser) {
            return res.status(400).json({ message: "El usuario ya existe" });
        }

        const newUser = new User(req.body);

        await newUser.save();

        res.status(201).json({ message: "Usuario creado exitosamente" });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: "Error en endpoint" });
    }
});

const verifyToken = (req, res, next) => {
    const token = req.headers.authorization;

    if (!token) {
        return res.status(403).json({ error: 'Token no proporcionado' });
    }

    jwt.verify(token, secretKey, (err, decoded) => {
        if (err) {
            return res.status(401).json({ error: 'Token inválido' });
        }
        req.user = decoded;
        next();
    });
};


router.get('/jwt', verifyToken, (req, res) => {
    res.json({ logged: true });
});


module.exports = router;
