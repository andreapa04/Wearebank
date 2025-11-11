import express from "express";
import pool from "../db.js";

const router = express.Router();

/**
 * 🔹 POST /api/pagos/servicio
 * Realiza un pago de servicio
 */
router.post("/servicio", async (req, res) => {
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
       VALUES (?, ?, ?, NOW())`,
      [idCuenta, -monto, `PAGO_SERVICIO: ${referencia}`]
    );

    res.json({
      message: `✅ Pago de ${referencia || "servicio"} realizado correctamente.`,
      nuevoSaldo: saldoActual - monto
    });
  } catch (error) {
    console.error("❌ Error en pago de servicio:", error);
    res.status(500).json({ error: "Error al procesar el pago" });
  }
});

/**
 * 🔹 POST /api/pagos/prestamo
 * Realiza un pago de préstamo
 */
router.post("/prestamo", async (req, res) => {
  const { idCuenta, idSolicitud, monto } = req.body;

  if (!idCuenta || !idSolicitud || !monto || monto <= 0) {
    return res.status(400).json({ error: "Datos de pago de préstamo inválidos" });
  }

  try {
    // Verificar que la solicitud existe y está aprobada
    const [solicitudRows] = await pool.query(
      `SELECT s.idSolicitud, s.montoTotal, s.tipo, s.estado
       FROM solicitud s
       WHERE s.idSolicitud = ? AND s.idCuenta = ?`,
      [idSolicitud, idCuenta]
    );

    if (solicitudRows.length === 0) {
      return res.status(404).json({ error: "Solicitud de préstamo no encontrada" });
    }

    if (solicitudRows[0].estado !== "APROBADA") {
      return res.status(400).json({ error: "La solicitud no está aprobada" });
    }

    // Verificar saldo
    const [cuentaRows] = await pool.query("SELECT saldo FROM cuenta WHERE idCuenta = ?", [idCuenta]);

    if (cuentaRows.length === 0) {
      return res.status(404).json({ error: "Cuenta no encontrada" });
    }

    const saldoActual = cuentaRows[0].saldo;

    if (saldoActual < monto) {
      return res.status(400).json({ error: "Saldo insuficiente" });
    }

    // Actualizar saldo
    await pool.query("UPDATE cuenta SET saldo = saldo - ? WHERE idCuenta = ?", [monto, idCuenta]);

    // Registrar en PagosSolicitud
    await pool.query(
      `INSERT INTO PagosSolicitud (idSolicitud, monto, fechaHora)
       VALUES (?, ?, NOW())`,
      [idSolicitud, monto]
    );

    // Registrar movimiento
    await pool.query(
      `INSERT INTO movimiento (idCuenta, monto, tipoMovimiento, fechaHora)
       VALUES (?, ?, ?, NOW())`,
      [idCuenta, -monto, `PAGO_PRESTAMO: ${solicitudRows[0].tipo}`]
    );

    res.json({
      message: `✅ Pago de préstamo realizado correctamente.`,
      nuevoSaldo: saldoActual - monto
    });
  } catch (error) {
    console.error("❌ Error en pago de préstamo:", error);
    res.status(500).json({ error: "Error al procesar el pago de préstamo" });
  }
});

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
    console.error("❌ Error al obtener historial de pagos:", error);
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
    console.error("❌ Error al obtener préstamos:", error);
    res.status(500).json({ error: "Error al obtener los préstamos" });
  }
});

export default router;
