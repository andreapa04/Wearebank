// ejecutivos.component.ts
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-ejecutivos',
  templateUrl: './ejecutivos.component.html',
  styleUrls: ['./ejecutivos.component.css']
})
export class EjecutivosComponent implements OnInit {

  // Datos del dashboard
  clientesActivos: number = 120;
  prestamosOtorgados: number = 45;
  solicitudesEsteMes: number = 30;

  // Datos para el gráfico
  chartData = [
    { label: 'Clientes', value: 50, color: '#9B8BC7' },
    { label: 'Préstamos', value: 70, color: '#7B6B95' },
    { label: 'Solicitudes', value: 85, color: '#6B5B85' },
    { label: 'Activos', value: 95, color: '#5B4B75' }
  ];

  constructor() { }

  ngOnInit(): void {
    // Aquí puedes inicializar datos o llamar servicios
    this.loadDashboardData();
  }

  // Método para cargar datos del dashboard
  loadDashboardData(): void {
    // Aquí podrías hacer llamadas a servicios para obtener datos reales
    console.log('Dashboard data loaded');
  }

  // Método para manejar clicks en navegación
  onNavClick(section: string): void {
    console.log('Navegando a:', section);
    // Aquí puedes implementar la lógica de navegación
  }

}