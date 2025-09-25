import { Injectable } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard {
  constructor(private router: Router) {}

  canActivate: CanActivateFn = (route, state) => {
    const usuario = JSON.parse(localStorage.getItem('usuario') || 'null');

    if (!usuario) {
      this.router.navigate(['/login']);
      return false;
    }

    // Verificamos el rol contra la ruta
    const rol = usuario.rol; // 0 = gerente, 1 = ejecutivo, 2 = cliente
    const url = state.url;

    if (url.startsWith('/gerente') && rol !== 0) {
      this.router.navigate(['/login']);
      return false;
    }

    if (url.startsWith('/ejecutivo') && rol !== 1) {
      this.router.navigate(['/login']);
      return false;
    }

    if (url.startsWith('/cliente') && rol !== 2) {
      this.router.navigate(['/login']);
      return false;
    }

    return true;
  };
}
