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
  fecha?: string | Date;
  fechaHora?: string | Date;
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
  cuentaSeleccionada: Cuenta | null = null;
  cargandoPDF: boolean = false;

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
    this.cuentaSeleccionada = cuenta;
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

  /**
   * 🔹 Descarga el estado de cuenta en PDF
   */
  descargarEstadoCuentaPDF(): void {
    if (!this.cuentaSeleccionada) {
      alert('⚠️ Por favor selecciona una cuenta primero');
      return;
    }

    this.cargandoPDF = true;

    this.http
      .get(
        `http://localhost:3000/api/consultas/estado-cuenta-pdf/${this.cuentaSeleccionada.clabe}`,
        {
          responseType: 'blob' // ✅ Importante: recibir como blob
        }
      )
      .subscribe({
        next: (blob: Blob) => {
          // ✅ Crear un objeto URL temporal para el blob
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;

          // ✅ Generar nombre del archivo con fecha
          const fecha = new Date();
          const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
          const año = fecha.getFullYear();
          const nombreArchivo = `estado-cuenta-${this.cuentaSeleccionada!.clabe}-${año}-${mes}.pdf`;

          link.download = nombreArchivo;
          link.click();

          // ✅ Liberar memoria
          window.URL.revokeObjectURL(url);

          this.cargandoPDF = false;
          alert('✅ Estado de cuenta descargado correctamente');
        },
        error: (error) => {
          console.error('❌ Error al descargar el PDF:', error);
          this.cargandoPDF = false;
          
          if (error.status === 404) {
            alert('❌ No se encontró la cuenta o no tiene movimientos');
          } else {
            alert('❌ Error al generar el estado de cuenta. Intenta nuevamente.');
          }
        }
      });
  }
}
