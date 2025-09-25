const db = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET; // ⚠️ Pasa esto a variable de entorno en producción

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    const [rows] = await db.query('SELECT * FROM usuarios WHERE username = ?', [username]);
    if (rows.length === 0) {
      return res.status(401).json({ message: 'Usuario no encontrado' });
    }

    const user = rows[0];

    // Verificar contraseña
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ message: 'Contraseña incorrecta' });
    }

    // Generar token JWT
    const token = jwt.sign(
      { id: user.id, username: user.username, rol: user.rol },
      SECRET,
      { expiresIn: '1h' }
    );

    res.json({ message: 'Login exitoso', token, rol: user.rol });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
