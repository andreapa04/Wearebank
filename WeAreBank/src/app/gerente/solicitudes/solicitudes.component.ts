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
  selector: 'app-solicitudes',
  standalone: true,
  // 2. Importar NgModules
  imports: [CommonModule, HttpClientModule],
  templateUrl: './solicitudes.component.html',
  styleUrl: './solicitudes.component.css'
})
export class SolicitudesComponent implements OnInit {
  vista: 'PENDIENTES' | 'HISTORIAL' = 'PENDIENTES';
  solicitudesPendientes: Solicitud[] = [];
  solicitudesHistorial: Solicitud[] = [];
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
        next: data => this.solicitudesPendientes = data,
        // 4. Tipar error
        error: (err: any) => console.error('Error al cargar pendientes', err)
      });
  }

  cargarHistorial(): void {
    // 🔽 USA EL ENDPOINT DE EJECUTIVO
    this.http.get<Solicitud[]>('http://localhost:3000/api/ejecutivo/solicitudes/HISTORIAL')
      .subscribe({
        next: data => this.solicitudesHistorial = data,
        // 5. Tipar error
        error: (err: any) => console.error('Error al cargar historial', err)
      });
  }

  procesarSolicitud(idSolicitud: number, aprobar: boolean): void {
    this.mensaje = 'Procesando...';
    // 🔽 USA EL ENDPOINT DE EJECUTIVO
    this.http.post(`http://localhost:3000/api/ejecutivo/procesar-solicitud/${idSolicitud}`, { aprobar })
      .subscribe({
        // 6. Tipar respuesta
        next: (res: any) => {
          this.mensaje = res.message;
          this.cargarPendientes(); // Recargar ambas listas
          this.cargarHistorial();
        },
        // 7. Tipar error
        error: (err: any) => {
          this.mensaje = err.error?.error || 'Error al procesar la solicitud.';
        }
      });
  }
}