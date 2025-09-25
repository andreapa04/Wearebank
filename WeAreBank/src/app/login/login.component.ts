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
          // 🔹 Guardamos con la clave 'usuario' (igual que espera AuthGuard)
          localStorage.setItem('usuario', JSON.stringify(res.user));

          // 🔹 Redirigir según rol
          const rol = res.user.rol;
          if (rol === 0) this.router.navigate(['/gerente']);
          else if (rol === 1) this.router.navigate(['/ejecutivo']);
          else if (rol === 2) this.router.navigate(['/cliente']);
        } else {
          alert(res.error || "Credenciales inválidas");
        }
      },
      error: (err) => {
        console.error("Error en login:", err);
        alert("Error en el servidor");
      }
    });
  }
}
