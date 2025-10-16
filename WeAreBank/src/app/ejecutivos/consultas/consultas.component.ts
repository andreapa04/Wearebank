import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; 
import { FormsModule } from '@angular/forms'; // Necesario para el input de búsqueda

@Component({
  selector: 'app-consultas',
  standalone: true,
  // Incluimos FormsModule para la búsqueda bidireccional si se desea
  imports: [CommonModule, FormsModule], 
  templateUrl: './consultas.component.html',
  styleUrls: ['./consultas.component.css']
})
export class ConsultasComponent implements OnInit {

  searchQueryClientes: string = '';
  searchQueryMovimientos: string = '';

  // Datos para la tabla "Consulta de Clientes" (Clientes)
  clientes: any[] = [
    { id: '001', nombre: 'Juan', apellido: 'Pérez', curp: 'PEXJ900101HDF', rfc: 'PEXJ900101', direccion: 'Calle Falsa 123, CDMX', telefono: '555-123-4567', correo: 'mailito.juan.perez@mail.com', estado: 'Activo', ejecutivo: 'Ana López' },
    { id: '002', nombre: 'María', apellido: 'Gómez', curp: 'GOMM850505MDF', rfc: 'GOMM850505', direccion: 'Av. Reforma 456, CDMX', telefono: '555-234-5678', correo: 'mailito.maria.gomez@mail.com', estado: 'Activo', ejecutivo: 'Juan Torres' },
    { id: '003', nombre: 'Carlos', apellido: 'Ramírez', curp: 'RAMC920303HDF', rfc: 'RAMC920303', direccion: 'Calle Luna 78, Pachuca', telefono: '771-345-6789', correo: 'mailito.carlos.ramiro@mail.com', estado: 'Inactivo', ejecutivo: 'Ana López' },
    { id: '004', nombre: 'Laura', apellido: 'Fernández', curp: 'FELR980707MDF', rfc: 'FELR980707', direccion: 'Blvd. Hidalgo 12, Tizayuca', telefono: '771-456-7890', correo: 'mailito.laura.fernandez@mail.com', estado: 'Activo', ejecutivo: 'Juan Torres' },
  ];

  // Datos para la tabla "Consultar Movimientos" (Movimientos)
  movimientos: any[] = [
    { id: '001', fecha: '01/09/2025', cuenta: '8148498', cliente: 'Juan Pérez', tipo: 'Depósito', monto: 5000, saldoDespues: 15000, ejecutivo: 'Ana López', comentarios: 'Depósito en ventanilla' },
    { id: '002', fecha: '00/09/2025', cuenta: '8485129', cliente: 'Juan Pérez', tipo: 'Retiro', monto: 2000, saldoDespues: 13000, ejecutivo: 'Ana López', comentarios: 'Cajero automático' },
    { id: '003', fecha: '03/09/2025', cuenta: '5198991', cliente: 'María Gómez', tipo: 'Pago préstamo', monto: 1500, saldoDespues: 8000, ejecutivo: 'Juan Torres', comentarios: 'Pago mensual' },
    { id: '004', fecha: '04/09/2025', cuenta: '454525', cliente: 'Juan Pérez', tipo: 'Transferencia', monto: 3000, saldoDespues: 10000, ejecutivo: 'Ana López', comentarios: 'Transferencia a cuenta 67890' },
  ];

  constructor() { }
  ngOnInit(): void { }

  // Función para determinar el estilo de los estados
  getStatusClass(estado: string): string {
    return estado === 'Activo' ? 'status-aprobado' : estado === 'Inactivo' ? 'status-rechazado' : '';
  }
}