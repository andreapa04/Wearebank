import express from "express";
import pool from "../db.js";

const router = express.Router();

/**
 * POST /login
 * Body: { usuario, contrasena }
 */
router.post("/login", async (req, res) => {
  try {
    const { usuario, contrasena } = req.body;

    if (!usuario || !contrasena) {
      return res.status(400).json({ error: "Usuario y contraseña son requeridos" });
    }

    const [rows] = await pool.query(
      "SELECT idUsuario, nombre, rol FROM Usuario WHERE usuario = ? AND contrasena = ?",
      [usuario, contrasena]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    // Usuario encontrado
    const user = rows[0];

    res.json({
      message: "Login exitoso",
      user: {
        id: user.idUsuario,
        nombre: user.nombre,
        rol: user.rol, // 0=Gerente, 1=Ejecutivo, 2=Cliente
      },
    });
  } catch (err) {
    console.error("Error en login:", err);
    res.status(500).json({ error: "Error en el servidor" });
  }
});

export default router;
