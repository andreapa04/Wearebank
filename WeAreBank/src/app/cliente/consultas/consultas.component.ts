import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { safeLocalStorage } from '../../utils/storage.util';

@Component({
  selector: 'app-consultas',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './consultas.component.html',
  styleUrls: ['./consultas.component.css']
})
export class ConsultasComponent implements OnInit {
  cuentas: any[] = [];
  movimientos: any[] = [];
  idCuentaSeleccionada: number | null = null;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    const usuario = JSON.parse(safeLocalStorage().getItem('usuario') || 'null');
    if (usuario) this.http.get(`http://localhost:3000/api/transferencias/mis-cuentas/${usuario.id}`).subscribe((data:any)=> this.cuentas=data);
  }

  cargarMovimientos() {
    if (!this.idCuentaSeleccionada) return;
    this.http.get(`http://localhost:3000/api/movimientos/${this.idCuentaSeleccionada}`)
      .subscribe((data:any)=> this.movimientos=data);
  }
}
