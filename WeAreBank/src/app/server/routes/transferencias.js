import express from "express";
import pool from "../db.js";

const router = express.Router();

/** --- Obtener cuentas del usuario --- **/
router.get("/mis-cuentas/:idUsuario", async (req, res) => {
  try {
    const { idUsuario } = req.params;
    const [rows] = await pool.query(
      `SELECT c.idCuenta, c.clabe, c.saldo, c.tipoCuenta
       FROM cuenta c
       JOIN pertenece p ON p.idCuenta = c.idCuenta
       WHERE p.idUsuario = ?`,
      [idUsuario]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener cuentas" });
  }
});

/** --- TRANSFERENCIA INTERNA/EXTERNA --- **/
router.post("/", async (req, res) => {
  try {
    const {
      idCuentaOrigen,
      idCuentaDestino,
      cuentaDestino,
      destinoExterno,
      bancoDestino,
      monto,
      concepto,
      tipo
    } = req.body;

    if (!idCuentaOrigen || !monto) {
      return res.status(400).json({ error: "Datos incompletos" });
    }

    const comision = parseFloat((monto * 0.07).toFixed(2));
    const total = monto + comision;

    let destinoID = null;
    let destinoExt = null;

    if (tipo === "INTERNA") {
      const destino = idCuentaDestino || cuentaDestino;
      const [dest] = await pool.query(
        "SELECT idCuenta FROM cuenta WHERE clabe = ? OR idCuenta = ?",
        [destino, destino]
      );
      if (!dest.length) throw new Error("Cuenta interna no encontrada");
      destinoID = dest[0].idCuenta;

      // transferencia interna
      await pool.query("CALL sp_transferencia_interna(?, ?, ?, ?)", [
        idCuentaOrigen,
        destinoID,
        monto,
        concepto,
      ]);
    } else {
      destinoExt = destinoExterno || cuentaDestino;
      // transferencia externa
      await pool.query("CALL sp_transferencia_externa(?, ?, ?, ?, ?)", [
        idCuentaOrigen,
        destinoExt,
        bancoDestino,
        monto,
        concepto,
      ]);
    }

    // registrar movimientos
    await pool.query(
      "INSERT INTO movimiento (idCuenta, monto, tipoMovimiento) VALUES (?, ?, 'TRANSFERENCIA_ENVIADA')",
      [idCuentaOrigen, total]
    );

    if (tipo === "INTERNA" && destinoID) {
      await pool.query(
        "INSERT INTO movimiento (idCuenta, monto, tipoMovimiento) VALUES (?, ?, 'TRANSFERENCIA_RECIBIDA')",
        [destinoID, monto]
      );
    }

    res.json({ message: "Transferencia completada exitosamente" });
  } catch (err) {
    console.error("Error transferencia:", err.message);
    res.status(400).json({ error: err.message });
  }
});

/** --- DEPÓSITO --- **/
router.post("/deposito", async (req, res) => {
  try {
    const { cuentaDestino, monto, concepto } = req.body;
    if (!cuentaDestino || !monto)
      return res.status(400).json({ error: "Datos incompletos" });

    const [dest] = await pool.query(
      "SELECT idCuenta FROM cuenta WHERE clabe=? OR idCuenta=?",
      [cuentaDestino, cuentaDestino]
    );
    if (!dest.length) throw new Error("Cuenta destino no encontrada");

    const idCuenta = dest[0].idCuenta;

    await pool.query("CALL sp_deposito(?, ?, ?)", [idCuenta, monto, concepto]);
    await pool.query(
      "INSERT INTO movimiento (idCuenta, monto, tipoMovimiento) VALUES (?, ?, 'DEPOSITO')",
      [idCuenta, monto]
    );

    res.json({ message: "Depósito realizado exitosamente" });
  } catch (err) {
    console.error("Error depósito:", err.message);
    res.status(400).json({ error: err.message });
  }
});

export default router;
