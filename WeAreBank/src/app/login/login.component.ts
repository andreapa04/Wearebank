import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../services/auth.service';

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

  constructor(private router: Router, private authService: AuthService) {}

  iniciarSesion() {
  if (this.usuario && this.contrasena) {
    this.authService.login(this.usuario, this.contrasena).subscribe({
      next: (res) => {
        console.log('Login correcto', res);

        // Guardamos usuario en localStorage
        localStorage.setItem('usuario', JSON.stringify(res.usuario));

        // Redirigimos según rol
        if (res.usuario.rol === 0) {
          this.router.navigate(['/gerente']);
        } else if (res.usuario.rol === 1) {
          this.router.navigate(['/ejecutivo']);
        } else if (res.usuario.rol === 2) {
          this.router.navigate(['/cliente']);
        } else {
          alert('Rol no reconocido');
        }
      },
      error: (err) => {
        alert(err.error.mensaje || 'Error al iniciar sesión');
      }
    });
  } else {
    alert('Por favor, ingresa usuario y contraseña');
  }
}
}