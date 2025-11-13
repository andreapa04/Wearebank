import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

interface Ejecutivo {
  idUsuario: number;
  nombre: string;
  apellidoP: string;
  apellidoM: string;
  email: string;
  estatus: string;
}

@Component({
  selector: 'app-gerente-home',
  standalone: true,
  imports: [CommonModule, HttpClientModule, FormsModule],
  templateUrl: './gerente-home.component.html',
  styleUrl: './gerente-home.component.css' // 🔽 Asegúrate de referenciar el CSS
})
export class GerenteHomeComponent implements OnInit {
  
  ejecutivos: Ejecutivo[] = [];
  mensaje: string = '';
  error: string = '';
  
  // 🔽 Formulario para nuevo ejecutivo (AHORA COMPLETO)
  formEjecutivo = {
    nombre: '',
    apellidoP: '',
    apellidoM: '',
    fechaNacimiento: '',
    CURP: '',
    RFC: '',
    INE: '',
    direccion: '',
    telefono: '',
    email: '',
    contrasenia: '',
    preguntaSeguridad: '¿Cuál es tu comida favorita?',
    respuestaSeguridad: ''
  };

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.cargarEjecutivos();
  }

  cargarEjecutivos(): void {
    this.http.get<Ejecutivo[]>('http://localhost:3000/api/gerente/ejecutivos')
      .subscribe({
        next: (data) => this.ejecutivos = data,
        error: (err) => this.error = 'Error al cargar ejecutivos'
      });
  }

  agregarEjecutivo(): void {
    this.limpiarMensajes();

    // Validación simple de campos clave
    if (!this.formEjecutivo.email || !this.formEjecutivo.contrasenia || !this.formEjecutivo.nombre || !this.formEjecutivo.CURP || !this.formEjecutivo.RFC) {
      this.error = 'Faltan campos obligatorios (Nombre, Email, Contraseña, CURP, RFC).';
      return;
    }

    // 🔽 Enviar el formulario completo
    this.http.post('http://localhost:3000/api/gerente/ejecutivos', this.formEjecutivo)
      .subscribe({
        next: (res: any) => {
          this.mensaje = res.message || 'Ejecutivo creado';
          this.cargarEjecutivos(); // Recargar lista
          // Limpiar formulario
          this.reiniciarFormulario();
        },
        error: (err) => this.error = err.error?.error || 'Error al crear ejecutivo'
      });
  }

  eliminarEjecutivo(idUsuario: number): void {
    this.limpiarMensajes();
    if (!confirm('¿Estás seguro de que deseas DESACTIVAR a este ejecutivo?')) {
      return;
    }

    this.http.delete(`http://localhost:3000/api/gerente/ejecutivos/${idUsuario}`)
      .subscribe({
        next: (res: any) => {
          this.mensaje = res.message || 'Ejecutivo desactivado';
          this.cargarEjecutivos(); // Recargar lista
        },
        error: (err) => this.error = err.error?.error || 'Error al desactivar ejecutivo'
      });
  }

  reiniciarFormulario(): void {
    this.formEjecutivo = {
      nombre: '', apellidoP: '', apellidoM: '', fechaNacimiento: '',
      CURP: '', RFC: '', INE: '', direccion: '', telefono: '',
      email: '', contrasenia: '', preguntaSeguridad: '¿Cuál es tu comida favorita?',
      respuestaSeguridad: ''
    };
  }

  limpiarMensajes(): void {
    this.mensaje = '';
    this.error = '';
  }
}