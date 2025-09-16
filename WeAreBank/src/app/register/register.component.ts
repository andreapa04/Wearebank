import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  nombre: string = '';
  apellidoPaterno: string = '';
  apellidoMaterno: string = '';
  fechaNacimiento: string = '';
  curp: string = '';
  rfc: string = '';
  calleNumero: string = '';
  colonia: string = '';
  ciudad: string = '';
  codigoPostal: string = '';
  estado: string = '';
  telefono: string = '';
  email: string = '';
  contrasena: string = '';

  constructor(private router: Router) {}

  enviarSolicitud() {
    alert('Solicitud enviada. Serás redirigido al login.');
    this.router.navigate(['/login']);
  }
}