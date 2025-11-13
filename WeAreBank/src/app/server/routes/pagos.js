import express from "express";
import pool from "../db.js";
// 🔽 1. Importar el mailer
import { enviarCorreoMovimiento } from "../../utils/mailer.js";

const router = express.Router();

/**
 * 🔹 POST /api/pagos/servicio
 * Realiza un pago de servicio
 */
router.post("/servicio", async (req, res) => {
  const { idCuenta, monto, referencia } = req.body;
  let connection; // Definir connection fuera del try

  if (!idCuenta || !monto || monto <= 0) {
    return res.status(400).json({ error: "Datos de pago inválidos" });
  }

  try {
    connection = await pool.getConnection(); // Obtener conexión
    await connection.beginTransaction(); // Iniciar transacción

    // 🔽 2. Modificar consulta para obtener email y clabe y bloquear la fila
    const [cuentaRows] = await connection.query(
      `SELECT c.saldo, u.email, c.clabe 
       FROM cuenta c
       JOIN pertenece p ON c.idCuenta = p.idCuenta
       JOIN usuario u ON p.idUsuario = u.idUsuario
       WHERE c.idCuenta = ?
       FOR UPDATE`, // Bloquear para la transacción
      [idCuenta]
    );

    if (cuentaRows.length === 0) {
      await connection.rollback();
      connection.release();
      return res.status(404).json({ error: "Cuenta no encontrada" });
    }

    const { saldo, email, clabe } = cuentaRows[0]; // 🔽 Obtener datos

    if (saldo < monto) {
      await connection.rollback();
      connection.release();
      return res.status(400).json({ error: "Saldo insuficiente" });
    }

    // 🔹 Actualizar saldo
    await connection.query(
      "UPDATE cuenta SET saldo = saldo - ? WHERE idCuenta = ?",
      [monto, idCuenta]
    );

    // 🔹 Registrar movimiento con fechaHora
    const tipoMov = `PAGO_SERVICIO: ${referencia || 'Servicio'}`; // 🔽 Usamos la referencia
    await connection.query(
      `INSERT INTO movimiento (idCuenta, monto, tipoMovimiento, fechaHora)
       VALUES (?, ?, ?, NOW())`,
      [idCuenta, -monto, tipoMov]
    );

    await connection.commit(); // Commit de la transacción
    connection.release(); // Liberar conexión

    // 🔽 3. Enviar correo (fuera de la transacción)
    if (email) {
      // 🔽 Usamos tipoMov dinámico
      await enviarCorreoMovimiento(email, tipoMov, monto, clabe); 
    }

    res.json({
      message: ` Pago de ${referencia || "servicio"} realizado correctamente.`,
      nuevoSaldo: saldo - monto,
    });
  } catch (error) {
    if (connection) {
      await connection.rollback(); // Rollback en caso de error
      connection.release();
    }
    console.error(" Error en pago de servicio:", error);
    res.status(500).json({ error: "Error al procesar el pago" });
  }
});

/**
 * 🔹 POST /api/pagos/prestamo
 * Realiza un pago de préstamo
 */
router.post("/prestamo", async (req, res) => {
  const { idCuenta, idSolicitud, monto } = req.body;
  let connection; // Definir connection

  if (!idCuenta || !idSolicitud || !monto || monto <= 0) {
    return res.status(400).json({ error: "Datos de pago de préstamo inválidos" });
  }

  try {
    connection = await pool.getConnection(); // Obtener conexión
    await connection.beginTransaction(); // Iniciar transacción

    // 🔽 2. Modificar consulta para obtener email y clabe
    const [cuentaRows] = await connection.query(
      `SELECT c.saldo, u.email, c.clabe 
       FROM cuenta c
       JOIN pertenece p ON c.idCuenta = p.idCuenta
       JOIN usuario u ON p.idUsuario = u.idUsuario
       WHERE c.idCuenta = ?
       FOR UPDATE`, // Bloquear para la transacción
      [idCuenta]
    );

    if (cuentaRows.length === 0) {
      await connection.rollback();
      connection.release();
      return res.status(404).json({ error: "Cuenta no encontrada" });
    }

    const { saldo, email, clabe } = cuentaRows[0]; // 🔽 Obtener datos

    if (saldo < monto) {
      await connection.rollback();
      connection.release();
      return res.status(400).json({ error: "Saldo insuficiente" });
    }

    // Verificar que la solicitud existe y está aprobada
    const [solicitudRows] = await connection.query(
      `SELECT s.idSolicitud, s.montoTotal, s.tipo, s.estado
       FROM solicitud s
       WHERE s.idSolicitud = ? AND s.idCuenta = ?`,
      [idSolicitud, idCuenta]
    );

    if (solicitudRows.length === 0) {
      await connection.rollback();
      connection.release();
      return res.status(404).json({ error: "Solicitud de préstamo no encontrada" });
    }

    if (solicitudRows[0].estado !== "APROBADA") {
      await connection.rollback();
      connection.release();
      return res.status(400).json({ error: "La solicitud no está aprobada" });
    }

    // Actualizar saldo
    await connection.query(
      "UPDATE cuenta SET saldo = saldo - ? WHERE idCuenta = ?",
      [monto, idCuenta]
    );

    // Registrar en PagosSolicitud
    await connection.query(
      `INSERT INTO PagosSolicitud (idSolicitud, monto, fechaHora)
       VALUES (?, ?, NOW())`,
      [idSolicitud, monto]
    );

    // Registrar movimiento
    const tipoMov = `PAGO_PRESTAMO: ${solicitudRows[0].tipo}`; // 🔽 Usamos el tipo de préstamo
    await connection.query(
      `INSERT INTO movimiento (idCuenta, monto, tipoMovimiento, fechaHora)
       VALUES (?, ?, ?, NOW())`,
      [idCuenta, -monto, tipoMov]
    );

    await connection.commit(); // Commit de la transacción
    connection.release(); // Liberar conexión

    // 🔽 3. Enviar correo (fuera de la transacción)
    if (email) {
      // 🔽 Usamos tipoMov dinámico
      await enviarCorreoMovimiento(email, tipoMov, monto, clabe);
    }

    res.json({
      message: ` Pago de préstamo realizado correctamente.`,
      nuevoSaldo: saldo - monto,
    });
  } catch (error) {
    if (connection) {
      await connection.rollback(); // Rollback en caso de error
      connection.release();
    }
    console.error(" Error en pago de préstamo:", error);
    res.status(500).json({ error: "Error al procesar el pago de préstamo" });
  }
});

