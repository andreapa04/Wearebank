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

interface Prestamo {
  idSolicitud: number;
  tipo: string;
  montoTotal: number;
  plazo: string;
  intereses: number;
  estado: string;
  idCuenta: number;
  clabe: string;
  totalPagado: number;
}

interface HistorialPago {
  id: number;
  fecha: Date | string;
  monto: number;
  tipo: string;
  clabe: string;
  categoria: string;
  idSolicitud?: number;
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
  
  // Para pagos de servicios
  servicios: Servicio[] = [
    { nombre: 'Agua', referencia: 'Agua', ultimoPago: 180 },
    { nombre: 'Luz', referencia: 'Luz', ultimoPago: 250 },
    { nombre: 'Internet', referencia: 'Internet', ultimoPago: 300 },
    { nombre: 'Gas', referencia: 'Gas', ultimoPago: 120 }
  ];

  // Para pagos de préstamos
  prestamos: Prestamo[] = [];
  prestamoSeleccionado: Prestamo | null = null;
  montoPagoPrestamo: number = 0;

  // Historial de pagos
  historialPagos: HistorialPago[] = [];
  mostrarHistorial: boolean = false;

  // Control de vistas
  vistaActual: 'servicios' | 'prestamos' = 'servicios';

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

    // 🔹 Cargar préstamos aprobados
    this.http.get<Prestamo[]>(`http://localhost:3000/api/pagos/prestamos/${usuario.id}`)
      .subscribe({
        next: (data) => {
          this.prestamos = data;
          console.log('✅ Préstamos cargados:', this.prestamos);
        },
        error: (err) => console.error('❌ Error al cargar préstamos:', err)
      });

    // 🔹 Cargar historial de pagos
    this.cargarHistorial();
  }

  cambiarVista(vista: 'servicios' | 'prestamos'): void {
    this.vistaActual = vista;
    this.limpiarFormulario();
  }

  limpiarFormulario(): void {
    this.montoPago = 0;
    this.referencia = '';
    this.prestamoSeleccionado = null;
    this.montoPagoPrestamo = 0;
    this.mensaje = '';
  }

  pagarServicio(servicio: Servicio): void {
    this.referencia = servicio.referencia;
    this.montoPago = servicio.ultimoPago;
  }

  seleccionarPrestamo(prestamo: Prestamo): void {
    this.prestamoSeleccionado = prestamo;
    this.montoPagoPrestamo = 0;
  }

  realizarPagoServicio(): void {
    if (!this.idCuentaSeleccionada || this.montoPago <= 0) {
      this.mensaje = '⚠️ Selecciona una cuenta y un monto válido.';
      return;
    }

    const pagoData = {
      idCuenta: this.idCuentaSeleccionada,
      monto: this.montoPago,
      referencia: this.referencia || 'Pago de servicio'
    };

    this.http.post('http://localhost:3000/api/pagos/servicio', pagoData).subscribe({
      next: (res: any) => {
        this.mensaje = res.message || '✅ Pago realizado con éxito.';
        this.limpiarFormulario();
        this.ngOnInit(); // Actualizar datos
      },
      error: (err) => {
        console.error('❌ Error al realizar el pago:', err);
        this.mensaje = err.error?.error || '❌ Error al realizar el pago.';
      }
    });
  }

  realizarPagoPrestamo(): void {
    if (!this.idCuentaSeleccionada || !this.prestamoSeleccionado || this.montoPagoPrestamo <= 0) {
      this.mensaje = '⚠️ Selecciona una cuenta, un préstamo y un monto válido.';
      return;
    }

    const pagoData = {
      idCuenta: this.idCuentaSeleccionada,
      idSolicitud: this.prestamoSeleccionado.idSolicitud,
      monto: this.montoPagoPrestamo
    };

    this.http.post('http://localhost:3000/api/pagos/prestamo', pagoData).subscribe({
      next: (res: any) => {
        this.mensaje = res.message || '✅ Pago de préstamo realizado con éxito.';
        this.limpiarFormulario();
        this.ngOnInit(); // Actualizar datos
      },
      error: (err) => {
        console.error('❌ Error al realizar el pago de préstamo:', err);
        this.mensaje = err.error?.error || '❌ Error al realizar el pago de préstamo.';
      }
    });
  }

  cargarHistorial(): void {
    const usuario = JSON.parse(safeLocalStorage().getItem('usuario') || 'null');
    
    if (!usuario || !usuario.id) return;

    this.http.get<HistorialPago[]>(`http://localhost:3000/api/pagos/historial/${usuario.id}`)
      .subscribe({
        next: (data) => {
          this.historialPagos = data;
          console.log('✅ Historial cargado:', this.historialPagos);
        },
        error: (err) => console.error('❌ Error al cargar historial:', err)
      });
  }

  toggleHistorial(): void {
    this.mostrarHistorial = !this.mostrarHistorial;
    if (this.mostrarHistorial) {
      this.cargarHistorial();
    }
  }

  calcularSaldoPendiente(prestamo: Prestamo): number {
    return prestamo.montoTotal - prestamo.totalPagado;
  }
}
