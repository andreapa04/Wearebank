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

@Component({
  selector: 'app-retiros',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './retiros.component.html',
  styleUrls: ['./retiros.component.css']
})
export class RetirosComponent implements OnInit {
  cuentas: Cuenta[] = [];
  idCuentaSeleccionada: number | null = null;
  montoSeleccionado: number | null = null;
  montoOtro: number | null = null;
  retiroSinTarjeta = true;
  mensaje = '';

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    const usuario = JSON.parse(safeLocalStorage().getItem('usuario') || 'null');

    if (!usuario || !usuario.id) {
      console.error('⚠️ No se encontró el usuario en sesión.');
      return;
    }

    // 🔹 Cargar las cuentas disponibles del usuario
    this.http
      .get<Cuenta[]>(`http://localhost:3000/api/consultas/mis-cuentas/${usuario.id}`)
      .subscribe({
        next: (data) => (this.cuentas = data),
        error: (err) => console.error('❌ Error al cargar cuentas:', err)
      });
  }

  seleccionarMonto(monto: number): void {
    this.montoSeleccionado = monto;
    this.montoOtro = null;
  }

  retirar(): void {
    const monto = this.montoOtro ? this.montoOtro : this.montoSeleccionado;

    if (!this.idCuentaSeleccionada || !monto || monto <= 0) {
      this.mensaje = '⚠️ Selecciona una cuenta y un monto válido.';
      return;
    }

    const retiroData = {
      idCuenta: this.idCuentaSeleccionada,
      monto,
      retiroSinTarjeta: this.retiroSinTarjeta
    };

    this.http.post('http://localhost:3000/api/retiros', retiroData).subscribe({
      next: (res: any) => {
        this.mensaje = res.message || '✅ Retiro realizado correctamente.';
        // Refrescar saldo
        this.ngOnInit();
      },
      error: (err) => {
        console.error('❌ Error al realizar el retiro:', err);
        this.mensaje = '❌ Error al realizar el retiro.';
      }
    });
  }
}
