import { Component } from '@angular/core';

interface Servicio {
  nombre: string;
  referencia: string;
  ultimoPago: number;
}

@Component({
  selector: 'app-pagos',
  templateUrl: './pagos.component.html',
  styleUrls: ['./pagos.component.css']
})
export class PagosComponent {
  montoPago: number = 2000;
  cuentaOrigen: string = '';
  cuentaDestino: string = '';

  servicios: Servicio[] = [
    { nombre: 'Agua', referencia: '111-222-333', ultimoPago: 180 },
    { nombre: 'Luz', referencia: '132-567-432', ultimoPago: 250 },
    { nombre: 'Internet', referencia: '111-222-444', ultimoPago: 300 },
    { nombre: 'Gas', referencia: '121-322-333', ultimoPago: 120 }
  ];

  realizarPago() {
    alert(`Pago de $${this.montoPago} realizado con éxito`);
  }

  pagarServicio(servicio: Servicio) {
    alert(`Pagando servicio: ${servicio.nombre}`);
  }

  agregarServicio() {
    alert('Agregar nuevo servicio');
  }
}