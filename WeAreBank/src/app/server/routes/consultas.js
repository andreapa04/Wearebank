import express from "express";
import pool from "../db.js";
import { generarEstadoCuentaPDF } from "./estadoCuentaPDF.js";

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

/**
 * 🔹 GET /api/consultas/estado-cuenta-pdf/:clabe
 * Genera el PDF del estado de cuenta para una CLABE específica
 */
router.get("/estado-cuenta-pdf/:clabe", async (req, res) => {
  const { clabe } = req.params;

  try {
    // 1. Obtener información de la cuenta
    const [cuentaRows] = await pool.query(
      `SELECT c.idCuenta, c.clabe, c.tipoCuenta, c.saldo
       FROM cuenta c
       WHERE c.clabe = ?`,
      [clabe]
    );

    if (cuentaRows.length === 0) {
      return res.status(404).json({ message: "Cuenta no encontrada." });
    }

    const cuenta = cuentaRows[0];

    // 2. Obtener el usuario propietario
    const [usuarioRows] = await pool.query(
      `SELECT u.nombre, u.apellidoP, u.apellidoM, u.RFC, u.email
       FROM usuario u
       INNER JOIN pertenece p ON p.idUsuario = u.idUsuario
       WHERE p.idCuenta = ?
       LIMIT 1`,
      [cuenta.idCuenta]
    );

    if (usuarioRows.length === 0) {
      return res.status(404).json({ message: "Usuario no encontrado." });
    }

    const usuario = usuarioRows[0];

    // 3. Obtener movimientos del mes actual
    const fechaInicio = new Date();
    fechaInicio.setDate(1);
    fechaInicio.setHours(0, 0, 0, 0);

    const fechaFin = new Date();
    fechaFin.setMonth(fechaFin.getMonth() + 1);
    fechaFin.setDate(0);
    fechaFin.setHours(23, 59, 59, 999);

    const [movimientos] = await pool.query(
      `SELECT 
         idMovimiento,
         monto,
         tipoMovimiento,
         fechaHora
       FROM movimiento
       WHERE idCuenta = ?
         AND fechaHora BETWEEN ? AND ?
       ORDER BY fechaHora ASC`,
      [cuenta.idCuenta, fechaInicio, fechaFin]
    );

    // 4. Generar el PDF
    const pdfBuffer = await generarEstadoCuentaPDF(cuenta, movimientos, usuario);

    // 5. Enviar el PDF como respuesta
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=estado-cuenta-${clabe}-${new Date().getFullYear()}-${(new Date().getMonth() + 1).toString().padStart(2, "0")}.pdf`
    );
    res.send(pdfBuffer);
  } catch (error) {
    console.error("❌ Error al generar PDF:", error);
    res.status(500).json({ message: "Error al generar el estado de cuenta en PDF." });
  }
});

export default router;
