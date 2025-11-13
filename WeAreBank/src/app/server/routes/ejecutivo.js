import express from "express";
import pool from "../db.js";
// 🔽 --- 1. Importar el nuevo mailer --- 🔽
import { enviarCorreoCierreCuenta } from "../../utils/mailer.js";

const router = express.Router();

/**
 * 🔹 GET /api/ejecutivo/stats
 * Obtiene las estadísticas para el dashboard del ejecutivo
 */
router.get("/stats", async (req, res) => {
  try {
    const [[{ clientesActivos }]] = await pool.query(
      "SELECT COUNT(*) AS clientesActivos FROM usuario WHERE idRol = 3 AND estatus = 'ACTIVO'"
    );
    const [[{ prestamosOtorgados }]] = await pool.query(
      "SELECT COUNT(*) AS prestamosOtorgados FROM solicitud WHERE estado = 'APROBADA'"
    );
    const [[{ solicitudesMes }]] = await pool.query(
      "SELECT COUNT(*) AS solicitudesMes FROM solicitud WHERE MONTH(fechaSolicitud) = MONTH(NOW()) AND YEAR(fechaSolicitud) = YEAR(NOW())"
    );
    res.json({ clientesActivos, prestamosOtorgados, solicitudesMes });
  } catch (error) {
    console.error("Error al cargar stats:", error);
    res.status(500).json({ message: "Error al cargar estadísticas" });
  }
});

/**
 * 🔹 GET /api/ejecutivo/cartera-cuentas
 * Obtiene la lista de todos los clientes (rol 3) con sus cuentas principales
 */
router.get("/cartera-cuentas", async (req, res) => {
  try {
    const [cartera] = await pool.query(`
      SELECT 
        c.idCuenta, c.clabe, c.tipoCuenta, c.saldo,
        u.idUsuario, u.nombre, u.apellidoP, u.apellidoM, u.email
      FROM cuenta c
      JOIN pertenece p ON c.idCuenta = p.idCuenta
      JOIN usuario u ON p.idUsuario = u.idUsuario
      WHERE u.idRol = 3
      ORDER BY u.apellidoP, c.idCuenta
    `);
    res.json(cartera);
  } catch (error) {
    console.error("Error al cargar cartera:", error);
    res.status(500).json({ message: "Error al cargar cartera de cuentas" });
  }
});

/**
 * 🔹 DELETE /api/ejecutivo/eliminar-cuenta/:idCuenta
 * Cierra la cuenta de un cliente (lo marca como INACTIVO)
 */
router.delete("/eliminar-cuenta/:idCuenta", async (req, res) => {
  const { idCuenta } = req.params;
  let connection;

  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // 1. Obtener el idUsuario, email y nombre (MODIFICADO)
    const [perteneceRows] = await connection.query(
      `SELECT p.idUsuario, u.email, u.nombre 
       FROM pertenece p
       JOIN usuario u ON p.idUsuario = u.idUsuario 
       WHERE p.idCuenta = ?`,
      [idCuenta]
    );
    if (perteneceRows.length === 0) {
      throw new Error("Relación cuenta-usuario no encontrada");
    }
    // 🔽 --- 2. Obtener datos para el correo --- 🔽
    const { idUsuario, email, nombre } = perteneceRows[0];

    // 2. Validar que no tenga préstamos o créditos activos
    const [solicitudRows] = await connection.query(
      `SELECT COUNT(*) AS activos 
       FROM solicitud s
       JOIN pertenece p ON s.idCuenta = p.idCuenta
       WHERE p.idUsuario = ? AND s.estado = 'APROBADA'`, // APROBADA = Activo
      [idUsuario]
    );

    if (solicitudRows[0].activos > 0) {
      await connection.rollback();
      connection.release();
      return res.status(400).json({
        message:
          "Acción denegada: El cliente tiene préstamos o créditos activos.",
      });
    }

    // 3. Si no hay deudas, marcar al usuario como INACTIVO
    await connection.query(
      "UPDATE usuario SET estatus = 'INACTIVO' WHERE idUsuario = ?",
      [idUsuario]
    );

    await connection.commit();
    connection.release();

    // 🔽 --- 3. Enviar correo de notificación --- 🔽
    await enviarCorreoCierreCuenta(email, nombre);

    res
      .status(200)
      .json({
        message: `El usuario (ID: ${idUsuario}) ha sido marcado como INACTIVO.`,
      });
  } catch (error) {
    if (connection) {
      await connection.rollback();
      connection.release();
    }
    console.error("Error al cerrar cuenta:", error);
    res
      .status(500)
      .json({ message: "Error al procesar el cierre de la cuenta." });
  }
});

