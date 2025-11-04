import nodemailer from "nodemailer";

// Configuración de Gmail
export async function enviarCorreoMovimiento(destinatario, tipo, monto, clabe) {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "andreaperezare@gmail.com",       // reemplaza con tu correo
        pass: "iptc rvln sbqk qcge",           // contraseña de app de Gmail
      },
    });

    const info = await transporter.sendMail({
      from: '"WeAreBank" <>',
      to: destinatario,
      subject: `Movimiento: ${tipo}`,
      text: `Tu cuenta ${clabe} ha realizado un movimiento de tipo ${tipo} por $${monto.toFixed(
        2
      )}.`,
    });

    console.log("Correo enviado:", info.messageId);
  } catch (err) {
    console.error("Error al enviar correo:", err.message);
  }
}
