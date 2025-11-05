import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { safeLocalStorage } from '../../utils/storage.util';

interface Cuenta {
  idCuenta: number;
  clabe: string;
  tipoCuenta: string;
  saldo: number;
}

interface Movimiento {
  idMovimiento: number;
  fecha?: string | Date;       // Puede ser null o string
  fechaHora?: string | Date;   // Alternativo si viene del backend como "fechaHora"
  monto: number;
  tipoMovimiento: string;
}

@Component({
  selector: 'app-consultas',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './consultas.component.html',
  styleUrls: ['./consultas.component.css']
})
export class ConsultasComponent implements OnInit {
  cuentas: Cuenta[] = [];
  movimientos: Movimiento[] = [];
  idCuentaSeleccionada: number | null = null;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    const usuario = JSON.parse(safeLocalStorage().getItem('usuario') || 'null');

    if (!usuario || !usuario.id) {
      console.error('⚠️ No se encontró usuario en sesión');
      return;
    }

    // 🔹 Cargar las cuentas del usuario logueado
    this.http
      .get<Cuenta[]>(`http://localhost:3000/api/consultas/mis-cuentas/${usuario.id}`)
      .subscribe({
        next: (data) => {
          this.cuentas = data;
        },
        error: (err) => {
          console.error('❌ Error al cargar cuentas:', err);
        },
      });
  }

  seleccionarCuenta(cuenta: Cuenta): void {
    this.idCuentaSeleccionada = cuenta.idCuenta;
    this.cargarMovimientos(cuenta.idCuenta);
  }

  cargarMovimientos(idCuenta: number): void {
    if (!idCuenta) return;

    this.http
      .get<Movimiento[]>(`http://localhost:3000/api/consultas/movimientos/${idCuenta}`)
      .subscribe({
        next: (data) => {
          // ✅ Convertir fecha de MySQL "YYYY-MM-DD HH:mm:ss" a formato válido
          this.movimientos = data.map((mov) => {
            const rawFecha = (mov.fecha || mov.fechaHora) as string | undefined;
            let fechaValida: Date;

            if (rawFecha && typeof rawFecha === 'string') {
              // MySQL -> ISO
              const fixedDate = rawFecha.replace(' ', 'T');
              fechaValida = new Date(fixedDate);
            } else {
              fechaValida = new Date(); // fallback
            }

            // Si la fecha sigue siendo inválida, usar fecha actual
            if (isNaN(fechaValida.getTime())) {
              fechaValida = new Date();
            }

            return {
              ...mov,
              fecha: fechaValida,
            };
          });

          // 🔹 (Opcional) ordenar por fecha descendente
          this.movimientos.sort(
            (a, b) =>
              new Date(b.fecha as Date).getTime() - new Date(a.fecha as Date).getTime()
          );
        },
        error: (err) => {
          console.error('❌ Error al cargar movimientos:', err);
        },
      });
  }
}
