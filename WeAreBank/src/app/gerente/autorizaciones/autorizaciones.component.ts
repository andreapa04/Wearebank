import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
// 1. Importar HttpClientModule (el Módulo)
import { HttpClient, HttpClientModule } from '@angular/common/http';

interface Solicitud {
  idSolicitud: number;
  tipo: string;
  montoTotal: number;
  plazo: string;
  estado: string;
  fechaSolicitud: string;
  idUsuario: number;
  nombre: string;
  apellidoP: string;
  apellidoM: string;
  CURP: string;
  email: string;
  puntaje: number;
  fechaConsulta: string;
}

@Component({
  selector: 'app-autorizaciones',
  standalone: true,
  // 2. Importar NgModules
  imports: [CommonModule, HttpClientModule],
  templateUrl: './autorizaciones.component.html',
  styleUrl: './autorizaciones.component.css'
})
export class AutorizacionesComponent implements OnInit {
  // 🔽 Renombramos las variables para que coincidan con "Autorizaciones"
  vista: 'PENDIENTES' | 'HISTORIAL' = 'PENDIENTES';
  autorizacionesPendientes: Solicitud[] = [];
  autorizacionesHistorial: Solicitud[] = [];
  mensaje: string = '';

  // 3. Inyectar HttpClient (el Servicio)
  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.cargarPendientes();
    this.cargarHistorial();
  }

  cargarPendientes(): void {
    // 🔽 USA EL ENDPOINT DE EJECUTIVO
    this.http.get<Solicitud[]>('http://localhost:3000/api/ejecutivo/solicitudes/PENDIENTES')
      .subscribe({
        next: data => this.autorizacionesPendientes = data,
        error: (err: any) => console.error('Error al cargar pendientes', err)
      });
  }

  cargarHistorial(): void {
    // 🔽 USA EL ENDPOINT DE EJECUTIVO
    this.http.get<Solicitud[]>('http://localhost:3000/api/ejecutivo/solicitudes/HISTORIAL')
      .subscribe({
        next: data => this.autorizacionesHistorial = data,
        error: (err: any) => console.error('Error al cargar historial', err)
      });
  }

  procesarSolicitud(idSolicitud: number, aprobar: boolean): void {
    this.mensaje = 'Procesando...';
    // 🔽 USA EL ENDPOINT DE EJECUTIVO
    this.http.post(`http://localhost:3000/api/ejecutivo/procesar-solicitud/${idSolicitud}`, { aprobar })
      .subscribe({
        next: (res: any) => {
          this.mensaje = res.message;
          this.cargarPendientes(); // Recargar ambas listas
          this.cargarHistorial();
        },
        error: (err: any) => {
          this.mensaje = err.error?.error || 'Error al procesar la solicitud.';
        }
      });
  }
}