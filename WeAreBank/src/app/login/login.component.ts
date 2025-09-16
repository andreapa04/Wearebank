import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

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

  constructor(private router: Router) {}

  iniciarSesion() {
    if (this.usuario && this.contrasena) {
      this.router.navigate(['/cliente']);
    } else {
      alert('Por favor, ingresa usuario y contraseña');
    }
  }
}