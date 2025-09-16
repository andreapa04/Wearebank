import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

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
  userType: 'cliente' | 'gerente' | null = null;

  // Lista de rutas para cada tipo de usuario
  private clientRoutes = [
    '/cliente', '/consultas', '/retiros', '/transferencias', 
    '/pagos', '/prestamos', '/creditos'
  ];

  private gerenteRoutes = [
    '/gerente', '/gerente/autorizaciones', '/gerente/cuentas',
    '/gerente/gestion-permisos', '/gerente/solicitudes'
  ];

  constructor(private router: Router) {
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd)
      )
      .subscribe((event: NavigationEnd) => {
        const currentUrl = event.urlAfterRedirects;
        
        // Determinar tipo de usuario basado en la ruta
        if (this.clientRoutes.some(route => currentUrl.startsWith(route))) {
          this.showNavbar = true;
          this.userType = 'cliente';
        } else if (this.gerenteRoutes.some(route => currentUrl.startsWith(route))) {
          this.showNavbar = true;
          this.userType = 'gerente';
        } else {
          this.showNavbar = false;
          this.userType = null;
        }
      });
  }

  logout(event: Event) {
    event.preventDefault();
    this.router.navigate(['/login']);
  }

  // Método para verificar si una ruta está activa
  isActiveRoute(route: string): boolean {
    return this.router.url === route || this.router.url.startsWith(route + '/');
  }
}