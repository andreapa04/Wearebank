import { Component, OnInit } from '@angular/core';
import { PdfGeneratorService } from '../services/pdf-generator.service';

@Component({
  selector: 'app-pdf',
  templateUrl: './pdf.component.html',
  styleUrls: ['./pdf.component.css']
})
export class PdfComponent implements OnInit {
  
  accountData: any;

  constructor(private pdfService: PdfGeneratorService) { }

  ngOnInit(): void {
    // Datos de ejemplo
    this.accountData = {
      cliente: "Juan Pérez García",
      numeroCuenta: "1234-5678-9012-3456",
      movimientos: [
        {
          tipo: "Depósito",
          destinatario: "Cuenta Propia",
          cantidad: 5000.00,
          fecha: "2025-10-29 09:30:15"
        },
        {
          tipo: "Transferencia Enviada",
          destinatario: "María López Rodríguez",
          cantidad: -1500.00,
          fecha: "2025-10-28 14:22:45"
        },
        {
          tipo: "Pago de Servicio",
          destinatario: "Compañía Eléctrica",
          cantidad: -350.50,
          fecha: "2025-10-27 10:15:30"
        }
      ]
    };
  }

  generarPDF(): void {
    this.pdfService.generarEstadoCuenta(this.accountData);
  }
}