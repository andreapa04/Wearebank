import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import * as bcrypt from 'bcryptjs';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  nombre: string = '';
  apellidoP: string = '';
  apellidoM: string = '';
  fechaNacimiento: string = '';
  CURP: string = '';
  RFC: string = '';
  INE: string = '';
  direccion: string = '';
  telefono: string = '';
  email: string = '';
  contrasenia: string = '';

  calleNumero: string = '';
  colonia: string = '';
  ciudad: string = '';
  estado: string = '';
  codigoPostal: string = '';

  constructor(private router: Router, private http: HttpClient) {}

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.INE = input.files[0].name;
    } else {
      this.INE = '';
    }
  }

  async enviarSolicitud() {
    // Validación básica
    if (!this.nombre || !this.email || !this.contrasenia) {
      alert("Por favor completa todos los campos obligatorios.");
      return;
    }

    // Construimos la dirección concatenada
    this.direccion = `${this.calleNumero}, ${this.colonia}, ${this.ciudad}, ${this.estado}, CP ${this.codigoPostal}`;

    // 🔒 Hasheamos la contraseña antes de enviar
    const saltRounds = 10;
    const hash = await bcrypt.hash(this.contrasenia, saltRounds);

    // Creamos el objeto para enviar al backend
    const datosRegistro = {
      nombre: this.nombre,
      apellidoP: this.apellidoP,
      apellidoM: this.apellidoM,
      direccion: this.direccion,
      telefono: this.telefono,
      email: this.email,
      contrasenia: hash, // ✅ Se envía el hash, no la contraseña en texto plano
      fechaNacimiento: this.fechaNacimiento,
      CURP: this.CURP,
      RFC: this.RFC,
      INE: this.INE
    };

    console.log("Enviando datos de registro (con hash):", datosRegistro);

    this.http.post('http://localhost:3000/api/auth/register', datosRegistro)
      .subscribe({
        next: (res: any) => {
          console.log("Respuesta del servidor:", res);
          alert(res.message || "Registro exitoso. Serás redirigido al login.");
          this.router.navigate(['/login']);
        },
        error: (err) => {
          console.error("Error en registro:", err);
          const mensaje = err.error?.message || "Error al registrar el usuario. Verifica los datos.";
          alert(mensaje);
        }
      });
  }
}
