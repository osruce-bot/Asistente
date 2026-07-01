/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Cita, Asistente } from '../types';
import { formatPEN } from './currency';
import { formatToDDMMYYYY } from './date';

/**
 * Generates and downloads an Excel spreadsheet for the monthly payroll of an assistant
 */
export async function exportCitasToExcel(
  citas: Cita[],
  mes: string,
  asistenteNombre: string,
  totales: {
    sueldoBasico: number;
    totalBonos: number;
    totalPagar: number;
  }
) {
  const XLSX = await import('xlsx');
  // Format month name (YYYY-MM to Month YYYY)
  const parts = mes.split('-');
  const year = parts[0];
  const monthNum = parseInt(parts[1], 10);
  const nombreMeses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  const mesNombre = nombreMeses[monthNum - 1] || 'General';

  // Prepare metadata rows
  const titleRow = [`OSCAR RUSSO (RUC: 10077932823) — REPORTE DE PLANILLA Y CITAS` ];
  const subTitleRow = [`Periodo: ${mesNombre} ${year}`];
  const assistantRow = [`Colaborador: ${asistenteNombre}`];
  const dateRow = [`Generado el: ${new Date().toLocaleDateString('es-PE')} ${new Date().toLocaleTimeString('es-PE')}`];
  const emptyRow = [];

  // Table headers
  const headers = [
    'ITEM',
    'FECHA CITA',
    'HORA',
    'CLIENTE',
    'DIRECCIÓN PROPIEDAD',
    'TIPO PROPIEDAD',
    'OPERACIÓN',
    'ESTADO CITA',
    'ESTADO CIERRE',
    'MONTO BONO (S/.)'
  ];

  // Map rows
  const rows = citas.map((cita, index) => {
    return [
      index + 1,
      formatToDDMMYYYY(cita.fechaCita),
      cita.horaCita,
      cita.clienteNombre,
      cita.direccionPropiedad,
      cita.tipoPropiedad,
      cita.tipoOperacion,
      cita.estadoCita,
      cita.estadoCierre,
      cita.montoBono
    ];
  });

  // Totals Breakdown
  const totalsHeaderRow = ['', '', '', '', '', '', '', '', 'SUELDO BÁSICO FIJO:', totales.sueldoBasico];
  const totalsBonosRow = ['', '', '', '', '', '', '', '', 'TOTAL BONOS LOGRADOS:', totales.totalBonos];
  const totalsPagarRow = ['', '', '', '', '', '', '', '', 'TOTAL NETO A PAGAR S/.', totales.totalPagar];

  // Assemble all rows
  const aoaData = [
    titleRow,
    subTitleRow,
    assistantRow,
    dateRow,
    emptyRow,
    headers,
    ...rows,
    emptyRow,
    totalsHeaderRow,
    totalsBonosRow,
    totalsPagarRow
  ];

  // Create worksheet
  const worksheet = XLSX.utils.aoa_to_sheet(aoaData);

  // Set merges
  worksheet['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 4 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 4 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: 4 } }
  ];

  // Set widths
  const colWidths = [
    { wch: 6 },  // Item
    { wch: 14 }, // Fecha
    { wch: 10 }, // Hora
    { wch: 25 }, // Cliente
    { wch: 35 }, // Dirección
    { wch: 18 }, // Tipo Propiedad
    { wch: 12 }, // Operación
    { wch: 15 }, // Estado Cita
    { wch: 15 }, // Estado Cierre
    { wch: 18 }  // Monto bono
  ];
  worksheet['!cols'] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Planilla_Citas');

  const cleanName = asistenteNombre.replace(/[^a-zA-Z0-9]/g, '_');
  XLSX.writeFile(workbook, `Planilla_${cleanName}_${mesNombre}_${year}.xlsx`);
}

/**
 * Generates a beautiful PDF Payment Receipt for an assistant's monthly salary and bonuses
 */
