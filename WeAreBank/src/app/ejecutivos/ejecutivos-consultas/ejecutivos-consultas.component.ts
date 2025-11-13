import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service'; // 🔽 1. Importar AuthService

interface Cliente {
  idUsuario: number;
  nombre: string;
  apellidoP: string;
  apellidoM: string;
  email: string;
  telefono: string;
  RFC: string;
  CURP: string;
}
interface Cuenta {
  idCuenta: number;
  clabe: string;
  tipoCuenta: string;
  saldo: number;
}
interface Movimiento {
  idMovimiento: number;
  fechaHora: string;
  tipoMovimiento: string;
  monto: number;
}

@Component({
  selector: 'app-ejecutivos-consultas',
  standalone: true,
  imports: [CommonModule, HttpClientModule, FormsModule],
  templateUrl: './ejecutivos-consultas.component.html',
  styleUrls: ['./ejecutivos-consultas.component.css']
})
export class EjecutivosConsultasComponent implements OnInit {
  clientes: Cliente[] = [];
  filtro: string = '';
  
  clienteSeleccionado: Cliente | null = null;
  cuentasCliente: Cuenta[] = [];
  movimientosCliente: Movimiento[] = [];
  
  cargandoDetalle: boolean = false;

  // 🔽 2. Inyectar AuthService y hacerlo PÚBLICO
  constructor(
    private http: HttpClient,
    public authService: AuthService // Poner 'public'
  ) {}

  ngOnInit(): void {
    this.http.get<Cliente[]>('http://localhost:3000/api/ejecutivo/clientes-consulta')
      .subscribe({
        next: (data: Cliente[]) => this.clientes = data,
        error: (err: any) => console.error('Error al cargar clientes', err)
      });
  }

  get clientesFiltrados() {
    if (!this.filtro) return this.clientes;
    const f = this.filtro.toLowerCase();
    return this.clientes.filter(
      (c: Cliente) => c.nombre.toLowerCase().includes(f) ||
           c.apellidoP.toLowerCase().includes(f) ||
           c.email.toLowerCase().includes(f) ||
           c.CURP.toLowerCase().includes(f) ||
           c.RFC.toLowerCase().includes(f)
    );
  }

  verDetalle(cliente: Cliente): void {
    if (this.clienteSeleccionado?.idUsuario === cliente.idUsuario) {
      this.clienteSeleccionado = null; // Ocultar si se vuelve a presionar
      this.cuentasCliente = [];
      this.movimientosCliente = [];
      return;
    }
    
    this.clienteSeleccionado = cliente;
    this.cargandoDetalle = true;
    this.cuentasCliente = [];
    this.movimientosCliente = [];

    this.http.get<any>(`http://localhost:3000/api/ejecutivo/cliente-detalle/${cliente.idUsuario}`)
      .subscribe({
        next: (data: any) => {
          this.cuentasCliente = data.cuentas;
          this.movimientosCliente = data.movimientos;
          this.cargandoDetalle = false;
        },
        error: (err: any) => {
          console.error('Error al cargar detalle', err);
          this.cargandoDetalle = false;
        }
      });
  }

  descargarEstadoCuenta(clabe: string): void {
    // 🔽 3. Validar permiso
    if (!this.authService.tienePermiso('GENERAR_ESTADO_CUENTA')) {
      alert('No tienes permiso para generar estados de cuenta.');
      return;
    }

    if (!clabe) return;

    this.http.get(`http://localhost:3000/api/consultas/estado-cuenta-pdf/${clabe}`, { responseType: 'blob' })
      .subscribe({
        next: (blob: Blob) => {
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `estado-cuenta-${clabe}.pdf`;
          link.click();
          window.URL.revokeObjectURL(url);
        },
        error: (err: any) => alert('Error al generar el PDF. Es posible que la cuenta no tenga movimientos.')
      });
  }
  
  // 🔽 4. (Opcional) Añadir función para modificar datos (si se implementara el modal)
  modificarCliente(cliente: Cliente): void {
    if (!this.authService.tienePermiso('MODIFICAR_DATOS_CLIENTE')) {
      alert('No tienes permiso para modificar datos de clientes.');
      return;
    }
    // Aquí iría la lógica para abrir un modal de edición
    alert('Acción "Modificar Datos" permitida (lógica de modal no implementada).');
  }
}