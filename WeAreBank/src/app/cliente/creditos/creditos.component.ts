import { Component } from '@angular/core';

interface SolicitudCredito {
  plazo: string;
  estado: string;
  montoSolicitado: number;
  fechaSolicitud: string;
}

@Component({
  selector: 'app-creditos',
  templateUrl: './creditos.component.html',
  styleUrls: ['./creditos.component.css']
})
export class CreditosComponent {
  tipoCredito: string = '';
  monto: number = 2000;
  plazo: number = 12;
  ingresosMensuales: number = 20000;

  solicitudes: SolicitudCredito[] = [
    { plazo: '12 Meses', estado: 'Aprobado', montoSolicitado: 800000, fechaSolicitud: '12/04/2020' },
    { plazo: '6 Meses', estado: 'Rechazado', montoSolicitado: 50000, fechaSolicitud: '12/04/2019' }
  ];

  solicitarCredito() {
    alert('Solicitud de crédito enviada');
  }
}