/**
 * 🔹 GET /api/ejecutivo/solicitudes-prestamo
 * (Sin cambios en esta ruta)
 */
router.get("/solicitudes-prestamo", async (req, res) => {
  try {
    const [pendientes] = await pool.query(
      `SELECT s.*, u.nombre, u.apellidoP, u.email, b.puntaje 
       FROM solicitud s
       JOIN cuenta c ON s.idCuenta = c.idCuenta
       JOIN pertenece p ON c.idCuenta = p.idCuenta
       JOIN usuario u ON p.idUsuario = u.idUsuario
       LEFT JOIN buro b ON u.idUsuario = b.idUsuario
       WHERE s.estado = 'EN_REVISION'
       ORDER BY s.fechaSolicitud ASC`
    );

    const [historial] = await pool.query(
      `SELECT s.*, u.nombre, u.apellidoP, u.email 
       FROM solicitud s
       JOIN cuenta c ON s.idCuenta = c.idCuenta
       JOIN pertenece p ON c.idCuenta = p.idCuenta
       JOIN usuario u ON p.idUsuario = u.idUsuario
       WHERE s.estado != 'EN_REVISION'
       ORDER BY s.fechaSolicitud DESC
       LIMIT 50`
    );

    res.json({ pendientes, historial });
  } catch (error) {
    console.error("Error al cargar solicitudes:", error);
    res.status(500).json({ message: "Error al cargar solicitudes" });
  }
});

/**
 * 🔹 POST /api/ejecutivo/procesar-prestamo
 * (Sin cambios en esta ruta)
 */
