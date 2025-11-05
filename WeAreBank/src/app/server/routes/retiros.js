import express from "express";
import pool from "../db.js";

const router = express.Router();

/**
 * POST /api/retiros
 * Cuerpo esperado:
 * {
 *   idCuenta: number,
 *   monto: number,
 *   retiroSinTarjeta: boolean
 * }
 */
router.post("/", async (req, res) => {
  const { idCuenta, monto, retiroSinTarjeta } = req.body;

  if (!idCuenta || !monto || monto <= 0) {
    return res.status(400).json({ message: "Datos de retiro inválidos." });
  }

  try {
    // 1️⃣ Verificar saldo actual
    const [cuentaRows] = await pool.query(
      "SELECT saldo FROM cuenta WHERE idCuenta = ?",
      [idCuenta]
    );

    if (cuentaRows.length === 0) {
      return res.status(404).json({ message: "Cuenta no encontrada." });
    }

    const saldoActual = cuentaRows[0].saldo;

    if (saldoActual < monto) {
      return res
        .status(400)
        .json({ message: "Saldo insuficiente para realizar el retiro." });
    }

    // 2️⃣ Actualizar saldo
    await pool.query(
      "UPDATE cuenta SET saldo = saldo - ? WHERE idCuenta = ?",
      [monto, idCuenta]
    );

    // 3️⃣ Registrar movimiento
    const tipoMovimiento = retiroSinTarjeta
      ? "RETIRO_SIN_TARJETA"
      : "RETIRO";

    await pool.query(
      `INSERT INTO movimiento (idCuenta, monto, tipoMovimiento, fechaHora)
       VALUES (?, ?, ?, NOW())`,
      [idCuenta, -monto, tipoMovimiento]
    );

    res.json({
      message: "✅ Retiro realizado correctamente.",
      nuevoSaldo: saldoActual - monto
    });
  } catch (error) {
    console.error("❌ Error en retiro:", error);
    res.status(500).json({ message: "Error al procesar el retiro." });
  }
});

export default router;
