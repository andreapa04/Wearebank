import { Injectable } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { safeLocalStorage } from '../utils/storage.util';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard {
  constructor(private router: Router) {}

  canActivate: CanActivateFn = (route, state) => {
    const ls = safeLocalStorage();
    const usuario = JSON.parse(ls.getItem('usuario') || 'null');

    if (!usuario) {
      // Si no hay sesión iniciada → redirigir al login
      this.router.navigate(['/login']);
      return false;
    }

    const rol = usuario.rol;
    const url = state.url;

    // Validación de acceso por rol
    if (url.startsWith('/gerente') && rol !== 0) {
      alert('No tienes permisos para acceder a esta ruta (solo Gerente).');
      return false;
    }

    if (url.startsWith('/ejecutivo') && rol !== 1) {
      alert('No tienes permisos para acceder a esta ruta (solo Ejecutivo).');
      return false;
    }

    if (url.startsWith('/cliente') && rol !== 2) {
      alert('No tienes permisos para acceder a esta ruta (solo Cliente).');
      return false;
    }

    return true;
  };
}
