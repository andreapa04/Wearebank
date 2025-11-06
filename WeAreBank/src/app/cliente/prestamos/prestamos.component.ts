import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { safeLocalStorage } from '../../utils/storage.util';

interface Solicitud {
  idSolicitud: number;
  tipo: string;
  plazo: string;
  montoTotal: number;
  intereses: number;
  cat: number;
  estado: string;
  fechaSolicitud: string;
  clabe: string;
}

interface Pago {
  idPago: number;
  monto: number;
  fechaHora: string;
}

@Component({
  selector: 'app-prestamos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './prestamos.component.html',
  styleUrls: ['./prestamos.component.css']
})
export class PrestamosComponent implements OnInit {
  tipoPrestamo = '';
  monto = 0;
  plazo = 12;
  ingresosMensuales = 0;
  cuentaSeleccionada: number | null = null;
  montoPago = 0;

  solicitudes: Solicitud[] = [];
  pagos: Pago[] = [];
  cuentas: any[] = [];

  solicitudSeleccionada: number | null = null;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    const usuario = JSON.parse(safeLocalStorage().getItem('usuario') || 'null');
    if (!usuario?.id) return;

    this.cargarSolicitudes(usuario.id);
    this.cargarCuentas(usuario.id);
  }

  cargarSolicitudes(idUsuario: number) {
    this.http.get<Solicitud[]>(`http://localhost:3000/api/prestamos/usuario/${idUsuario}`)
      .subscribe({
        next: data => this.solicitudes = data,
        error: err => console.error('❌ Error al cargar solicitudes:', err)
      });
  }

  cargarCuentas(idUsuario: number) {
    this.http.get<any[]>(`http://localhost:3000/api/consultas/mis-cuentas/${idUsuario}`)
      .subscribe({
        next: data => this.cuentas = data,
        error: err => console.error('❌ Error al cargar cuentas:', err)
      });
  }

  solicitarPrestamo() {
    const usuario = JSON.parse(safeLocalStorage().getItem('usuario') || 'null');
    if (!usuario?.id) return alert('No se encontró usuario en sesión');
    if (!this.cuentaSeleccionada) return alert('Selecciona una cuenta.');

    const payload = {
      idUsuario: usuario.id,
      idCuenta: this.cuentaSeleccionada,
      montoTotal: this.monto,
      plazo: `${this.plazo} meses`,
      tipo: this.tipoPrestamo === 'automotriz' ? 'CREDITO_AUTOMOTRIZ' : 'PRESTAMO_PERSONAL'
    };

    this.http.post('http://localhost:3000/api/prestamos/solicitar', payload)
      .subscribe({
        next: (res: any) => {
          alert(res.message);
          this.cargarSolicitudes(usuario.id);
        },
        error: err => console.error('❌ Error al solicitar préstamo:', err)
      });
  }

  verPagos(idSolicitud: number) {
    this.solicitudSeleccionada = idSolicitud;
    this.http.get<Pago[]>(`http://localhost:3000/api/prestamos/pagos/${idSolicitud}`)
      .subscribe({
        next: data => this.pagos = data,
        error: err => console.error('❌ Error al obtener pagos:', err)
      });
  }

  pagarSolicitud(idSolicitud: number) {
    if (!this.montoPago || this.montoPago <= 0)
      return alert('Ingrese un monto válido para el pago.');

    const payload = { idSolicitud, monto: this.montoPago };

    this.http.post('http://localhost:3000/api/prestamos/pago', payload)
      .subscribe({
        next: (res: any) => {
          alert(res.message);
          this.montoPago = 0;
          this.verPagos(idSolicitud);
        },
        error: err => console.error('❌ Error al registrar pago:', err)
      });
  }
}
