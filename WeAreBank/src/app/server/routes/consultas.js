import express from "express";
import pool from "../db.js";

const router = express.Router();

/**
 * 🔹 GET /api/consultas/mis-cuentas/:idUsuario
 * Obtiene todas las cuentas asociadas a un usuario mediante la tabla "pertenece"
 */
router.get("/mis-cuentas/:idUsuario", async (req, res) => {
  const { idUsuario } = req.params;

  try {
    const [cuentas] = await pool.query(
      `SELECT c.idCuenta, c.clabe, c.tipoCuenta, c.saldo
       FROM cuenta c
       INNER JOIN pertenece p ON p.idCuenta = c.idCuenta
       WHERE p.idUsuario = ?`,
      [idUsuario]
    );

    res.json(cuentas);
  } catch (error) {
    console.error("❌ Error al consultar cuentas:", error);
    res.status(500).json({ message: "Error al obtener las cuentas." });
  }
});

/**
 * 🔹 GET /api/consultas/movimientos/:idCuenta
 * Obtiene los movimientos de una cuenta específica
 */
router.get("/movimientos/:idCuenta", async (req, res) => {
  const { idCuenta } = req.params;

  try {
    const [movimientos] = await pool.query(
      `SELECT 
         idMovimiento,
         monto,
         tipoMovimiento,
         fechaHora
       FROM movimiento
       WHERE idCuenta = ?
       ORDER BY fechaHora DESC`,
      [idCuenta]
    );

    res.json(movimientos);
  } catch (error) {
    console.error("❌ Error al consultar movimientos:", error);
    res.status(500).json({ message: "Error al obtener los movimientos." });
  }
});

/**
 * 🔹 GET /api/consultas/detalle-cuenta/:idCuenta
 * Devuelve los detalles de una cuenta junto con sus movimientos recientes
 */
router.get("/detalle-cuenta/:idCuenta", async (req, res) => {
  const { idCuenta } = req.params;

  try {
    const [cuentaRows] = await pool.query(
      `SELECT idCuenta, clabe, tipoCuenta, saldo
       FROM cuenta
       WHERE idCuenta = ?`,
      [idCuenta]
    );

    if (cuentaRows.length === 0)
      return res.status(404).json({ message: "Cuenta no encontrada." });

    const [movimientos] = await pool.query(
      `SELECT 
         idMovimiento,
         monto,
         tipoMovimiento,
         fechaHora
       FROM movimiento
       WHERE idCuenta = ?
       ORDER BY fechaHora DESC`,
      [idCuenta]
    );

    res.json({
      cuenta: cuentaRows[0],
      movimientos,
    });
  } catch (error) {
    console.error("❌ Error al consultar detalle de cuenta:", error);
    res.status(500).json({ message: "Error al obtener el detalle de la cuenta." });
  }
});

export default router;
