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
      this.router.navigate(['/login']);
      return false;
    }

    const rol = usuario.rol;
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
