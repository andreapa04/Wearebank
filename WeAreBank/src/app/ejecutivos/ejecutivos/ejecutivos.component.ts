import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-ejecutivos',
  templateUrl: './ejecutivos.component.html',
  styleUrls: ['./ejecutivos.component.css']
})
export class EjecutivosComponent implements OnInit {

  usuario = 'Nombre del Usuario';
  currentYear: number;
  currentSection: string = 'dashboard';

  constructor() {
    this.currentYear = new Date().getFullYear();
  }

  ngOnInit(): void {}

  showSection(sectionName: string): void {
    this.currentSection = sectionName;
  }
}