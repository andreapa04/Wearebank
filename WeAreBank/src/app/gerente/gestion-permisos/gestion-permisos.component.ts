import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

interface Permiso {
  idPermiso: number;
  nombrePermiso: string;
  descripcion: string;
}

@Component({
  selector: 'app-gestion-permisos',
  // 🔽 Importar CommonModule, HttpClientModule y FormsModule
  standalone: true,
  imports: [CommonModule, HttpClientModule, FormsModule],
  templateUrl: './gestion-permisos.component.html',
  styleUrl: './gestion-permisos.component.css'
})
export class GestionPermisosComponent implements OnInit {
  
  todosLosPermisos: Permiso[] = [];
  permisosRolEjecutivo: { [idPermiso: number]: boolean } = {};
  
  mensaje: string = '';
  error: string = '';

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.cargarPermisos();
  }

  cargarPermisos(): void {
    this.limpiarMensajes();
    // 1. Obtener el catálogo maestro de permisos
    this.http.get<Permiso[]>('http://localhost:3000/api/gerente/permisos/catalogo')
      .subscribe({
        next: (catalogo) => {
          this.todosLosPermisos = catalogo;
          
          // 2. Obtener los permisos que SÍ tiene el rol
          this.http.get<number[]>('http://localhost:3000/api/gerente/permisos/rol/2')
            .subscribe({
              next: (permisosActuales) => {
                // 3. Poblar el objeto de checkboxes
                this.permisosRolEjecutivo = {};
                for (const p of catalogo) {
                  // Si el ID del permiso está en el array 'permisosActuales', marcarlo como true
                  this.permisosRolEjecutivo[p.idPermiso] = permisosActuales.includes(p.idPermiso);
                }
              },
              error: (err) => this.error = 'Error al cargar permisos del rol'
            });
        },
        error: (err) => this.error = 'Error al cargar catálogo de permisos'
      });
  }

  guardarCambios(): void {
    this.limpiarMensajes();

    // Convertir el objeto { 1: true, 2: false } en un array [1]
    const idsPermisosAEnviar: number[] = [];
    for (const idPermisoStr in this.permisosRolEjecutivo) {
      if (this.permisosRolEjecutivo.hasOwnProperty(idPermisoStr)) {
        if (this.permisosRolEjecutivo[idPermisoStr] === true) {
          idsPermisosAEnviar.push(Number(idPermisoStr));
        }
      }
    }

    this.http.put('http://localhost:3000/api/gerente/permisos/rol/2', { permisos: idsPermisosAEnviar })
      .subscribe({
        next: (res: any) => {
          this.mensaje = res.message || 'Permisos actualizados correctamente';
        },
        error: (err) => this.error = err.error?.error || 'Error al guardar permisos'
      });
  }

  limpiarMensajes(): void {
    this.mensaje = '';
    this.error = '';
  }
}