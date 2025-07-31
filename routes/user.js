const express = require("express");
const User = require("../models/user/userModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const router = express.Router();

const secretKey = "5b4a3d9c2a1c8924b9a1019258788c32561908c35745f7f10f59b7e3f3d5a1a0";

const verifyToken = (req, res, next) => {
  const token = req.cookies?.token;

  if (!token) return res.status(403).json({ error: "Token no proporcionado" });

  jwt.verify(token, secretKey, (err, decoded) => {
    if (err) return res.status(401).json({ error: "Token inválido" });
    req.user = decoded;
    next();
  });
};

router.post("/alta-cliente", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ error: "El email ya está registrado" });

    const newUser = new User({ name, email, password, role });
    const savedUser = await newUser.save();

    res
      .status(201)
      .json({ message: "Usuario creado", user: { email: savedUser.email } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user)
      return res.status(401).json({ message: "Usuario no encontrado" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ message: "Contraseña incorrecta" });

    const token = jwt.sign({ id: user._id, role: user.role }, secretKey, {
      expiresIn: "1h",
    });

    //
    const isLocal = req.hostname === 'localhost' || req.get('host')?.includes('localhost');
    res.cookie("token", token, {
      httpOnly: true,
      secure: !isLocal,
      sameSite: "None",
      maxAge: 3600000,
    });
    console.log("Token generado y cookie establecida");

    res.status(200).json({ logged: true, message: "Login exitoso" });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Error interno" });
  }
});

router.get("/jwt", verifyToken, (req, res) => {
  res.json({ logged: true, user: req.user });
});

router.get("/", async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/get/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: "Usuario no encontrado" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/edit/:id", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    let updatedFields = { name, email, role };
    if (password) {
      const salt = await bcrypt.genSalt(10);
      updatedFields.password = await bcrypt.hash(password, salt);
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      updatedFields,
      { new: true }
    );
    if (!updatedUser)
      return res.status(404).json({ error: "Usuario no encontrado" });
    res.json(updatedUser);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/delete/:id", async (req, res) => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.params.id);
    if (!deletedUser)
      return res.status(404).json({ error: "Usuario no encontrado" });
    res.json({ message: "Usuario eliminado con éxito" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
