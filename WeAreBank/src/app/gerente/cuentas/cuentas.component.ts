import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
// 1. Importar Módulos
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
// 2. Importar Servicio
import { AuthService } from '../../services/auth.service';

interface CarteraCuenta {
  idCuenta: number;
  clabe: string;
  tipoCuenta: string;
  saldo: number;
  estadoCuenta: string;
  idUsuario: number;
  nombre: string;
  apellidoP: string;
  email: string;
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
  mensaje: string = '';

  // 4. Inyectar Servicios (HttpClient y AuthService)
  constructor(
    private http: HttpClient, 
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.cargarCartera();
  }

  cargarCartera(): void {
    // 🔽 USA EL ENDPOINT DE EJECUTIVO
    this.http.get<CarteraCuenta[]>('http://localhost:3000/api/ejecutivo/cartera-cuentas')
      .subscribe({
        next: (data) => this.cartera = data,
        // 5. Tipar error
        error: (err: any) => console.error('Error al cargar cartera', err)
      });
  }

  get carteraFiltrada() {
    if (!this.filtro) return this.cartera;
    const f = this.filtro.toLowerCase();
    return this.cartera.filter(
      (c: CarteraCuenta) => c.nombre.toLowerCase().includes(f) ||
           c.apellidoP.toLowerCase().includes(f) ||
           c.email.toLowerCase().includes(f) ||
           c.clabe.includes(f)
    );
  }

  eliminarCuenta(idCuenta: number): void {
    if (!confirm('¿Estás seguro de que deseas CERRAR esta cuenta? Esta acción no se puede deshacer.')) {
      return;
    }
    // 🔽 USA EL ENDPOINT DE EJECUTIVO
    this.http.delete(`http://localhost:3000/api/ejecutivo/eliminar-cuenta/${idCuenta}`)
      .subscribe({
        next: () => {
          this.mensaje = 'Cuenta eliminada exitosamente.';
          this.cargarCartera();
        },
        // 6. Tipar error
        error: (err: any) => this.mensaje = 'Error al eliminar la cuenta.'
      });
  }

  agregarCliente(): void {
    this.mensaje = 'Procesando...';
    // 7. Usa el servicio de Auth para registrar (Rol 3 por defecto)
    // 🔽 USA EL ENDPOINT DE AUTH (que crea Clientes Rol 3)
    this.authService.register(this.formCliente).subscribe({
      // 8. Tipar respuesta
      next: (res: any) => {
        this.mensaje = ' Cliente y cuenta creados exitosamente.';
        // Reiniciar formulario (simple)
        this.formCliente = {
          nombre: '', apellidoP: '', apellidoM: '', direccion: '', telefono: '',
          email: '', contrasenia: '', fechaNacimiento: '', CURP: '', RFC: '',
          INE: '', preguntaSeguridad: '¿Cuál es tu comida favorita?', respuestaSeguridad: ''
        };
      },
      // 9. Tipar error
      error: (err: any) => {
        this.mensaje = err.error?.message || 'Error al crear el cliente.';
      }
    });
  }
}