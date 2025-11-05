import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = 'http://localhost:3000/api/auth';

  constructor(private http: HttpClient) {}

  login(email: string, contrasenia: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, { email, contrasenia });
  }

  recuperar(email: string, preguntaSeguridad: string, respuestaSeguridad: string, nuevaContrasenia: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/recuperar`, { email, preguntaSeguridad, respuestaSeguridad, nuevaContrasenia });
  }

  logout() {
    localStorage.removeItem('usuario');
  }

  getUsuarioActual() {
    const usuario = localStorage.getItem('usuario');
    return usuario ? JSON.parse(usuario) : null;
  }
}
