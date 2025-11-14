import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
// 1. Importar Módulos
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
// 2. Importar Servicio
import { AuthService } from '../../services/auth.service';

// 🔽 Interfaz actualizada
interface CarteraCuenta {
  idCuenta: number;
  clabe: string;
  tipoCuenta: string;
  saldo: number;
  idUsuario: number;
  nombre: string;
  apellidoP: string;
  apellidoM: string; // añadido
  email: string;
  telefono: string;  // añadido
  direccion: string; // añadido
  RFC: string;       // añadido
  CURP: string;      // añadido
}

@Component({
  selector: 'app-cuentas',
  standalone: true,
  // 3. Importar NgModules
  imports: [CommonModule, HttpClientModule, FormsModule],
  templateUrl: './cuentas.component.html',
  styleUrl: './cuentas.component.css'
})
export class CuentasComponent implements OnInit {
  vista: 'cartera' | 'agregar' = 'cartera';
  cartera: CarteraCuenta[] = [];
  filtro: string = '';

  // Formulario de nuevo cliente
  formCliente = {
    nombre: '',
    apellidoP: '',
    apellidoM: '',
    direccion: '',
    telefono: '',
    email: '',
    contrasenia: '',
    fechaNacimiento: '',
    CURP: '',
    RFC: '',
    INE: '',
    preguntaSeguridad: '¿Cuál es tu comida favorita?',
    respuestaSeguridad: ''
  };
  
  // 🔽 Propiedades para edición y mensajes
  mensajeExito: string = '';
  error: string = '';
  clienteEnEdicion: CarteraCuenta | null = null;
  // Propiedad 'mensaje' original renombrada a 'mensajeExito' o 'error'

  constructor(
    private http: HttpClient, 
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.cargarCartera();
  }

  limpiarMensajes(): void {
    this.mensajeExito = '';
    this.error = '';
  }

  cargarCartera(): void {
    this.limpiarMensajes();
    this.http.get<CarteraCuenta[]>('http://localhost:3000/api/ejecutivo/cartera-cuentas')
      .subscribe({
        next: (data) => this.cartera = data,
        error: (err: any) => this.error = 'Error al cargar cartera'
      });
  }

  get carteraFiltrada() {
    if (!this.filtro) return this.cartera;
    const f = this.filtro.toLowerCase();
    return this.cartera.filter(
      (c: CarteraCuenta) => c.nombre.toLowerCase().includes(f) ||
           c.apellidoP.toLowerCase().includes(f) ||
           c.email.toLowerCase().includes(f) ||
           c.clabe.includes(f) ||
           c.CURP.toLowerCase().includes(f)
    );
  }

  eliminarCuenta(idCuenta: number): void {
    this.limpiarMensajes();
    if (!confirm('¿Estás seguro de que deseas CERRAR esta cuenta? Esta acción no se puede deshacer.')) {
      return;
    }
    
    this.http.delete(`http://localhost:3000/api/ejecutivo/eliminar-cuenta/${idCuenta}`)
      .subscribe({
        next: () => {
          this.mensajeExito = 'Cuenta eliminada exitosamente.';
          this.cargarCartera();
        },
        error: (err: any) => this.error = err.error?.message || 'Error al eliminar la cuenta.'
      });
  }

  agregarCliente(): void {
    this.limpiarMensajes();
    this.mensajeExito = 'Procesando...'; // Usar mensajeExito
    
    this.authService.register(this.formCliente).subscribe({
      next: (res: any) => {
        this.mensajeExito = 'Cliente y cuenta creados exitosamente.';
        this.formCliente = { // Resetear formulario
          nombre: '', apellidoP: '', apellidoM: '', direccion: '', telefono: '',
          email: '', contrasenia: '', fechaNacimiento: '', CURP: '', RFC: '',
          INE: '', preguntaSeguridad: '¿Cuál es tu comida favorita?', respuestaSeguridad: ''
        };
        this.vista = 'cartera'; // Volver a la cartera
        this.cargarCartera(); // Recargar
      },
      error: (err: any) => {
        this.error = err.error?.message || 'Error al crear el cliente.';
        this.mensajeExito = ''; // Limpiar mensaje de "procesando"
      }
    });
  }

  // 🔽 --- NUEVAS FUNCIONES PARA EDITAR --- 🔽

  iniciarEdicion(cliente: CarteraCuenta): void {
    this.limpiarMensajes();
    // 🔽 FIX: Usar Object.assign para clonar explícitamente y evitar error de tipo
    this.clienteEnEdicion = Object.assign({}, cliente);
  }

  cancelarEdicion(): void {
    this.clienteEnEdicion = null;
    this.limpiarMensajes();
  }

  guardarCambios(): void {
    if (!this.clienteEnEdicion) return; // Guard para 'null'
    this.limpiarMensajes();

    const idUsuario = this.clienteEnEdicion.idUsuario;
    
    // Usamos el endpoint del GERENTE
    // El guard 'if' anterior asegura que this.clienteEnEdicion no es null aquí
    this.http.put(`http://localhost:3000/api/gerente/cliente-detalle/${idUsuario}`, this.clienteEnEdicion)
      .subscribe({
        next: (res: any) => {
          this.mensajeExito = res.message || 'Cliente actualizado';
          this.clienteEnEdicion = null;
          this.cargarCartera(); // Recargar los datos de la tabla
        },
        error: (err: any) => {
          this.error = err.error?.error || 'Error al guardar los cambios';
        }
      });
  }
}