import express from "express";
import pool from "../db.js";
import bcrypt from "bcryptjs";

const router = express.Router();

/**
 * POST /login
 * Body: { email, contrasenia }
 */
router.post("/login", async (req, res) => {
  try {
    const { email, contrasenia } = req.body;

    if (!email || !contrasenia) {
      return res.status(400).json({ error: "Email y contraseña son requeridos" });
    }

    // 🔍 Buscar al usuario por email
    const [rows] = await pool.query(
      "SELECT idUsuario, nombre, apellidoP, apellidoM, rol, contrasenia FROM usuario WHERE email = ?",
      [email]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: "Correo no registrado" });
    }

    const user = rows[0];

    // 🔒 Comparar contraseña ingresada con la hasheada
    const coincide = await bcrypt.compare(contrasenia, user.contrasenia);

    if (!coincide) {
      return res.status(401).json({ error: "Contraseña incorrecta" });
    }

    // ✅ Si todo bien, responder con los datos del usuario (sin la contraseña)
    res.json({
      message: "Login exitoso",
      user: {
        id: user.idUsuario,
        nombre: user.nombre,
        apellidoP: user.apellidoP,
        apellidoM: user.apellidoM,
        rol: user.rol, // 0=Gerente, 1=Ejecutivo, 2=Cliente
      },
    });
  } catch (err) {
    console.error("Error en login:", err);
    res.status(500).json({ error: "Error en el servidor" });
  }
});

export default router;
