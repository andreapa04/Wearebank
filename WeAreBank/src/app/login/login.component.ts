import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  email: string = '';
  contrasenia: string = '';
  recordarme: boolean = false;

  constructor(private authService: AuthService, private router: Router) {}

  iniciarSesion() {
    if (!this.email || !this.contrasenia) {
      alert("Por favor, ingresa correo y contraseña");
      return;
    }

    this.authService.login(this.email, this.contrasenia).subscribe({
      next: (res) => {
        console.log("Respuesta del backend:", res);

        if (res.user) {
          const user = res.user;

          // 🔹 Guardamos los datos del usuario
          localStorage.setItem('usuario', JSON.stringify(user));
          localStorage.setItem('nombreUsuario', `${user.nombre} ${user.apellidoP}`);
          const roles: Record<number, string> = {
            1: 'Gerente',
            2: 'Ejecutivo',
            3: 'Cliente'
          };
          localStorage.setItem('rolUsuario', roles[user.rol] || 'Desconocido');

          // 🔹 Redirigir según rol
          if (user.rol === 1) this.router.navigate(['/gerente']);
          else if (user.rol === 2) this.router.navigate(['/ejecutivo']);
          else if (user.rol === 3) this.router.navigate(['/cliente']);
          else alert("Rol desconocido. Contacta con soporte.");
        } else {
          alert(res.message || "Credenciales inválidas");
        }
      },
      error: (err) => {
        console.error("Error en login:", err);
        alert(err.error?.message || "Error en el servidor");
      }
    });
  }
}