router.post("/procesar-prestamo", async (req, res) => {
  const { idSolicitud, aprobado } = req.body;
  const idEjecutivo = 2; // ID de ejecutivo de prueba
  let connection;

  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    const [solicitudRows] = await connection.query(
      "SELECT * FROM solicitud WHERE idSolicitud = ?",
      [idSolicitud]
    );
    if (solicitudRows.length === 0) throw new Error("Solicitud no encontrada");

    const solicitud = solicitudRows[0];
    if (solicitud.estado !== "EN_REVISION")
      throw new Error("La solicitud ya fue procesada");

    const nuevoEstado = aprobado ? "APROBADA" : "RECHAZADA";

    await connection.query(
      "UPDATE solicitud SET estado = ? WHERE idSolicitud = ?",
      [nuevoEstado, idSolicitud]
    );

    // Si es un PRÉSTAMO y se aprueba, depositar el dinero
    if (aprobado && solicitud.tipo.startsWith("PRESTAMO_")) {
      await connection.query(
        "UPDATE cuenta SET saldo = saldo + ? WHERE idCuenta = ?",
        [solicitud.montoTotal, solicitud.idCuenta]
      );
      await connection.query(
        "INSERT INTO movimiento (idCuenta, monto, tipoMovimiento) VALUES (?, ?, ?)",
        [solicitud.idCuenta, solicitud.montoTotal, "ABONO_PRESTAMO"]
      );
    }

    // Si es un CRÉDITO y se aprueba, crear la tarjeta
    if (aprobado && solicitud.tipo.startsWith("CREDITO_")) {
      const [usuarioRows] = await connection.query(
        "SELECT idUsuario FROM pertenece WHERE idCuenta = ?",
        [solicitud.idCuenta]
      );
      const idUsuario = usuarioRows[0].idUsuario;

      const [tarjetas] = await connection.query(
        "SELECT * FROM tarjeta WHERE idCuenta = ? AND tipoTarjeta = 'CREDITO'",
        [solicitud.idCuenta]
      );

      if (tarjetas.length === 0) {
        // No tiene tarjeta de crédito, crear una nueva
        const numeroTarjeta =
          "5500" + Math.floor(100000000000 + Math.random() * 900000000000).toString().substring(0, 12);
        const cvv = Math.floor(100 + Math.random() * 900);
        const vencimiento = new Date();
        vencimiento.setFullYear(vencimiento.getFullYear() + 5);

        await connection.query(
          `INSERT INTO tarjeta (idCuenta, numeroTarjeta, vencimiento, cvv, tipoTarjeta, estado, limiteCredito, intereses, anualidad)
           VALUES (?, ?, ?, ?, 'CREDITO', 'ACTIVA', ?, ?, ?)`,
          [
            solicitud.idCuenta,
            numeroTarjeta,
            vencimiento,
            cvv,
            solicitud.montoTotal,
            solicitud.intereses,
            800, // Anualidad de ejemplo
          ]
        );
      }
    }

    await connection.commit();
    connection.release();
    res.json({ message: `Solicitud ${nuevoEstado} exitosamente.` });
  } catch (error) {
    if (connection) {
      await connection.rollback();
      connection.release();
    }
    console.error("Error al procesar solicitud:", error);
    res.status(500).json({ message: "Error al procesar la solicitud" });
  }
});


// 🔽 --- RUTAS DE CIERRE DE CUENTA MODIFICADAS --- 🔽

/**
 * 🔹 GET /api/ejecutivo/solicitudes-cierre
 * (Sin cambios en esta ruta)
 */
router.get("/solicitudes-cierre", async (req, res) => {
  try {
    const [solicitudes] = await pool.query(`
      SELECT sc.idSolicitudCierre, sc.fechaSolicitud, u.idUsuario, u.nombre, u.apellidoP, u.email
      FROM solicitud_cierre sc
      JOIN usuario u ON sc.idUsuario = u.idUsuario
      WHERE sc.estado = 'PENDIENTE'
      ORDER BY sc.fechaSolicitud ASC
    `);
    res.json(solicitudes);
  } catch (error) {
    console.error("Error al cargar solicitudes de cierre:", error);
    res.status(500).json({ message: "Error al cargar solicitudes" });
  }
});

/**
 * 🔹 POST /api/ejecutivo/procesar-cierre
 * Aprueba o rechaza una solicitud de cierre
 */
