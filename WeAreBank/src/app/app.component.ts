import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { safeLocalStorage } from './utils/storage.util';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'WeAreBank';
  showNavbar: boolean = false;
  userType: 'cliente' | 'gerente' | 'ejecutivo' | null = null;
  errorMessage: string | null = null;

  private clientRoutes = [
    '/cliente', '/cliente/consultas', '/cliente/retiros',
    '/cliente/transferencias', '/cliente/pagos',
    '/cliente/prestamos', '/cliente/creditos'
  ];

  private gerenteRoutes = [
    '/gerente', '/gerente/autorizaciones', '/gerente/cuentas',
    '/gerente/gestion-permisos', '/gerente/solicitudes'
  ];

  private ejecutivoRoutes = ['/ejecutivo'];

  constructor(private router: Router) {
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        const currentUrl = event.urlAfterRedirects;

        if (this.clientRoutes.some(route => currentUrl.startsWith(route))) {
          this.showNavbar = true;
          this.userType = 'cliente';
        } else if (this.gerenteRoutes.some(route => currentUrl.startsWith(route))) {
          this.showNavbar = true;
          this.userType = 'gerente';
        } else if (this.ejecutivoRoutes.some(route => currentUrl.startsWith(route))) {
          this.showNavbar = true;
          this.userType = 'ejecutivo';
        } else {
          this.showNavbar = false;
          this.userType = null;
        }

        // 🔹 Limpiar mensajes de error al navegar correctamente
        this.errorMessage = null;
      });
  }

  logout(event: Event) {
    event.preventDefault();
    const ls = safeLocalStorage();
    ls.removeItem('usuario');
    this.showNavbar = false;
    this.userType = null;
    this.router.navigate(['/login']);
  }

  // Mostrar error desde el guard
  showError(msg: string) {
    this.errorMessage = msg;
  }

  isActiveRoute(route: string): boolean {
    return this.router.url === route || this.router.url.startsWith(route + '/');
  }
}
