import express from "express";
import pool from "../db.js";
const router = express.Router();

router.post("/solicitar", async (req, res) => {
  const { idUsuario, monto, plazo, tipo } = req.body;
  try {
    await pool.query(
      "INSERT INTO solicitud (idCuenta, montoTotal, plazo, tipo, estado) VALUES (?, ?, ?, ?, 'PENDIENTE')",
      [idUsuario, monto, plazo, tipo]
    );
    res.json({ message: `${tipo} solicitado correctamente` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al solicitar" });
  }
});

export default router;
