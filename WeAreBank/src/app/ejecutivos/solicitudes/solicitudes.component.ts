import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; 
import { RouterLink } from '@angular/router'; // Necesario para los enlaces de acción

@Component({
  selector: 'app-solicitudes',
  standalone: true,
  // Incluimos RouterLink para las acciones "Revisar", "Aprobar", etc.
  imports: [CommonModule, RouterLink], 
  templateUrl: './solicitudes.component.html',
  styleUrls: ['./solicitudes.component.css']
})
export class SolicitudesComponent implements OnInit {

  // Datos para Solicitudes de Apertura de Cuentas
  aperturaCuentas: any[] = [
    { id: 'AC-124', cliente: 'Luis Hernández', documento: 'HERL890123XXX', fecha: '05/08/2025', estado: 'Expedient' }
  ];

  // Datos para Solicitudes de Préstamo
  prestamos: any[] = [
    { id: 'PR-457', cliente: 'Carmen Díaz', monto: 150000, plazo: '36 meses', tasa: '12%', fecha: '06/08/2025', estado: 'En revisión' }
  ];

  // Datos para Solicitudes de Cierre de Cuenta
  cierreCuentas: any[] = [
    { id: 'CC-269', cliente: 'Andrea Torres', numeroCuenta: '1456879321', saldoActual: 0.00, fecha: '03/08/2025', estado: 'Expedient' }
  ];

  // Datos para Historial de Solicitudes (Imagen inferior)
  historial: any[] = [
    { id: 'PR-410', tipo: 'Préstamo', cliente: 'Mario López', fecha: '15/08/2025', estadoFinal: 'Aprobado' },
    { id: 'AC-999', tipo: 'Apertura Cuenta', cliente: 'Paula Ruiz', fecha: '12/08/2025', estadoFinal: 'Rechazado' }
  ];

  constructor() { }
  ngOnInit(): void { }

  // Función para asignar la clase de estilo basada en el estado
  getStatusClass(estado: string): string {
    switch (estado) {
      case 'Aprobado':
      case 'Activa':
        return 'status-aprobado';
      case 'Rechazado':
        return 'status-rechazado';
      case 'En revisión':
      case 'Expedient':
      default:
        return 'status-pendiente';
    }
  }
}