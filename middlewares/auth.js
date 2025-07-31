const jwt = require("jsonwebtoken");

const auth = (req, res, next) => {
  const token = req.cookies?.token;

  if (!token) {
    return res.status(401).json({ error: "No autorizado. Token no encontrado." });
  }

  try {
    const decoded = jwt.verify(token, "5b4a3d9c2a1c8924b9a1019258788c32561908c35745f7f10f59b7e3f3d5a1a0");
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ error: "Token inválido o expirado." });
  }
};

module.exports = auth;
