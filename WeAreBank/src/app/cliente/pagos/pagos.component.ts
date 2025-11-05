import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { safeLocalStorage } from '../../utils/storage.util';

interface Cuenta {
  idCuenta: number;
  clabe: string;
  tipoCuenta: string;
  saldo: number;
}

interface Servicio {
  idServicio?: number;
  nombre: string;
  referencia: string;
  ultimoPago: number;
}

@Component({
  selector: 'app-pagos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './pagos.component.html',
  styleUrls: ['./pagos.component.css']
})
export class PagosComponent implements OnInit {
  cuentas: Cuenta[] = [];
  idCuentaSeleccionada: number | null = null;
  montoPago: number = 0;
  referencia: string = '';
  mensaje = '';

  servicios: Servicio[] = [
    { nombre: 'Agua', referencia: '111-222-333', ultimoPago: 180 },
    { nombre: 'Luz', referencia: '132-567-432', ultimoPago: 250 },
    { nombre: 'Internet', referencia: '111-222-444', ultimoPago: 300 },
    { nombre: 'Gas', referencia: '121-322-333', ultimoPago: 120 }
  ];

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    const usuario = JSON.parse(safeLocalStorage().getItem('usuario') || 'null');

    if (!usuario || !usuario.id) {
      console.error('⚠️ No se encontró usuario en sesión');
      return;
    }

    // 🔹 Cargar las cuentas del usuario logueado
    this.http.get<Cuenta[]>(`http://localhost:3000/api/consultas/mis-cuentas/${usuario.id}`)
      .subscribe({
        next: (data) => (this.cuentas = data),
        error: (err) => console.error('❌ Error al cargar cuentas:', err)
      });
  }

  pagarServicio(servicio: Servicio): void {
    this.referencia = servicio.referencia;
    this.montoPago = servicio.ultimoPago;
  }

  realizarPago(): void {
    if (!this.idCuentaSeleccionada || this.montoPago <= 0) {
      this.mensaje = '⚠️ Selecciona una cuenta y un monto válido.';
      return;
    }

    const pagoData = {
      idCuenta: this.idCuentaSeleccionada,
      monto: this.montoPago,
      referencia: this.referencia || 'Pago de servicio'
    };

    this.http.post('http://localhost:3000/api/pagos', pagoData).subscribe({
      next: (res: any) => {
        this.mensaje = res.message || '✅ Pago realizado con éxito.';
        // Actualizar saldos
        this.ngOnInit();
      },
      error: (err) => {
        console.error('❌ Error al realizar el pago:', err);
        this.mensaje = '❌ Error al realizar el pago.';
      }
    });
  }
}
