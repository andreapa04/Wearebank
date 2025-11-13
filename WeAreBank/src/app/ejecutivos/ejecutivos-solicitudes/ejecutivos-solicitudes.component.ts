import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-ejecutivos-solicitudes',
  standalone: true,
  imports: [CommonModule, HttpClientModule], // ✅ aquí se arregla el warning
  templateUrl: './ejecutivos-solicitudes.component.html',
  styleUrls: ['./ejecutivos-solicitudes.component.css']
})
export class EjecutivosSolicitudesComponent implements OnInit {
  pendientes: any[] = [];
  historial: any[] = [];
  apiUrl = 'http://localhost:3000/api/ejecutivo';

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.cargarSolicitudes();
  }

  cargarSolicitudes() {
    this.http.get<any>(`${this.apiUrl}/solicitudes-prestamo`).subscribe({
      next: (data) => {
        this.pendientes = Array.isArray(data.pendientes) ? data.pendientes : [];
        this.historial = Array.isArray(data.historial) ? data.historial : [];
      },
      error: (err) => {
        console.error('Error al cargar solicitudes:', err);
      }
    });
  }

  procesarSolicitud(idSolicitud: number, aprobado: boolean) {
    const body = { idSolicitud, aprobado };
    this.http.post(`${this.apiUrl}/procesar-prestamo`, body).subscribe({
      next: () => this.cargarSolicitudes(),
      error: (err) => console.error('Error al procesar solicitud:', err)
    });
  }
}
