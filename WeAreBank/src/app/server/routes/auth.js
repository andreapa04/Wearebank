// server/routes/auth.js
import express from 'express';
import { db } from '../db.js';

const router = express.Router();

router.post('/login', async (req, res) => {
  try {
    const { usuario, contrasena } = req.body;

    if (!usuario || !contrasena) {
      return res.status(400).json({ mensaje: 'Faltan credenciales' });
    }

    const [rows] = await db.query(
      'SELECT * FROM Usuario WHERE email = ? AND contrasena = ?',
      [usuario, contrasena]
    );

    if (rows.length > 0) {
      return res.json({ exito: true, usuario: rows[0] });
    } else {
      return res.status(401).json({ mensaje: 'Usuario o contraseña incorrectos' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error en el servidor' });
  }
});

export default router;
