import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
// 🔽 HttpClientModule es necesario para que HttpClient funcione en modo standalone
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { safeLocalStorage } from '../../utils/storage.util';

// 🔽 --- Interfaces (re-añadidas) --- 🔽
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

interface Tarjeta {
  idTarjeta: number;
  numeroTarjeta: string;
  vencimiento: string;
  tipoTarjeta: string;
  esVirtual: boolean;
  nombre: string;
  apellidoP: string;
  apellidoM: string;
}
// 🔼 -------------------------------- 🔼

@Component({
  selector: 'app-consultas',
  standalone: true,
  imports: [CommonModule, HttpClientModule], // 🔽 HttpClientModule añadido
  templateUrl: './consultas.component.html',
  styleUrls: ['./consultas.component.css']
})
export class ConsultasComponent implements OnInit {
  // --- Propiedades Originales ---
  cuentas: Cuenta[] = [];
  tarjetas: Tarjeta[] = [];
  movimientos: Movimiento[] = [];
  idCuentaSeleccionada: number | null = null;
  cuentaSeleccionada: Cuenta | null = null;
  cargandoPDF: boolean = false;
  
  // --- Propiedades para Cierre ---
  usuarioNombre: string = '';
  idUsuario: number | null = null; 
  cierreMensaje: string = '';
  cierreError: string = '';

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    const usuario = JSON.parse(safeLocalStorage().getItem('usuario') || 'null');

    if (!usuario || !usuario.id) {
      console.error(' No se encontró usuario en sesión');
      return;
    }
    
    this.idUsuario = usuario.id; 
    this.usuarioNombre = `${usuario.nombre || ''} ${usuario.apellidoP || ''}`;

    this.cargarCuentas(usuario.id);
    this.cargarTarjetas(usuario.id);
  }

  // --- Métodos Originales (re-añadidos) ---

  cargarCuentas(idUsuario: number): void {
    this.http
      .get<Cuenta[]>(`http://localhost:3000/api/consultas/mis-cuentas/${idUsuario}`)
      .subscribe({
        next: (data) => {
          this.cuentas = data;
          if (data.length > 0) {
            this.seleccionarCuenta(data[0]);
          }
        },
        error: (err) => console.error(' Error al cargar cuentas:', err),
      });
  }

  cargarTarjetas(idUsuario: number): void {
    this.http
      .get<Tarjeta[]>(`http://localhost:3000/api/consultas/mis-tarjetas/${idUsuario}`)
      .subscribe({
        next: (data) => this.tarjetas = data,
        error: (err) => console.error(' Error al cargar tarjetas:', err)
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
          // Convertir fecha de MySQL a formato válido
          this.movimientos = data.map((mov) => {
            const rawFecha = (mov.fecha || mov.fechaHora) as string | undefined;
            let fechaValida: Date;

            if (rawFecha && typeof rawFecha === 'string') {
              const fixedDate = rawFecha.replace(' ', 'T');
              fechaValida = new Date(fixedDate);
            } else {
              fechaValida = new Date(); // fallback
            }

            if (isNaN(fechaValida.getTime())) {
              fechaValida = new Date();
            }

            return {
              ...mov,
              fecha: fechaValida,
            };
          });

          this.movimientos.sort(
            (a, b) =>
              new Date(b.fecha as Date).getTime() - new Date(a.fecha as Date).getTime()
          );
        },
        error: (err) => {
          console.error(' Error al cargar movimientos:', err);
        },
      });
  }

  descargarEstadoCuentaPDF(): void {
    if (!this.cuentaSeleccionada) {
      alert(' Por favor selecciona una cuenta primero');
      return;
    }

    this.cargandoPDF = true;

    this.http
      .get(
        `http://localhost:3000/api/consultas/estado-cuenta-pdf/${this.cuentaSeleccionada.clabe}`,
        {
          responseType: 'blob'
        }
      )
      .subscribe({
        next: (blob: Blob) => {
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;

          const fecha = new Date();
          const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
          const año = fecha.getFullYear();
          const nombreArchivo = `estado-cuenta-${this.cuentaSeleccionada!.clabe}-${año}-${mes}.pdf`;

          link.download = nombreArchivo;
          link.click();
          window.URL.revokeObjectURL(url);

          this.cargandoPDF = false;
          alert(' Estado de cuenta descargado correctamente');
        },
        error: (error: any) => { // Tipado como any
          console.error(' Error al descargar el PDF:', error);
          this.cargandoPDF = false;
          
          if (error.status === 404) {
            alert(' No se encontró la cuenta o no tiene movimientos');
          } else {
            alert(' Error al generar el estado de cuenta. Intenta nuevamente.');
          }
        }
      });
  }

  // --- NUEVA FUNCIÓN PARA SOLICITAR CIERRE ---
  solicitarCierreCuenta(): void {
    if (!this.idUsuario) {
      this.cierreError = "No se pudo identificar al usuario.";
      return;
    }

    if (!confirm("¿Estás seguro de que deseas solicitar el cierre de tu cuenta? Esta acción no se puede deshacer y será revisada por un ejecutivo.")) {
      return;
    }

    this.cierreMensaje = 'Procesando...';
    this.cierreError = '';

    this.http.post('http://localhost:3000/api/consultas/solicitar-cierre', { idUsuario: this.idUsuario })
      .subscribe({
        next: (res: any) => {
          this.cierreMensaje = res.message;
        },
        error: (err: any) => {
          this.cierreError = err.error?.message || "Error al enviar la solicitud.";
          this.cierreMensaje = '';
        }
      });
  }
}