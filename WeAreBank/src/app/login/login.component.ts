import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../services/auth.service'; // 👈 Importar servicio

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  usuario: string = '';
  contrasena: string = '';
  recordarme: boolean = false;
  errorMessage: string = '';

  constructor(private router: Router, private authService: AuthService) {}

  iniciarSesion() {
    if (!this.usuario || !this.contrasena) {
      this.errorMessage = 'Por favor, ingresa usuario y contraseña';
      return;
    }

    this.authService.login(this.usuario, this.contrasena).subscribe({
      next: (res) => {
        // Guardar token y rol en localStorage
        this.authService.saveToken(res.token, res.rol);

        // Si el usuario eligió "recordarme", se puede extender la lógica
        if (this.recordarme) {
          localStorage.setItem('remember', 'true');
        }

        // Redirigir según el rol del usuario
        if (res.rol === 'cliente') {
          this.router.navigate(['/cliente']);
        } else if (res.rol === 'gerente') {
          this.router.navigate(['/gerente']);
        } else if (res.rol === 'ejecutivo') {
          this.router.navigate(['/ejecutivo']);
        }
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Error al iniciar sesión';
      }
    });
  }
}