router.post("/procesar-cierre", async (req, res) => {
  const { idSolicitudCierre, aprobado, razon_rechazo } = req.body;
  const idEjecutivo = 2; // ID de ejecutivo de prueba
  let connection;

  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // 1. Obtener el idUsuario de la solicitud
    const [solRows] = await connection.query(
      "SELECT idUsuario FROM solicitud_cierre WHERE idSolicitudCierre = ?",
      [idSolicitudCierre]
    );
    if (solRows.length === 0) {
      throw new Error("Solicitud de cierre no encontrada");
    }
    const idUsuario = solRows[0].idUsuario;

    if (aprobado) {
      // 2. Validar que no tenga préstamos o créditos activos
      const [solicitudRows] = await connection.query(
        `SELECT COUNT(*) AS activos 
         FROM solicitud s
         JOIN pertenece p ON s.idCuenta = p.idCuenta
         WHERE p.idUsuario = ? AND s.estado = 'APROBADA'`,
        [idUsuario]
      );

      if (solicitudRows[0].activos > 0) {
        await connection.rollback();
        connection.release();
        return res.status(400).json({
          message:
            "Aprobación denegada: El cliente tiene préstamos activos. Rechaza la solicitud e informa al cliente.",
        });
      }

      // 3. Si no hay deudas, marcar al usuario como INACTIVO
      await connection.query(
        "UPDATE usuario SET estatus = 'INACTIVO' WHERE idUsuario = ?",
        [idUsuario]
      );
      
      // 4. Actualizar la solicitud de cierre
      await connection.query(
        "UPDATE solicitud_cierre SET estado = 'APROBADA', idEjecutivo = ? WHERE idSolicitudCierre = ?",
        [idEjecutivo, idSolicitudCierre]
      );
      
      // 🔽 --- 5. Obtener datos para correo --- 🔽
      const [userRows] = await connection.query("SELECT nombre, email FROM usuario WHERE idUsuario = ?", [idUsuario]);
      const { nombre, email } = userRows[0];
      
      await connection.commit();
      connection.release();

      // 🔽 --- 6. Enviar correo --- 🔽
      await enviarCorreoCierreCuenta(email, nombre);
      
      res.json({ message: "Solicitud de cierre aprobada. El usuario ha sido desactivado." });

    } else {
      // 5. Rechazar la solicitud
      if (!razon_rechazo) {
        return res.status(400).json({ message: "Se requiere una razón para el rechazo." });
      }
      
      await connection.query(
        "UPDATE solicitud_cierre SET estado = 'RECHAZADA', idEjecutivo = ?, razon_rechazo = ? WHERE idSolicitudCierre = ?",
        [idEjecutivo, razon_rechazo, idSolicitudCierre]
      );
      
      await connection.commit();
      connection.release();
      res.json({ message: "Solicitud de cierre rechazada." });
    }

  } catch (error) {
    if (connection) {
      await connection.rollback();
      connection.release();
    }
    console.error("Error al procesar cierre:", error);
    res.status(500).json({ message: "Error al procesar la solicitud" });
  }
});

/**
 * 🔹 GET /api/ejecutivo/clientes-consulta
 * (Sin cambios en esta ruta)
 */
router.get("/clientes-consulta", async (req, res) => {
  try {
    const [clientes] = await pool.query(
      `SELECT idUsuario, nombre, apellidoP, apellidoM, email, telefono, RFC, CURP
       FROM usuario WHERE idRol = 3
       ORDER BY apellidoP, nombre`
    );
    res.json(clientes);
  } catch (error) {
    console.error("Error al cargar lista de clientes:", error);
    res.status(500).json({ message: "Error al cargar clientes" });
  }
});

/**
 * 🔹 GET /api/ejecutivo/cliente-detalle/:idUsuario
 * (Sin cambios en esta ruta)
 */
router.get("/cliente-detalle/:idUsuario", async (req, res) => {
  const { idUsuario } = req.params;
  try {
    const [cuentas] = await pool.query(
      `SELECT c.idCuenta, c.clabe, c.tipoCuenta, c.saldo
       FROM cuenta c
       JOIN pertenece p ON c.idCuenta = p.idCuenta
       WHERE p.idUsuario = ?`,
      [idUsuario]
    );

    // Obtener movimientos de TODAS las cuentas de ese usuario
    const [movimientos] = await pool.query(
      `SELECT m.idMovimiento, m.fechaHora, m.tipoMovimiento, m.monto
       FROM movimiento m
       JOIN pertenece p ON m.idCuenta = p.idCuenta
       WHERE p.idUsuario = ?
       ORDER BY m.fechaHora DESC
       LIMIT 50`, // Limitar a los últimos 50 movimientos
      [idUsuario]
    );

    res.json({ cuentas, movimientos });
  } catch (error) {
    console.error("Error al cargar detalle de cliente:", error);
    res.status(500).json({ message: "Error al cargar detalle" });
  }
});


export default router;