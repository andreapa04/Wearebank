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

  // Lista de rutas donde debe mostrarse el navbar
  private clientRoutes = [
    '/cliente',
    '/consultas',
    '/retiros', 
    '/transferencias',
    '/pagos',
    '/prestamos',
    '/creditos'
  ];

  constructor(private router: Router) {
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd)
      )
      .subscribe((event: NavigationEnd) => {
        // Mostrar navbar si la ruta actual está en la lista de rutas de cliente
        this.showNavbar = this.clientRoutes.some(route => 
          event.urlAfterRedirects.startsWith(route)
        );
      });
  }

  logout(event: Event) {
    event.preventDefault();
    this.router.navigate(['/login']);
  }

  // Método para verificar si una ruta está activa (para resaltar en el navbar)
  isActiveRoute(route: string): boolean {
    return this.router.url === route || this.router.url.startsWith(route + '/');
  }
}