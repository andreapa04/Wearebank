import express from "express";
import mysql from "mysql2";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

// 🔹 Conexión a la BD
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "andy1234",
  database: "WeAreBank"
});

// 🔹 Verificar conexión
app.get("/", (req, res) => {
  db.query("SELECT 1 + 1 AS result", (err, results) => {
    if (err) {
      console.error("Error al conectar a la BD:", err);
      return res.status(500).send("Error en la conexión a la base de datos");
    }
    res.send("Conexión correcta a la base de datos. Resultado: " + results[0].result);
  });
});

// 🔹 Endpoint de login
app.post("/api/login", (req, res) => {
  const { email, contrasenia } = req.body;

  if (!email || !contrasenia) {
    return res.status(400).json({ error: "Faltan credenciales" });
  }

  db.query(
    "SELECT * FROM usuario WHERE email = ? AND contrasenia = ?",
    [email, contrasenia],
    (err, results) => {
      if (err) {
        console.error("Error en login:", err);
        return res.status(500).json({ error: "Error en servidor" });
      }

      if (results.length > 0) {
        res.json({ user: results[0] });
      } else {
        res.json({ error: "Credenciales inválidas" });
      }
    }
  );
});

// 🔹 Iniciar servidor
app.listen(3000, () => {
  console.log("Servidor corriendo en http://localhost:3000");
});
