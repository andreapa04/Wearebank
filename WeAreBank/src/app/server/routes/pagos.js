import express from "express";
import pool from "../db.js";
const router = express.Router();

router.post("/", async (req, res) => {
  const { idCuenta, monto, referencia } = req.body;

  try {
    const [cuenta] = await pool.query("SELECT saldo FROM cuenta WHERE idCuenta = ?", [idCuenta]);
    if (cuenta[0].saldo < monto) return res.status(400).json({ error: "Saldo insuficiente" });

    await pool.query("UPDATE cuenta SET saldo = saldo - ? WHERE idCuenta = ?", [monto, idCuenta]);
    await pool.query("INSERT INTO movimiento (idCuenta, monto, tipoMovimiento) VALUES (?, ?, 'PAGO_SERVICIO')", [idCuenta, -monto]);

    res.json({ message: "Pago realizado con éxito" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error en pago" });
  }
});

export default router;
