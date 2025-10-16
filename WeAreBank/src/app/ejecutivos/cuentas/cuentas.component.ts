import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; 
// Importa FormsModule si vas a usar formularios (aunque lo omitiremos por ahora)

@Component({
  selector: 'app-cuentas',
  standalone: true,
  imports: [CommonModule], 
  templateUrl: './cuentas.component.html',
  styleUrls: ['./cuentas.component.css']
})
export class CuentasComponent implements OnInit {

  // Datos de la tabla "Consultar Cartera" (Imagen 3)
  cartera: any[] = [
    { id: '001', nombre: 'Juan Pérez López', cuenta: '1234567890', producto: 'Cuenta Ahorro', saldo: 15230.50, estado: 'Activa', ultimoMovimiento: '2025-09-28' },
    { id: '002', nombre: 'María Gómez Torres', cuenta: '2234567891', producto: 'Cuenta Nómina', saldo: 8450.00, estado: 'Activa', ultimoMovimiento: '2025-09-01' },
    { id: '003', nombre: 'Carlos Ruiz Ortega', cuenta: '3234567892', producto: 'Crédito Hipotecario', saldo: 350000.00, estado: 'Activa', ultimoMovimiento: '2025-09-30' },
  ];

  constructor() { }
  ngOnInit(): void { }

  // Métodos para los botones
  agregarCliente() {
    console.log('Navegar o abrir modal para Agregar Cliente');
  }

  abrirPrestamo() {
    console.log('Navegar o abrir formulario para Abrir Préstamo');
  }

  abrirCredito() {
    console.log('Navegar o abrir formulario para Abrir Crédito');
  }
}