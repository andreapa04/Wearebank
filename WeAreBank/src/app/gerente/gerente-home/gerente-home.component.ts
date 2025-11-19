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
  styleUrl: './gerente-home.component.css'
})
export class GerenteHomeComponent implements OnInit {
  
  ejecutivos: Ejecutivo[] = [];
  solicitudesCierre: any[] = []; // Lista para solicitudes de cierre
  
  mensaje: string = '';
  error: string = '';
  
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
    this.cargarSolicitudesCierre(); // Cargar también los cierres
  }

  cargarEjecutivos(): void {
    this.http.get<Ejecutivo[]>('http://localhost:3000/api/gerente/ejecutivos')
      .subscribe({
        next: (data) => this.ejecutivos = data,
        error: (err) => this.error = 'Error al cargar ejecutivos'
      });
  }

  cargarSolicitudesCierre(): void {
    // Reutilizamos el endpoint del ejecutivo para no duplicar backend innecesariamente
    this.http.get<any[]>('http://localhost:3000/api/ejecutivo/solicitudes-cierre')
      .subscribe({
        next: (data) => this.solicitudesCierre = data,
        error: (err) => console.error('Error al cargar solicitudes de cierre', err)
      });
  }

  procesarCierre(idSolicitudCierre: number, aprobado: boolean): void {
    let razon = '';
    if (!aprobado) {
      razon = prompt("Por favor, ingrese el motivo del rechazo:") || 'Sin razón especificada';
    }

    const body = { idSolicitudCierre, aprobado, razon_rechazo: razon };
    
    this.http.post('http://localhost:3000/api/ejecutivo/procesar-cierre', body)
      .subscribe({
        next: (res: any) => {
          this.mensaje = res.message;
          this.cargarSolicitudesCierre(); // Recargar lista
          setTimeout(() => this.mensaje = '', 5000);
        },
        error: (err) => {
          this.error = err.error?.message || 'Error al procesar la solicitud.';
          setTimeout(() => this.error = '', 5000);
        }
      });
  }

  agregarEjecutivo(): void {
    this.limpiarMensajes();
    if (!this.formEjecutivo.email || !this.formEjecutivo.contrasenia || !this.formEjecutivo.nombre) {
      this.error = 'Faltan campos obligatorios.';
      return;
    }

    this.http.post('http://localhost:3000/api/gerente/ejecutivos', this.formEjecutivo)
      .subscribe({
        next: (res: any) => {
          this.mensaje = res.message || 'Ejecutivo creado';
          this.cargarEjecutivos();
          this.reiniciarFormulario();
        },
        error: (err) => this.error = err.error?.error || 'Error al crear ejecutivo'
      });
  }

  eliminarEjecutivo(idUsuario: number): void {
    this.limpiarMensajes();
    if (!confirm('¿Estás seguro de que deseas DESACTIVAR a este ejecutivo?')) return;

    this.http.delete(`http://localhost:3000/api/gerente/ejecutivos/${idUsuario}`)
      .subscribe({
        next: (res: any) => {
          this.mensaje = res.message;
          this.cargarEjecutivos();
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