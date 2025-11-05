import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';

@Injectable({
  providedIn: 'root'
})
export class PdfGeneratorService {

  constructor() { }

  generarEstadoCuenta(accountData: any) {
    const doc = new jsPDF();

    // Título
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Estado de Cuenta Bancario', 105, 20, { align: 'center' });

    // Información del cliente
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Cliente: ${accountData.cliente}`, 20, 40);
    doc.text(`Número de Cuenta: ${accountData.numeroCuenta}`, 20, 50);
    doc.text(`Fecha de Generación: ${new Date().toLocaleString('es-ES')}`, 20, 60);

    // Línea separadora
    doc.line(20, 65, 190, 65);

    // Encabezados de tabla
    doc.setFont('helvetica', 'bold');
    let y = 75;
    doc.text('Movimiento', 20, y);
    doc.text('Destinatario', 70, y);
    doc.text('Cantidad', 130, y);
    doc.text('Fecha', 165, y);

    // Datos de movimientos
    doc.setFont('helvetica', 'normal');
    y += 10;

    accountData.movimientos.forEach((mov: any) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }

      doc.text(mov.tipo, 20, y, { maxWidth: 45 });
      doc.text(mov.destinatario, 70, y, { maxWidth: 55 });
      
      if (mov.cantidad >= 0) {
        doc.setTextColor(0, 128, 0);
      } else {
        doc.setTextColor(255, 0, 0);
      }
      doc.text(`$${Math.abs(mov.cantidad).toFixed(2)}`, 130, y);
      
      doc.setTextColor(0, 0, 0);
      doc.text(mov.fecha, 165, y, { maxWidth: 30 });

      y += 10;
    });

    // Guardar el PDF
    doc.save(`estado_cuenta_${accountData.numeroCuenta}_${Date.now()}.pdf`);
  }
}