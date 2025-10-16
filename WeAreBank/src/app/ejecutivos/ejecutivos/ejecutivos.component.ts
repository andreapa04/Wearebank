import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; 

@Component({
  selector: 'app-ejecutivos',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ejecutivos.component.html',
  styleUrls: ['./ejecutivos.component.css'] // Asegúrate que el nombre de archivo coincida
})
export class EjecutivosComponent implements OnInit {
  
  // Aquí van las variables del Dashboard (Métricas)
  clientesActivos: number = 120;
  prestamosOtorgados: number = 45;
  solicitudesEsteMes: number = 30;

  // Datos para la simulación del gráfico
  chartData = [
    { label: 'Octubre', value: 30, color: '#A0C4FF' },
    { label: 'Noviembre', value: 45, color: '#8988C1' },
    { label: 'Diciembre', value: 60, color: '#5D5B9D' },
    { label: 'Enero', value: 75, color: '#6361A2' },
  ];

  constructor() { }
  ngOnInit(): void { }
}