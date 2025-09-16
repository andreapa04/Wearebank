import { Component } from '@angular/core';

interface Solicitud {
  plazo: string;
  estado: string;
  montoSolicitado: number;
  fechaSolicitud: string;
}

@Component({
  selector: 'app-prestamos',
  templateUrl: './prestamos.component.html',
  styleUrls: ['./prestamos.component.css']
})
export class PrestamosComponent {
  tipoPrestamo: string = '';
  monto: number = 2000;
  plazo: number = 12;
  ingresosMensuales: number = 20000;

  solicitudes: Solicitud[] = [
    { plazo: '12 Meses', estado: 'Aprobado', montoSolicitado: 800000, fechaSolicitud: '12/04/2020' },
    { plazo: '6 Meses', estado: 'Rechazado', montoSolicitado: 50000, fechaSolicitud: '12/04/2019' }
  ];

  solicitarPrestamo() {
    alert('Solicitud de préstamo enviada');
  }
}