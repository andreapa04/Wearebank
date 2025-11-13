import express from "express";
import pool from "../db.js";

const router = express.Router();

/**
 * 🔹 GET /api/ejecutivo/stats
 * Obtiene las estadísticas para el dashboard del ejecutivo
 */
router.get("/stats", async (req, res) => {
  try {
    const [[clientesActivos]] = await pool.query(
      "SELECT COUNT(*) as total FROM usuario WHERE idRol = 3 AND estatus = 'ACTIVO'"
    );

    const [[prestamosOtorgados]] = await pool.query(
      "SELECT COUNT(*) as total FROM solicitud WHERE estado = 'APROBADA'"
    );

    const [[solicitudesMes]] = await pool.query(
      `SELECT COUNT(*) as total FROM solicitud 
       WHERE MONTH(fechaSolicitud) = MONTH(CURRENT_DATE()) 
       AND YEAR(fechaSolicitud) = YEAR(CURRENT_DATE())`
    );

    res.json({
      clientesActivos: clientesActivos.total,
      prestamosOtorgados: prestamosOtorgados.total,
      solicitudesMes: solicitudesMes.total,
    });
  } catch (error) {
    console.error("❌ Error al obtener stats:", error);
    res.status(500).json({ error: "Error al obtener estadísticas" });
  }
});

/**
 * 🔹 GET /api/ejecutivo/cartera-cuentas
 * Obtiene todas las cuentas de todos los clientes
 */
router.get("/cartera-cuentas", async (req, res) => {
  try {
    const [cuentas] = await pool.query(
      `SELECT 
         c.idCuenta, c.clabe, c.tipoCuenta, c.saldo,
         u.idUsuario, u.nombre, u.apellidoP, u.apellidoM, u.email
       FROM cuenta c
       JOIN pertenece p ON c.idCuenta = p.idCuenta
       JOIN usuario u ON p.idUsuario = u.idUsuario
       WHERE u.idRol = 3
       ORDER BY u.apellidoP, c.idCuenta`
    );
    res.json(cuentas);
  } catch (error) {
    console.error("❌ Error al obtener cartera:", error);
    res.status(500).json({ error: "Error al obtener cartera de cuentas" });
  }
});

/**
 * 🔹 DELETE /api/ejecutivo/eliminar-cuenta/:idCuenta
 * Elimina una cuenta bancaria (Hard Delete)
 */
router.delete("/eliminar-cuenta/:idCuenta", async (req, res) => {
  const { idCuenta } = req.params;
  try {
    // La BD está configurada con ON DELETE CASCADE,
    // así que esto eliminará la cuenta y las referencias en 'pertenece' y 'tarjeta'.
    await pool.query("DELETE FROM cuenta WHERE idCuenta = ?", [idCuenta]);
    res.json({ message: "Cuenta eliminada correctamente" });
  } catch (error) {
    console.error("❌ Error al eliminar cuenta:", error);
    res.status(500).json({ error: "Error al eliminar la cuenta" });
  }
});

/**
 * 🔹 GET /api/ejecutivo/solicitudes/:estado
 * Obtiene solicitudes 'EN_REVISION' o 'HISTORIAL' (APROBADA, RECHAZADA, LIQUIDADA)
 */
router.get("/solicitudes/:tipoEstado", async (req, res) => {
  const { tipoEstado } = req.params;
  let queryEstado = "";

  if (tipoEstado === 'PENDIENTES') {
    queryEstado = "WHERE s.estado = 'EN_REVISION'";
  } else if (tipoEstado === 'HISTORIAL') {
    queryEstado = "WHERE s.estado != 'EN_REVISION'";
  } else {
    return res.status(400).json({ error: "Tipo de estado no válido" });
  }

  try {
    const [solicitudes] = await pool.query(
      `SELECT 
         s.*, 
         u.idUsuario, u.nombre, u.apellidoP, u.apellidoM, u.CURP, u.email,
         b.puntaje, b.fechaConsulta
       FROM solicitud s
       JOIN cuenta c ON s.idCuenta = c.idCuenta
       JOIN pertenece p ON c.idCuenta = p.idCuenta
       JOIN usuario u ON p.idUsuario = u.idUsuario
       LEFT JOIN buro b ON u.idUsuario = b.idUsuario
       ${queryEstado}
       ORDER BY s.fechaSolicitud DESC`
    );
    res.json(solicitudes);
  } catch (error) {
    console.error("❌ Error al obtener solicitudes:", error);
    res.status(500).json({ error: "Error al obtener solicitudes" });
  }
});

/**
 * 🔹 POST /api/ejecutivo/procesar-solicitud/:idSolicitud
 * Aprueba o rechaza una solicitud
 */
