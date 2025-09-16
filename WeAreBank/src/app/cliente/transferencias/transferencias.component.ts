import { Component } from '@angular/core';

@Component({
  selector: 'app-transferencias',
  templateUrl: './transferencias.component.html',
  styleUrls: ['./transferencias.component.css']
})
export class TransferenciasComponent {
  monto: number = 2000;
  beneficiario: string = 'Beneficiario';
  concepto: string = 'Concepto';
  cuentaOrigen: string = '';
  cuentaDestino: string = '';

  transferir() {
    alert(`Transferencia de $${this.monto} realizada con éxito`);
  }

  guardarBeneficiario() {
    alert('Beneficiario guardado correctamente');
  }

  cancelar() {
    alert('Operación cancelada');
  }
}