import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms'; // 🔽 Importar FormsModule

// 🔽 --- INTERFAZ PARA SOLICITUD DE PRÉSTAMO --- 🔽
interface SolicitudPrestamo {
  idSolicitud: number;
  idCuenta: number;
  estado: string;
  montoTotal: number;
  plazo: string;
  intereses: number;
  cat: number;
  tipo: string;
  fechaSolicitud: string;
  // Campos unidos (joined)
  nombre: string;
  apellidoP: string;
  email: string;
  puntaje: number;
}

// 🔽 --- NUEVA INTERFAZ PARA SOLICITUD DE CIERRE --- 🔽
interface SolicitudCierre {
  idSolicitudCierre: number;
  fechaSolicitud: string;
  idUsuario: number;
  nombre: string;
  apellidoP: string;
  email: string;
  razon_rechazo?: string; // Para el campo de texto
}

@Component({
  selector: 'app-ejecutivos-solicitudes',
  standalone: true,
  imports: [CommonModule, HttpClientModule, FormsModule], // 🔽 Añadir FormsModule
  templateUrl: './ejecutivos-solicitudes.component.html',
  styleUrls: ['./ejecutivos-solicitudes.component.css']
})
export class EjecutivosSolicitudesComponent implements OnInit {

  solicitudesPrestamo: SolicitudPrestamo[] = [];
  historialSolicitudes: SolicitudPrestamo[] = [];
  
  // 🔽 --- NUEVAS PROPIEDADES --- 🔽
  solicitudesCierre: SolicitudCierre[] = [];
  vistaActual: 'prestamos' | 'cierre' = 'prestamos'; // Para alternar vistas
  mensaje: string = '';
  // 🔼 -------------------------- 🔼

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.cargarSolicitudesPrestamo();
    this.cargarHistorialSolicitudes();
    this.cargarSolicitudesCierre(); // 🔽 Cargar nuevas solicitudes
  }

  cambiarVista(vista: 'prestamos' | 'cierre') {
    this.vistaActual = vista;
    this.mensaje = '';
  }

  cargarSolicitudesPrestamo(): void {
    this.http.get<any>('http://localhost:3000/api/ejecutivo/solicitudes-prestamo')
      .subscribe({
        next: (data: any) => {
          this.solicitudesPrestamo = data.pendientes;
        },
        error: (err: any) => {
          this.mensaje = 'Error al cargar solicitudes de préstamo';
          console.error(err);
        }
      });
  }

  cargarHistorialSolicitudes(): void {
    this.http.get<any>('http://localhost:3000/api/ejecutivo/solicitudes-prestamo')
      .subscribe({
        next: (data: any) => {
          this.historialSolicitudes = data.historial;
        },
        error: (err: any) => {
          this.mensaje = 'Error al cargar historial de solicitudes';
          console.error(err);
        }
      });
  }

  procesarPrestamo(idSolicitud: number, aprobado: boolean): void {
    this.mensaje = 'Procesando...';
    this.http.post('http://localhost:3000/api/ejecutivo/procesar-prestamo', { idSolicitud, aprobado })
      .subscribe({
        next: (res: any) => {
          this.mensaje = res.message;
          this.cargarSolicitudesPrestamo(); // Recargar pendientes
          this.cargarHistorialSolicitudes(); // Recargar historial
        },
        error: (err: any) => {
          this.mensaje = err.error?.message || 'Error al procesar la solicitud.';
          console.error(err);
        }
      });
  }

  // 🔽 --- NUEVAS FUNCIONES --- 🔽
  
  cargarSolicitudesCierre(): void {
    this.http.get<SolicitudCierre[]>('http://localhost:3000/api/ejecutivo/solicitudes-cierre')
      .subscribe({
        next: (data: any) => this.solicitudesCierre = data,
        error: (err: any) => {
          this.mensaje = 'Error al cargar solicitudes de cierre';
          console.error(err);
        }
      });
  }

  procesarCierre(solicitud: SolicitudCierre, aprobado: boolean): void {
    this.mensaje = 'Procesando...';

    const payload: any = {
      idSolicitudCierre: solicitud.idSolicitudCierre,
      aprobado: aprobado
    };

    if (!aprobado && !solicitud.razon_rechazo) {
      this.mensaje = 'Por favor, escribe una razón para rechazar la solicitud.';
      return;
    }

    if (!aprobado) {
      payload.razon_rechazo = solicitud.razon_rechazo;
    }

    this.http.post('http://localhost:3000/api/ejecutivo/procesar-cierre', payload)
      .subscribe({
        next: (res: any) => {
          this.mensaje = res.message;
          // Recargar lista de cierres
          this.cargarSolicitudesCierre();
        },
        error: (err: any) => {
          this.mensaje = err.error?.message || 'Error al procesar la solicitud.';
          console.error(err);
        }
      });
  }
}