const mysql = require('mysql2/promise');

// Crear pool de conexiones
const pool = mysql.createPool({
  host: 'localhost',     // Cambia por tu host (ej. AWS RDS, Railway, etc.)
  user: 'root',          // Usuario MySQL
  password: '14151998MHLc*',
  database: 'WeAreBank', // Nombre de tu BD
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = pool;
