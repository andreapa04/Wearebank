// src/app/ejecutivos/layout/ejecutivo-layout.component.ts
import { Component, OnInit } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common'; 

@Component({
  selector: 'app-ejecutivo-layout',
  standalone: true,
  // ⬅️ Este sí necesita RouterOutlet y RouterLink para la navegación
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive], 
  templateUrl: './ejecutivo-layout.component.html', 
  styleUrls: ['./ejecutivo-layout.component.css']
})
export class EjecutivoLayoutComponent implements OnInit {
  
  usuario: string = '(usuario)'; 
  currentYear: number = new Date().getFullYear();

  ngOnInit(): void {}
}