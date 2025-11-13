import express from "express";
import pool from "../db.js";
import bcrypt from "bcryptjs";

const router = express.Router();

// =================================================================
// GESTIÓN DE EJECUTIVOS (USUARIOS CON ROL 2)
// =================================================================

/**
 * 🔹 GET /api/gerente/ejecutivos
 * Obtiene la lista de todos los ejecutivos (Rol 2).
 */
router.get("/ejecutivos", async (req, res) => {
  try {
    const [ejecutivos] = await pool.query(
      `SELECT idUsuario, nombre, apellidoP, apellidoM, email, estatus 
       FROM usuario 
       WHERE idRol = 2 
       ORDER BY apellidoP, nombre`,
    );
    res.json(ejecutivos);
  } catch (error) {
    console.error("Error al cargar ejecutivos:", error);
    res.status(500).json({ error: "Error al cargar ejecutivos" });
  }
});

/**
 * 🔹 POST /api/gerente/ejecutivos
 * Crea un nuevo ejecutivo con todos los campos (Rol 2).
 * ¡MODIFICADO!
 */
router.post("/ejecutivos", async (req, res) => {
  const {
    nombre, apellidoP, apellidoM, direccion, telefono, email,
    contrasenia, fechaNacimiento, CURP, RFC, INE,
    preguntaSeguridad, respuestaSeguridad
  } = req.body;

  // Validación de campos NOT NULL de la BD
  if (
    !nombre || !apellidoP || !apellidoM || !direccion || !telefono || !email ||
    !contrasenia || !fechaNacimiento || !CURP || !RFC || !INE ||
    !preguntaSeguridad || !respuestaSeguridad
  ) {
    return res.status(400).json({ error: "Faltan campos obligatorios para el registro completo." });
  }

  try {
    const hash = await bcrypt.hash(contrasenia, 10);
    const idRolEjecutivo = 2; // Hardcodeado para Ejecutivo

    // Insertar usuario completo
    const [result] = await pool.query(
      `INSERT INTO usuario (
         idRol, nombre, apellidoP, apellidoM, direccion, telefono,
         email, contrasenia, fechaNacimiento, CURP, RFC, INE,
         preguntaSeguridad, respuestaSeguridad, estatus, bloqueado, intentosFallidos
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVO', FALSE, 0)`,
      [
        idRolEjecutivo, nombre, apellidoP, apellidoM, direccion, telefono,
        email, hash, fechaNacimiento, CURP, RFC, INE,
        preguntaSeguridad, respuestaSeguridad
      ]
    );

    const idUsuarioNuevo = result.insertId;

    // 🔽 ¡IMPORTANTE! Asignar por defecto todos los permisos al nuevo ejecutivo
    await pool.query(
      `INSERT INTO Usuario_Permiso (idUsuario, idPermiso)
       SELECT ?, idPermiso FROM Permisos`,
      [idUsuarioNuevo]
    );

    // Registrar en auditoría (Asumimos que el gerente es el id 1)
    await pool.query(
      `INSERT INTO Auditoria (
         idUsuarioResponsable, tipoEvento, descripcion, idEntidadAfectada, tablaAfectada
       ) VALUES (1, 'CREACION_EJECUTIVO', ?, ?, 'usuario')`,
      [
        `Gerente registró al ejecutivo: ${nombre} ${apellidoP}`,
        idUsuarioNuevo
      ]
    );

    res.status(201).json({ 
      message: "Ejecutivo creado exitosamente y con permisos por defecto.", 
      idUsuario: idUsuarioNuevo
    });

  } catch (error) {
    console.error("Error al crear ejecutivo:", error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: "El email, CURP o RFC ya existe." });
    }
    res.status(500).json({ error: "Error al crear ejecutivo." });
  }
});

/**
 * 🔹 DELETE /api/gerente/ejecutivos/:idUsuario
 * Desactiva un ejecutivo
 */
router.delete("/ejecutivos/:idUsuario", async (req, res) => {
  const { idUsuario } = req.params;
  try {
    await pool.query(
      "UPDATE usuario SET estatus = 'INACTIVO' WHERE idUsuario = ? AND idRol = 2",
      [idUsuario]
    );
    res.json({ message: "Ejecutivo desactivado correctamente" });
  } catch (error) {
    console.error("Error al desactivar ejecutivo:", error);
    res.status(500).json({ error: "Error al desactivar ejecutivo" });
  }
});


// =================================================================
// GESTIÓN DE PERMISOS POR EJECUTIVO (idRol = 2)
// ¡MODIFICADO!
// =================================================================

/**
 * 🔹 GET /api/gerente/permisos/catalogo
 * Obtiene la lista maestra de todos los permisos disponibles.
 */
router.get("/permisos/catalogo", async (req, res) => {
  try {
    const [permisos] = await pool.query(
      "SELECT * FROM Permisos ORDER BY nombrePermiso"
    );
    res.json(permisos);
  } catch (error) {
    console.error("Error al cargar catálogo de permisos:", error);
    res.status(500).json({ error: "Error al cargar catálogo de permisos" });
  }
});

/**
 * 🔹 GET /api/gerente/permisos/ejecutivo/:idUsuario
 * Obtiene los IDs de los permisos actuales de un Ejecutivo específico.
 * ¡NUEVO!
 */
router.get("/permisos/ejecutivo/:idUsuario", async (req, res) => {
  const { idUsuario } = req.params;
  try {
    const [permisos] = await pool.query(
      "SELECT idPermiso FROM Usuario_Permiso WHERE idUsuario = ?",
      [idUsuario]
    );
    // Devuelve un array de IDs: [1, 3]
    res.json(permisos.map(p => p.idPermiso)); 
  } catch (error) {
    console.error("Error al cargar permisos del usuario:", error);
    res.status(500).json({ error: "Error al cargar permisos del usuario" });
  }
});

/**
 * 🔹 PUT /api/gerente/permisos/ejecutivo/:idUsuario
 * Actualiza la lista completa de permisos para un Ejecutivo específico.
 * Recibe: { permisos: [1, 3, 4] }
 * ¡MODIFICADO!
 */
router.put("/permisos/ejecutivo/:idUsuario", async (req, res) => {
  const { idUsuario } = req.params;
  const { permisos } = req.body; // Array de idPermiso
  let connection;

  if (!Array.isArray(permisos)) {
    return res.status(400).json({ error: "El body debe ser un array de IDs de permisos." });
  }

  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // 1. Borrar todos los permisos actuales del usuario
    await connection.query("DELETE FROM Usuario_Permiso WHERE idUsuario = ?", [idUsuario]);

    // 2. Insertar los nuevos permisos (si hay alguno)
    if (permisos.length > 0) {
      const values = permisos.map(idPermiso => [idUsuario, idPermiso]);
      await connection.query(
        "INSERT INTO Usuario_Permiso (idUsuario, idPermiso) VALUES ?",
        [values]
      );
    }

    await connection.commit();
    connection.release();
    res.json({ message: "Permisos del ejecutivo actualizados" });

  } catch (error) {
    if (connection) {
      await connection.rollback();
      connection.release();
    }
    console.error("Error al actualizar permisos:", error);
    res.status(500).json({ error: "Error al actualizar permisos" });
  }
});

export default router;