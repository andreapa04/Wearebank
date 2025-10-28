import express from "express";
import pool from "../db.js";
import bcrypt from "bcryptjs";

const router = express.Router();

/**
 * 🟢 LOGIN
 * POST /api/auth/login
 * Body: { email, contrasenia }
 */
router.post("/login", async (req, res) => {
  try {
    const { email, contrasenia } = req.body;

    console.log("🟡 Datos recibidos en login:", { email });

    // Validación básica
    if (!email || !contrasenia) {
      return res.status(400).json({ error: "Email y contraseña son requeridos" });
    }

    // Buscar usuario por email
    const [rows] = await pool.query(
      "SELECT idUsuario, idRol AS rol, nombre, apellidoP, apellidoM, contrasenia FROM usuario WHERE email = ?",
      [email]
    );

    console.log("🟢 Resultado de búsqueda:", rows);

    // Si no se encuentra usuario
    if (rows.length === 0) {
      return res.status(401).json({ error: "Correo no registrado" });
    }

    const user = rows[0];
    console.log("🟣 Hash almacenado en DB:", user.contrasenia);

    if (!user.contrasenia) {
      console.error("⚠️ El usuario no tiene contraseña almacenada.");
      return res.status(500).json({ error: "Usuario sin contraseña en el registro." });
    }

    // Comparar contraseñas
    const coincide = await bcrypt.compare(contrasenia, user.contrasenia);
    console.log("🔍 Resultado comparación:", coincide);

    if (!coincide) {
      return res.status(401).json({ error: "Contraseña incorrecta" });
    }

    // Éxito
    res.json({
      message: "✅ Login exitoso",
      user: {
        id: user.idUsuario,
        nombre: user.nombre,
        apellidoP: user.apellidoP,
        apellidoM: user.apellidoM,
        rol: user.rol, // 0=Gerente, 1=Ejecutivo, 2=Cliente
      },
    });
  } catch (err) {
    console.error("❌ Error interno en login:", err);
    res.status(500).json({ error: "Error en el servidor" });
  }
});

export default router;