export async function exportCitasToPDF(
  citas: Cita[],
  mes: string,
  asistente: Asistente,
  totales: {
    sueldoBasico: number;
    totalBonos: number;
    totalPagar: number;
    montoAdelantoQuincena?: number;
  }
) {
  const { jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');

  const parts = mes.split('-');
  const year = parts[0];
  const monthNum = parseInt(parts[1], 10);
  const nombreMeses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  const mesNombre = nombreMeses[monthNum - 1] || 'General';

  const doc = new jsPDF('portrait', 'pt', 'a4');

  // Corporate Color Scheme
  const navyColor = [1, 22, 64];       // Deep Navy #011640
  const blueColor = [5, 84, 242];      // Intense Blue #0554F2
  const textDark = [13, 13, 13];       // Midnight Charcoal #0D0D0D
  const bgLight = [248, 250, 252];     // slate-50

  // 1. Header Box
  doc.setFillColor(navyColor[0], navyColor[1], navyColor[2]);
  doc.rect(40, 40, 515, 60, 'F');

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text('OSCAR RUSSO — BOLETA DE LIQUIDACIÓN DE PLANILLA', 60, 68);
  
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(191, 219, 254); // blue-200
  doc.text('R.U.C. 10077932823 — CONTROL DE RECURSOS HUMANOS', 60, 84);

  // 2. Colaborador Metadata
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(navyColor[0], navyColor[1], navyColor[2]);
  doc.text('DATOS DEL COLABORADOR', 40, 130);

  // Divider line
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.setLineWidth(1);
  doc.line(40, 136, 555, 136);

  doc.setFont('Helvetica', 'bold');
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text('Nombre Completo:', 40, 155);
  doc.text('D.N.I.:', 40, 172);
  doc.text('Cargo / Rol:', 40, 189);
  doc.text('Fecha Ingreso:', 40, 206);

  doc.setFont('Helvetica', 'normal');
  doc.text(asistente.nombreCompleto, 150, 155);
  doc.text(asistente.dni, 150, 172);
  doc.text(asistente.cargo || 'Asistente de Captaciones', 150, 189);
  doc.text(formatToDDMMYYYY(asistente.fechaIngreso), 150, 206);

  // Right Column: Pago Details
  doc.setFont('Helvetica', 'bold');
  doc.text('Periodo Mensual:', 320, 155);
  doc.text('Banco Depósito:', 320, 172);
  doc.text('N° de Cuenta:', 320, 189);
  doc.text('CCI:', 320, 206);

  doc.setFont('Helvetica', 'normal');
  doc.text(`${mesNombre} de ${year}`, 430, 155);
  doc.text(asistente.banco || 'No especificado', 430, 172);
  doc.text(asistente.numeroCuenta || '--', 430, 189);
  doc.text(asistente.cci || '--', 430, 206);

  // 3. Compensation Breakdown Table/Section
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(navyColor[0], navyColor[1], navyColor[2]);
  doc.text('RESUMEN DE CONCEPTOS DE COMPENSACIÓN', 40, 240);
  doc.line(40, 246, 555, 246);

  // Concepts Box
  doc.setFillColor(bgLight[0], bgLight[1], bgLight[2]);
  doc.roundedRect(40, 255, 515, 75, 4, 4, 'F');

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text('1. Sueldo Básico Fijo Mensual (RMV de Ley Vigente):', 60, 275);
  doc.text('2. Comisión Variable (Suma de Bonos de Citas Cerradas Efectivas):', 60, 292);
  
  const hasAdelanto = typeof totales.montoAdelantoQuincena === 'number' && totales.montoAdelantoQuincena > 0;
  const labelAdelanto = hasAdelanto
    ? `3. Adelanto en Quincena (Descontado con RHe):`
    : '3. Descuentos / Retenciones autorizadas:';
  doc.text(labelAdelanto, 60, 309);

  doc.setFont('Helvetica', 'bold');
  doc.text(formatPEN(totales.sueldoBasico), 480, 275, { align: 'right' });
  doc.text(formatPEN(totales.totalBonos), 480, 292, { align: 'right' });
  const valAdelanto = hasAdelanto ? -totales.montoAdelantoQuincena! : 0;
  doc.text(formatPEN(valAdelanto), 480, 309, { align: 'right' });

  // Pagar Summary Callout Box
  doc.setFillColor(239, 246, 255); // blue-50
  doc.rect(40, 340, 515, 35, 'F');
  
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(blueColor[0], blueColor[1], blueColor[2]);
  doc.text('TOTAL NETO LIQUIDADO A TRANSFERIR:', 60, 362);
  doc.text(formatPEN(totales.totalPagar), 480, 362, { align: 'right' });

  // 4. Detalle de citas efectivas que sustentan los bonos
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(navyColor[0], navyColor[1], navyColor[2]);
  doc.text('CITAS LOGRADAS EFECTIVAS EN ESTE PERIODO', 40, 400);
  doc.line(40, 406, 555, 406);

  const tableHeaders = [
    ['Fecha', 'Cliente', 'Propiedad', 'Operación', 'Estado Cierre', 'Bono']
  ];

  const closedCitas = citas.filter(c => c.estadoCierre === 'CERRADO' || c.estadoCierre === 'LIQUIDADO');

  const tableRows = closedCitas.map(c => {
    const safeFecha = formatToDDMMYYYY(c.fechaCita);
    const safeNombre = c.clienteNombre || 'Sin nombre';
    const safeDireccion = c.direccionPropiedad || 'Sin dirección';
    return [
      safeFecha,
      safeNombre.length > 20 ? safeNombre.substring(0, 18) + '...' : safeNombre,
      safeDireccion.length > 22 ? safeDireccion.substring(0, 20) + '...' : safeDireccion,
      c.tipoOperacion,
      c.estadoCierre,
      `S/. ${c.montoBono.toFixed(2)}`
    ];
  });

  if (tableRows.length === 0) {
    tableRows.push(['--', 'Sin citas cerradas en este mes', '--', '--', '--', 'S/. 0.00']);
  }

  autoTable(doc, {
    startY: 415,
    head: tableHeaders,
    body: tableRows,
    theme: 'striped',
    headStyles: {
      fillColor: navyColor as [number, number, number],
      textColor: [255, 255, 255] as [number, number, number],
      fontSize: 8,
      fontStyle: 'bold'
    },
    bodyStyles: {
      fontSize: 8,
      textColor: textDark as [number, number, number]
    },
    columnStyles: {
      0: { cellWidth: 60 },
      1: { cellWidth: 100 },
      2: { cellWidth: 140 },
      3: { cellWidth: 65, halign: 'center' },
      4: { cellWidth: 70, halign: 'center', fontStyle: 'bold' },
      5: { cellWidth: 80, halign: 'right', fontStyle: 'bold' }
    },
    margin: { left: 40, right: 40 }
  });

  const finalY = (doc as any).lastAutoTable.finalY + 60;

  // Signatures Area
  doc.setDrawColor(203, 213, 225); // slate-300
  doc.setLineWidth(0.5);

  // Left Signature: Colaboradora
  doc.line(80, finalY, 220, finalY);
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text('FIRMA DE CONFORMIDAD', 150, finalY + 12, { align: 'center' });
  doc.setFont('Helvetica', 'normal');
  doc.text(asistente.nombreCompleto, 150, finalY + 24, { align: 'center' });
  doc.text(`D.N.I.: ${asistente.dni}`, 150, finalY + 36, { align: 'center' });

  // Right Signature: Oscar Russo
  doc.line(375, finalY, 515, finalY);
  doc.setFont('Helvetica', 'bold');
  doc.text('OSCAR RUSSO', 445, finalY + 12, { align: 'center' });
  doc.setFont('Helvetica', 'normal');
  doc.text('R.U.C. 10077932823', 445, finalY + 24, { align: 'center' });
  doc.text('Coordinador & Agente Inmobiliario Top', 445, finalY + 36, { align: 'center' });

  const cleanName = asistente.nombreCompleto.replace(/[^a-zA-Z0-9]/g, '_');
  doc.save(`Recibo_Pago_${cleanName}_${mesNombre}_${year}.pdf`);
}
