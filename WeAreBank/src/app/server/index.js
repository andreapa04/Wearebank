// server/index.js
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import authRoutes from './routes/auth.js';

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());

// Rutas
app.use('/api/auth', authRoutes);

app.listen(PORT, () => {
  console.log(`Servidor backend corriendo en http://localhost:${PORT}`);
});
