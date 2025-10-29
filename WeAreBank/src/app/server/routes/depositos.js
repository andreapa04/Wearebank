import express from "express";
import pool from "../db.js";

const router = express.Router();

router.post("/", async (req, res) => {
  const { idCuentaDestino, monto } = req.body;

  try {
    await pool.query("UPDATE cuenta SET saldo = saldo + ? WHERE idCuenta = ?", [monto, idCuentaDestino]);

    await pool.query(
      "INSERT INTO movimiento (idCuenta, monto, tipoMovimiento) VALUES (?, ?, 'DEPOSITO')",
      [idCuentaDestino, monto]
    );

    const [user] = await pool.query(
      `SELECT email, nombre FROM usuario
       JOIN pertenece ON usuario.idUsuario = pertenece.idUsuario
       WHERE pertenece.idCuenta = ?`,
      [idCuentaDestino]
    );

    res.json({ message: "Depósito exitoso" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al realizar el depósito" });
  }
});

export default router;
