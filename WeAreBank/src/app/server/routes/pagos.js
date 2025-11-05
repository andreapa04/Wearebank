import express from "express";
import pool from "../db.js";

const router = express.Router();

/**
 * POST /api/pagos
 * Body:
 * {
 *   idCuenta: number,
 *   monto: number,
 *   referencia: string
 * }
 */
router.post("/", async (req, res) => {
  const { idCuenta, monto, referencia } = req.body;

  if (!idCuenta || !monto || monto <= 0) {
    return res.status(400).json({ error: "Datos de pago inválidos" });
  }

  try {
    const [cuentaRows] = await pool.query("SELECT saldo FROM cuenta WHERE idCuenta = ?", [idCuenta]);

    if (cuentaRows.length === 0) {
      return res.status(404).json({ error: "Cuenta no encontrada" });
    }

    const saldoActual = cuentaRows[0].saldo;

    if (saldoActual < monto) {
      return res.status(400).json({ error: "Saldo insuficiente" });
    }

    // 🔹 Actualizar saldo
    await pool.query("UPDATE cuenta SET saldo = saldo - ? WHERE idCuenta = ?", [monto, idCuenta]);

    // 🔹 Registrar movimiento con fechaHora
    await pool.query(
      `INSERT INTO movimiento (idCuenta, monto, tipoMovimiento, fechaHora)
       VALUES (?, ?, 'PAGO_SERVICIO', NOW())`,
      [idCuenta, -monto]
    );

    res.json({
      message: `✅ Pago de ${referencia || "servicio"} realizado correctamente.`,
      nuevoSaldo: saldoActual - monto
    });
  } catch (error) {
    console.error("❌ Error en pago:", error);
    res.status(500).json({ error: "Error al procesar el pago" });
  }
});

export default router;