// ... (el resto del archivo /historial y /prestamos queda igual) ...
// (Lo incluyo para que sea el archivo completo)

/**
 * 🔹 GET /api/pagos/historial/:idUsuario
 * Obtiene el historial completo de pagos (servicios y préstamos)
 */
router.get("/historial/:idUsuario", async (req, res) => {
  const { idUsuario } = req.params;

  try {
    // Obtener pagos de servicios
    const [pagosServicios] = await pool.query(
      `SELECT 
         m.idMovimiento,
         m.fechaHora,
         m.monto,
         m.tipoMovimiento,
         c.clabe,
         'SERVICIO' as tipoPago
       FROM movimiento m
       INNER JOIN cuenta c ON m.idCuenta = c.idCuenta
       INNER JOIN pertenece p ON c.idCuenta = p.idCuenta
       WHERE p.idUsuario = ? 
         AND m.tipoMovimiento LIKE 'PAGO_SERVICIO%'
       ORDER BY m.fechaHora DESC`,
      [idUsuario]
    );

    // Obtener pagos de préstamos
    const [pagosPrestamos] = await pool.query(
      `SELECT 
         ps.idPago,
         ps.fechaHora,
         ps.monto,
         s.tipo as tipoMovimiento,
         c.clabe,
         'PRESTAMO' as tipoPago,
         s.idSolicitud
       FROM PagosSolicitud ps
       INNER JOIN solicitud s ON ps.idSolicitud = s.idSolicitud
       INNER JOIN cuenta c ON s.idCuenta = c.idCuenta
       INNER JOIN pertenece p ON c.idCuenta = p.idCuenta
       WHERE p.idUsuario = ?
       ORDER BY ps.fechaHora DESC`,
      [idUsuario]
    );

    // Combinar y ordenar por fecha
    const historialCompleto = [
      ...pagosServicios.map(p => ({
        id: p.idMovimiento,
        fecha: p.fechaHora,
        monto: Math.abs(p.monto),
        tipo: p.tipoMovimiento.replace('PAGO_SERVICIO: ', ''),
        clabe: p.clabe,
        categoria: 'Servicio'
      })),
      ...pagosPrestamos.map(p => ({
        id: p.idPago,
        fecha: p.fechaHora,
        monto: p.monto,
        tipo: p.tipoMovimiento,
        clabe: p.clabe,
        categoria: 'Préstamo',
        idSolicitud: p.idSolicitud
      }))
    ].sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

    res.json(historialCompleto);
  } catch (error) {
    console.error(" Error al obtener historial de pagos:", error);
    res.status(500).json({ error: "Error al obtener el historial de pagos" });
  }
});

/**
 * 🔹 GET /api/pagos/prestamos/:idUsuario
 * Obtiene todos los préstamos aprobados del usuario
 */
router.get("/prestamos/:idUsuario", async (req, res) => {
  const { idUsuario } = req.params;

  try {
    const [prestamos] = await pool.query(
      `SELECT 
         s.idSolicitud,
         s.tipo,
         s.montoTotal,
         s.plazo,
         s.intereses,
         s.estado,
         c.idCuenta,
         c.clabe,
         COALESCE(SUM(ps.monto), 0) as totalPagado
       FROM solicitud s
       INNER JOIN cuenta c ON s.idCuenta = c.idCuenta
       INNER JOIN pertenece p ON c.idCuenta = p.idCuenta
       LEFT JOIN PagosSolicitud ps ON s.idSolicitud = ps.idSolicitud
       WHERE p.idUsuario = ? AND s.estado = 'APROBADA'
       GROUP BY s.idSolicitud, s.tipo, s.montoTotal, s.plazo, s.intereses, s.estado, c.idCuenta, c.clabe`,
      [idUsuario]
    );

    res.json(prestamos);
  } catch (error) {
    console.error(" Error al obtener préstamos:", error);
    res.status(500).json({ error: "Error al obtener los préstamos" });
  }
});

export default router;