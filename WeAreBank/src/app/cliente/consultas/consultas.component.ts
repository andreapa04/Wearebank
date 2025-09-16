import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-consultas',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './consultas.component.html',
  styleUrls: ['./consultas.component.css']
})
export class ConsultasComponent {
  cuentas = [
    { numero: '1234-5678-9012-3456', tipo: 'Corriente', saldo: 18000 },
    { numero: '1672-3781-8927-1029', tipo: 'Nómina', saldo: 5000 },
    { numero: '1782-1094-2452-1245', tipo: 'Ahorro', saldo: 3000 },
    { numero: '2981-3410-3400-2391', tipo: 'Cheques', saldo: 12000 }
  ];

  movimientos: any[] = []; // Se podría llenar dinámicamente
}
