const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(bodyParser.json());

// 🔹 Importar rutas
const clienteRoutes = require('./routes/cliente');
const gerenteRoutes = require('./routes/gerente');
const ejecutivoRoutes = require('./routes/ejecutivo');
const authRoutes = require('./routes/auth');

// 🔹 Usar rutas de la API
app.use('/api/clientes', clienteRoutes);
app.use('/api/gerentes', gerenteRoutes);
app.use('/api/ejecutivos', ejecutivoRoutes);
app.use('/api/auth', authRoutes);

// 🔹 Servir Angular
app.use(express.static(path.join(__dirname, '../dist/wearebank/browser')));

// 🔹 Redirigir cualquier ruta al frontend de Angular
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/wearebank/browser/index.html'));
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
});
