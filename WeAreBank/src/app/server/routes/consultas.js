import express from "express";
import pool from "../db.js";
// 🔽 1. Importar el generador de PDF
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
 * 🔽 === 2. ENDPOINT PARA PDF AÑADIDO === 🔽
 * 🔹 GET /api/consultas/estado-cuenta-pdf/:clabe
 * Genera y devuelve un PDF del estado de cuenta
 */
router.get("/estado-cuenta-pdf/:clabe", async (req, res) => {
  const { clabe } = req.params;

  if (!clabe) {
    return res.status(400).json({ message: "CLABE es requerida." });
  }
  
  let connection;
  try {
    connection = await pool.getConnection();

    // 1. Obtener datos de la cuenta
    const [cuentaRows] = await connection.query(
      `SELECT * FROM cuenta WHERE clabe = ?`,
      [clabe]
    );

    if (cuentaRows.length === 0) {
      connection.release();
      return res.status(404).json({ message: "Cuenta no encontrada." });
    }
    const datosCuenta = cuentaRows[0];
    const idCuenta = datosCuenta.idCuenta;

    // 2. Obtener datos del usuario (basado en la cuenta)
    const [usuarioRows] = await connection.query(
      `SELECT u.nombre, u.apellidoP, u.apellidoM, u.RFC, u.email 
       FROM usuario u
       JOIN pertenece p ON u.idUsuario = p.idUsuario
       WHERE p.idCuenta = ?
       LIMIT 1`,
      [idCuenta]
    );
    
    if (usuarioRows.length === 0) {
      connection.release();
      return res.status(404).json({ message: "Usuario no encontrado para esta cuenta." });
    }
    const usuario = usuarioRows[0];

    // 3. Obtener movimientos (ordenados ASC para el cálculo de saldo en el PDF)
    const [movimientos] = await connection.query(
      `SELECT * FROM movimiento
       WHERE idCuenta = ?
       ORDER BY fechaHora ASC`, // ASC para que el generador de PDF calcule el saldo correctamente
      [idCuenta]
    );

    connection.release();

    // 4. Generar el PDF
    const pdfBuffer = await generarEstadoCuentaPDF(datosCuenta, movimientos, usuario); //

    // 5. Enviar el PDF como respuesta
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=estado-cuenta-${clabe}.pdf`);
    res.send(pdfBuffer);

  } catch (error) {
    if (connection) connection.release();
    console.error("❌ Error al generar estado de cuenta PDF:", error);
    res.status(500).json({ message: "Error al generar el PDF." });
  }
});

/**
 * 🔹 GET /api/consultas/mis-tarjetas/:idUsuario
 * Obtiene todas las tarjetas (con nombre del titular) asociadas a un usuario
 */
router.get("/mis-tarjetas/:idUsuario", async (req, res) => {
  const { idUsuario } = req.params;

  if (!idUsuario) {
    return res.status(400).json({ message: "ID de usuario es requerido" });
  }

  try {
    const [tarjetas] = await pool.query(
      `SELECT
         t.idTarjeta, t.numeroTarjeta, t.vencimiento, t.tipoTarjeta, t.esVirtual,
         u.nombre, u.apellidoP, u.apellidoM
       FROM tarjeta t
       JOIN cuenta c ON t.idCuenta = c.idCuenta
       JOIN pertenece p ON c.idCuenta = p.idCuenta
       JOIN usuario u ON p.idUsuario = u.idUsuario
       WHERE p.idUsuario = ?
       ORDER BY t.tipoTarjeta, t.idTarjeta`,
      [idUsuario]
    );

    res.json(tarjetas);
  } catch (error) {
    console.error("❌ Error al consultar tarjetas:", error);
    res.status(500).json({ message: "Error al obtener las tarjetas." });
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