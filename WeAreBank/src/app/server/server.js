// server.js
import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.js"; // 🔹 importa el router de login

const app = express();
app.use(cors());
app.use(express.json());

// 🔹 Montar rutas de autenticación
app.use("/api/auth", authRoutes);

// 🔹 Endpoint de prueba (verificar servidor corriendo)
app.get("/", (req, res) => {
  res.send("Servidor corriendo correctamente 🚀");
});

// 🔹 Iniciar servidor
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