router.post("/procesar-solicitud/:idSolicitud", async (req, res) => {
  const { idSolicitud } = req.params;
  const { aprobar } = req.body; // true o false
  const nuevoEstado = aprobar ? "APROBADA" : "RECHAZADA";

  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    const [[solicitud]] = await connection.query(
      "SELECT * FROM solicitud WHERE idSolicitud = ?",
      [idSolicitud]
    );

    if (!solicitud) {
      await connection.rollback();
      connection.release();
      return res.status(404).json({ error: "Solicitud no encontrada" });
    }
    
    // 1. Actualizar estado de la solicitud
    await connection.query(
      "UPDATE solicitud SET estado = ? WHERE idSolicitud = ?",
      [nuevoEstado, idSolicitud]
    );

    // 2. Si fue aprobada, ejecutar lógicas
    if (aprobar) {
      const { idCuenta, montoTotal, tipo } = solicitud;

      // 🔽 Lógica para Préstamos (Depositar en cuenta)
      if (tipo.startsWith("PRESTAMO_")) {
        await connection.query(
          "UPDATE cuenta SET saldo = saldo + ? WHERE idCuenta = ?",
          [montoTotal, idCuenta]
        );
        await connection.query(
          "INSERT INTO movimiento (idCuenta, monto, tipoMovimiento, fechaHora) VALUES (?, ?, ?, NOW())",
          [idCuenta, montoTotal, tipo]
        );
      }

      // 🔽 Lógica para Créditos (Añadir a tarjeta o crear una nueva)
      if (tipo.startsWith("CREDITO_")) {
        const [[usuario]] = await connection.query(
          "SELECT idUsuario FROM pertenece WHERE idCuenta = ?", [idCuenta]
        );
        
        const [[tarjetaCredito]] = await connection.query(
          `SELECT t.idTarjeta 
           FROM tarjeta t
           JOIN cuenta c ON t.idCuenta = c.idCuenta
           JOIN pertenece p ON c.idCuenta = p.idCuenta
           WHERE p.idUsuario = ? AND t.tipoTarjeta = 'CREDITO'
           LIMIT 1`,
          [usuario.idUsuario]
        );

        if (tarjetaCredito) {
          // Ya tiene T.C.: Aumentar límite
          await connection.query(
            "UPDATE tarjeta SET limiteCredito = limiteCredito + ? WHERE idTarjeta = ?",
            [montoTotal, tarjetaCredito.idTarjeta]
          );
        } else {
          // No tiene T.C.: Crear una nueva
          const numeroTarjeta = '54' + Math.floor(10000000000000 + Math.random() * 90000000000000);
          const cvv = Math.floor(100 + Math.random() * 900);
          const vencimiento = new Date();
          vencimiento.setFullYear(vencimiento.getFullYear() + 5);

          await connection.query(
            `INSERT INTO tarjeta (idCuenta, numeroTarjeta, vencimiento, cvv, tipoTarjeta, esVirtual, estado, limiteCredito, pagoMinimo, fechaLimite, fechaCorte, intereses, anualidad)
             VALUES (?, ?, ?, ?, 'CREDITO', FALSE, 'ACTIVA', ?, ?, CURDATE(), CURDATE(), 18.5, 699.00)`,
            [idCuenta, numeroTarjeta, vencimiento, cvv, montoTotal, montoTotal * 0.1]
          );
        }
      }
    }

    await connection.commit();
    connection.release();
    res.json({ message: `Solicitud ${nuevoEstado.toLowerCase()} correctamente.` });

  } catch (error) {
    if (connection) {
      await connection.rollback();
      connection.release();
    }
    console.error("❌ Error al procesar solicitud:", error);
    res.status(500).json({ error: "Error al procesar la solicitud" });
  }
});

/**
 * 🔹 GET /api/ejecutivo/clientes-consulta
 * Obtiene lista de clientes para consulta
 */
router.get("/clientes-consulta", async (req, res) => {
  try {
    const [clientes] = await pool.query(
      `SELECT idUsuario, nombre, apellidoP, apellidoM, email, telefono, RFC, CURP 
       FROM usuario 
       WHERE idRol = 3 AND estatus = 'ACTIVO'
       ORDER BY apellidoP, nombre`
    );
    res.json(clientes);
  } catch (error) {
    console.error("❌ Error al obtener clientes:", error);
    res.status(500).json({ error: "Error al obtener clientes" });
  }
});

/**
 * 🔹 GET /api/ejecutivo/cliente-detalle/:idUsuario
 * Obtiene cuentas y movimientos de un cliente específico
 */
router.get("/cliente-detalle/:idUsuario", async (req, res) => {
  const { idUsuario } = req.params;
  try {
    const [cuentas] = await pool.query(
      "SELECT * FROM cuenta c JOIN pertenece p ON c.idCuenta = p.idCuenta WHERE p.idUsuario = ?",
      [idUsuario]
    );

    const [movimientos] = await pool.query(
      `SELECT m.* FROM movimiento m
       JOIN cuenta c ON m.idCuenta = c.idCuenta
       JOIN pertenece p ON c.idCuenta = p.idCuenta
       WHERE p.idUsuario = ?
       ORDER BY m.fechaHora DESC
       LIMIT 100`, // Limitar a 100 para no sobrecargar
      [idUsuario]
    );

    res.json({ cuentas, movimientos });
  } catch (error)
 {
    console.error("❌ Error al obtener detalle cliente:", error);
    res.status(500).json({ error: "Error al obtener detalle del cliente" });
  }
});


export default router;