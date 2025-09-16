import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-retiros',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './retiros.component.html',
  styleUrls: ['./retiros.component.css']
})
export class RetirosComponent {
  montoSeleccionado: number | null = null;
  montoOtro: number | null = null;
  retiroSinTarjeta = true;
  transferenciaCuenta = false;

  seleccionarMonto(monto: number) {
    this.montoSeleccionado = monto;
    this.montoOtro = null;
  }

  retirar() {
    const monto = this.montoOtro ? this.montoOtro : this.montoSeleccionado;
    alert(`Retiro realizado por $${monto}`);
  }
}
