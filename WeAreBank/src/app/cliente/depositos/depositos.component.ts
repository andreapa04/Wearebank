import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { safeLocalStorage } from '../../utils/storage.util';

@Component({
  selector: 'app-depositos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './depositos.component.html',
  styleUrls: ['./depositos.component.css']
})
export class DepositosComponent implements OnInit {
  cuentas: any[] = [];
  idCuenta: number | null = null;
  cuentaDestino: number | null = null;
  monto: number = 0;
  concepto: string = '';
  mensaje: string = '';
  error: string = '';

  constructor(private http: HttpClient) {}

  ngOnInit() {
    const ls = safeLocalStorage();
    const usuario = JSON.parse(ls.getItem('usuario') || 'null');
    if (usuario && usuario.id) this.cargarCuentas(usuario.id);
    else this.error = 'Inicia sesión para depositar';
  }

  cargarCuentas(idUsuario:number) {
    this.http.get<any[]>(`http://localhost:3000/api/transferencias/mis-cuentas/${idUsuario}`)
      .subscribe({ next: res => this.cuentas = res, error: err => this.error = err.error?.error || 'Error' });
  }

  depositar() {
    if (!this.idCuenta || !this.monto) { this.error = 'Selecciona cuenta y monto'; return; }
    this.http.post('http://localhost:3000/api/transferencias/deposito', { idCuenta: this.idCuenta, monto: this.monto, concepto: this.concepto, cuentaDestino: this.cuentaDestino,})
      .subscribe({
        next: (res:any) => {
          this.mensaje = res.message || 'Depósito realizado';
          alert('Depósito realizado exitosamente');
          this.cargarCuentas(JSON.parse(safeLocalStorage().getItem('usuario') || 'null')?.id);
          this.idCuenta = null; this.monto = 0; this.concepto = ''; 
        },
        error: err => this.error = err.error?.error || 'Error en depósito'
      });
  }

  cancelar() {
    this.idCuenta = null; this.monto = 0; this.concepto = ''; this.error = ''; this.mensaje = '';
  }
}
