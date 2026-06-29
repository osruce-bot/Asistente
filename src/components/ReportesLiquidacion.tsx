/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  FileText, 
  Coins, 
  Calendar, 
  Users, 
  CreditCard, 
  CheckCircle2, 
  XCircle, 
  Printer, 
  Download, 
  Clock, 
  AlertCircle,
  Briefcase,
  ChevronRight,
  Info
} from 'lucide-react';
import { Asistente, Cita, EstadoCierre, ConfigGeneral, LiquidacionMensual, AuditLog } from '../types';
import { formatPEN } from '../utils/currency';
import { exportCitasToPDF } from '../utils/export';
import { formatToDDMMYYYY } from '../utils/date';

interface ReportesLiquidacionProps {
  asistentes: Asistente[];
  citas: Cita[];
  config: ConfigGeneral;
  liquidaciones?: LiquidacionMensual[];
  auditLogs?: AuditLog[];
  onLiquidateAppointments: (asistenteId: string, mes: string, citasIds: string[], sueldoBasico: number, totalBonos: number) => void;
  onUpdateLiquidacion?: (liq: LiquidacionMensual) => void;
  isSyncing: boolean;
}

export default function ReportesLiquidacion({
  asistentes,
  citas,
  config,
  liquidaciones = [],
  auditLogs = [],
  onLiquidateAppointments,
  onUpdateLiquidacion,
  isSyncing
}: ReportesLiquidacionProps) {
  // Month selector (default to current month YYYY-MM)
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    return `${d.getFullYear()}-${mm}`;
  });

  const [selectedAsistenteId, setSelectedAsistenteId] = useState('TODOS');
  const [receiptAsistente, setReceiptAsistente] = useState<Asistente | null>(null);
  const [receiptDetails, setReceiptDetails] = useState<{
    mes: string;
    sueldoBasico: number;
    bonosList: Cita[];
    totalBonos: number;
    totalPagar: number;
  } | null>(null);

  // Custom alert/confirm states for iframe compatibility
  const [confirmLiquidation, setConfirmLiquidation] = useState<{
    asistente: Asistente;
    citas: Cita[];
    sueldo: number;
    bonos: number;
  } | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Filter active assistants
  const activeAsistentes = asistentes.filter(as => as.activo);

  // Group calculations by assistant for the selected month
  const calculatePayrollForAssistant = (asistente: Asistente) => {
    // A closed appointment belongs to this selectedMonth if its fechaCierre starts with selectedMonth (e.g. YYYY-MM)
    const assistantCitas = citas.filter(c => 
      c.asistenteId === asistente.id &&
      c.fechaCierre && 
      c.fechaCierre.startsWith(selectedMonth)
    );

    const closedCitas = assistantCitas.filter(c => c.estadoCierre === EstadoCierre.CERRADO);
    const liquidatedCitas = assistantCitas.filter(c => c.estadoCierre === EstadoCierre.LIQUIDADO);

    const closedBonosSum = closedCitas.reduce((sum, c) => sum + c.montoBono, 0);
    const liquidatedBonosSum = liquidatedCitas.reduce((sum, c) => sum + c.montoBono, 0);

    return {
      sueldoBasico: asistente.sueldoBasico,
      closedCitas,
      liquidatedCitas,
      pendingBonosAmount: closedBonosSum,
      liquidatedBonosAmount: liquidatedBonosSum,
      totalPendingToPay: asistente.sueldoBasico + closedBonosSum,
      totalLiquidatedPaid: asistente.sueldoBasico + liquidatedBonosSum,
    };
  };

  // Compile full payroll for all active assistants
  const payrollList = activeAsistentes.map(as => {
    const calcs = calculatePayrollForAssistant(as);
    return {
      asistente: as,
      ...calcs
    };
  }).filter(p => selectedAsistenteId === 'TODOS' || p.asistente.id === selectedAsistenteId);

  // Handle Action: Process Payment / Liquidate for a specific assistant
  const handleLiquidate = (as: Asistente, closedCitas: Cita[], sueldo: number, bonos: number) => {
    if (closedCitas.length === 0) {
      setNotification({
        message: 'No hay bonos cerrados pendientes de liquidar para este colaborador en el mes seleccionado.',
        type: 'error'
      });
      setTimeout(() => setNotification(null), 4000);
      return;
    }

    setConfirmLiquidation({
      asistente: as,
      citas: closedCitas,
      sueldo,
      bonos
    });
  };

  const executeLiquidation = () => {
    if (!confirmLiquidation) return;
    const { asistente, citas: closedCitas, sueldo, bonos } = confirmLiquidation;
    const ids = closedCitas.map(c => c.id);
    onLiquidateAppointments(asistente.id, selectedMonth, ids, sueldo, bonos);
    setConfirmLiquidation(null);
    setNotification({
      message: `¡Liquidación registrada de forma exitosa para ${asistente.nombreCompleto}!`,
      type: 'success'
    });
    setTimeout(() => setNotification(null), 4000);
  };

  // Generate Receipt Modal view
  const handleShowReceipt = (as: Asistente) => {
    const calcs = calculatePayrollForAssistant(as);
    const combinedCitas = [...calcs.closedCitas, ...calcs.liquidatedCitas];
    
    setReceiptAsistente(as);
    setReceiptDetails({
      mes: selectedMonth,
      sueldoBasico: as.sueldoBasico,
      bonosList: combinedCitas,
      totalBonos: calcs.pendingBonosAmount + calcs.liquidatedBonosAmount,
      totalPagar: as.sueldoBasico + calcs.pendingBonosAmount + calcs.liquidatedBonosAmount
    });
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    if (!receiptAsistente || !receiptDetails) return;
    
    await exportCitasToPDF(
      receiptDetails.bonosList,
      receiptDetails.mes,
      receiptAsistente,
      {
        sueldoBasico: receiptDetails.sueldoBasico,
        totalBonos: receiptDetails.totalBonos,
        totalPagar: receiptDetails.totalPagar
      }
    );
  };

  const handleDownloadPastPdf = async (liq: LiquidacionMensual) => {
    const as = asistentes.find(a => a.id === liq.asistenteId);
    if (!as) return;

    // Filter citas that were liquidated in this period
    const liquidatedCitas = citas.filter(c => liq.citasLiquidadasIds?.includes(c.id));

    await exportCitasToPDF(
      liquidatedCitas,
      liq.mes,
      as,
      {
        sueldoBasico: liq.sueldoBasico,
        totalBonos: liq.totalBonos,
        totalPagar: liq.montoTotal
      }
    );
  };

  const handleDownloadTxtTransfer = () => {
    if (!receiptAsistente || !receiptDetails) return;
    
    // Generate simple bank transfer instruction format
    const content = `========================================================
SOLICITUD DE TRANSFERENCIA BANCARIA - OSCAR RUSSO (RUC: 10077932823)
========================================================
FECHA DE SOLICITUD: ${new Date().toISOString().split('T')[0]}
MES LIQUIDADO: ${receiptDetails.mes}
--------------------------------------------------------
BENEFICIARIO: ${receiptAsistente.nombreCompleto}
DNI: ${receiptAsistente.dni}
CARGO: ${receiptAsistente.cargo}
BANCO: ${receiptAsistente.banco}
TIPO CUENTA: ${receiptAsistente.tipoCuenta}
NÚMERO DE CUENTA: ${receiptAsistente.numeroCuenta}
CCI: ${receiptAsistente.cci || 'No registrado'}
--------------------------------------------------------
DETALLE DEL ABONO:
Sueldo Fijo Mensual (RMV): S/. ${receiptDetails.sueldoBasico.toFixed(2)}
Bonos de Cita Lograda:     S/. ${receiptDetails.totalBonos.toFixed(2)}
========================================================
MONTO NETO A TRANSFERIR:   S/. ${receiptDetails.totalPagar.toFixed(2)}
========================================================
`;
    
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `transferencia_${receiptAsistente.nombreCompleto.replace(/\s+/g, '_')}_${receiptDetails.mes}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-fade-in" id="reportes_liquidacion_root">
      
      {/* Top filter and setup header bar */}
      <div className="bg-white p-4 rounded-md border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4" id="payroll_filters">
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-tight flex items-center gap-1.5">
            <Coins className="w-5 h-5 text-primary" />
            Planilla Mensual y Liquidación de Bonos
          </h3>
          <p className="text-xs text-slate-500">
            Filtra el mes de cierre para consolidar la Remuneración Mínima Vital (RMV) fija y liquidar los bonos por citas cerradas.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Month picker */}
          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-slate-400" />
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="py-1.5 px-3 text-xs bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary text-slate-800 font-bold font-mono"
            />
          </div>

          {/* Assistant selector */}
          <div>
            <select
              value={selectedAsistenteId}
              onChange={(e) => setSelectedAsistenteId(e.target.value)}
              className="py-1.5 px-3 text-xs bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none text-slate-800"
            >
              <option value="TODOS">Todos los colaboradores</option>
              {activeAsistentes.map(as => (
                <option key={as.id} value={as.id}>{as.nombreCompleto}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Grid: Payroll detail list & receipt preview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Payroll calculation rows */}
        <div className="lg:col-span-2 space-y-4">
          
          <div className="bg-white rounded-md border border-slate-200 shadow-sm overflow-hidden" id="payroll_table_card">
            <div className="p-4 bg-navy border-b border-navy/20 text-white flex justify-between items-center">
              <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-4 h-4 text-blue-400" />
                Resumen de Haberes - Periodo {selectedMonth}
              </span>
              <span className="text-[10px] font-mono bg-navy/60 px-2 py-0.5 rounded border border-slate-600">
                PAGO NETO DE PLANILLA
              </span>
            </div>

            {payrollList.length === 0 ? (
              <div className="p-10 text-center text-slate-500">
                <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-semibold">No hay colaboradores activos registrados para este reporte.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {payrollList.map(({ asistente, sueldoBasico, closedCitas, liquidatedCitas, pendingBonosAmount, liquidatedBonosAmount, totalPendingToPay, totalLiquidatedPaid }) => {
                  const hasPendingBonos = closedCitas.length > 0;
                  const totalBonosPeriod = pendingBonosAmount + liquidatedBonosAmount;
                  const grandTotalPeriod = sueldoBasico + totalBonosPeriod;

                  return (
                    <div key={asistente.id} className="p-4 hover:bg-slate-50 transition-colors space-y-3" id={`payroll_item_${asistente.id}`}>
                      {/* Name & Account Details */}
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                        <div>
                          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-tight">{asistente.nombreCompleto}</h4>
                          <p className="text-[10px] text-slate-400 font-mono">DNI: {asistente.dni} • Cargo: {asistente.cargo}</p>
                        </div>
                        <div className="text-right font-mono text-[10px] text-slate-500">
                          <span className="font-bold text-slate-700">{asistente.banco} ({asistente.tipoCuenta})</span> • Cuenta: {asistente.numeroCuenta}
                          {asistente.cci && <div className="text-[9px] text-slate-400">CCI: {asistente.cci}</div>}
                        </div>
                      </div>

                      {/* Calculations Details Grid */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 bg-slate-50 p-3 rounded-md border border-slate-200">
                        {/* Fixed Salary RMV */}
                        <div>
                          <span className="text-[9px] uppercase font-bold text-slate-400 block">Sueldo Fijo (RMV)</span>
                          <span className="text-xs font-mono font-bold text-slate-800">{formatPEN(sueldoBasico)}</span>
                        </div>

                        {/* Liquidated Bonos */}
                        <div>
                          <span className="text-[9px] uppercase font-bold text-emerald-600 block">Bonos Liquidados</span>
                          <span className="text-xs font-mono font-bold text-emerald-600">+{formatPEN(liquidatedBonosAmount)}</span>
                          <span className="text-[8px] text-slate-400 block font-sans">({liquidatedCitas.length} citas)</span>
                        </div>

                        {/* Pending Bonos */}
                        <div>
                          <span className="text-[9px] uppercase font-bold text-primary block">Bonos Pendientes</span>
                          <span className="text-xs font-mono font-bold text-primary">+{formatPEN(pendingBonosAmount)}</span>
                          <span className="text-[8px] text-slate-400 block font-sans">({closedCitas.length} citas cerradas)</span>
                        </div>

                        {/* Total To Pay / Paid */}
                        <div>
                          <span className="text-[9px] uppercase font-bold text-slate-800 block">Monto Total Periodo</span>
                          <span className="text-xs font-mono font-bold text-slate-900">{formatPEN(grandTotalPeriod)}</span>
                          <span className="text-[8px] text-slate-400 block font-sans">
                            {hasPendingBonos ? '⚠️ Pendiente de cierre' : '✅ Planilla cerrada'}
                          </span>
                        </div>
                      </div>

                      {/* Action buttons inside item */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                        <p className="text-[10px] text-slate-500 font-sans italic flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          Último día de ingreso: {formatToDDMMYYYY(asistente.fechaIngreso)}
                        </p>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleShowReceipt(asistente)}
                            className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-600 bg-white hover:bg-slate-100 border border-slate-205 rounded transition-all cursor-pointer shadow-sm"
                          >
                            Ver Boleta de Pago
                          </button>

                          {hasPendingBonos && (
                            <button
                              onClick={() => handleLiquidate(asistente, closedCitas, sueldoBasico, pendingBonosAmount)}
                              className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white bg-primary hover:bg-primary/95 rounded transition-all cursor-pointer shadow-sm flex items-center gap-1"
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              Liquidar S/. {pendingBonosAmount.toFixed(2)}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick strategic tip card */}
          <div className="p-4 bg-slate-100 border border-slate-200 rounded-md flex gap-3 text-xs text-slate-600">
            <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-slate-800">Estructura Salarial Híbrida - Oscar Russo:</p>
              <p className="mt-0.5">
                Al liquidar la planilla del mes, se procesa de forma integrada el <strong>Sueldo Mínimo Fijo ({formatPEN(config.rmvVigente)})</strong> más los bonos de las citas registradas en estado "Cerrado". Al presionar el botón "Liquidar", las citas pasarán automáticamente al estado "Liquidado", asegurando un estricto orden contable interno y previniendo pagos duplicados.
              </p>
            </div>
          </div>

        </div>

        {/* Right Column: Receipt print preview */}
        <div className="lg:col-span-1">
          {receiptAsistente && receiptDetails ? (
            <div className="bg-white rounded-md border border-slate-200 shadow-sm overflow-hidden sticky top-20" id="receipt_preview_card">
              <div className="p-4 bg-navy border-b border-navy/20 text-white flex justify-between items-center">
                <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-blue-400" />
                  Boleta de Pago Virtual
                </span>
                <button
                  onClick={() => { setReceiptAsistente(null); setReceiptDetails(null); }}
                  className="text-slate-400 hover:text-white font-bold cursor-pointer text-xs"
                >
                  ✕
                </button>
              </div>

              {/* Printable Area Wrapper */}
              <div className="p-5 space-y-4 text-xs font-sans text-slate-700" id="print_receipt_area">
                
                {/* Receipt Header */}
                <div className="text-center pb-3 border-b border-slate-200">
                  <h4 className="text-sm font-bold uppercase text-slate-900 tracking-tight">OSCAR RUSSO</h4>
                  <p className="text-[9px] text-slate-500 font-medium">Lima, Perú • RUC: 10077932823</p>
                  <p className="text-[10px] font-bold text-primary uppercase mt-1">RECIBO DE HABERES Y BONOS - ASISTENTES</p>
                </div>

                {/* Assistant metadata */}
                <div className="space-y-1.5 bg-slate-50 p-2.5 rounded border border-slate-150">
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-semibold uppercase text-[9px]">Colaborador:</span>
                    <span className="font-bold text-slate-800">{receiptAsistente.nombreCompleto}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-semibold uppercase text-[9px]">DNI:</span>
                    <span className="font-mono font-bold text-slate-800">{receiptAsistente.dni}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-semibold uppercase text-[9px]">Cargo / Rol:</span>
                    <span className="font-bold text-slate-800">{receiptAsistente.cargo}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-semibold uppercase text-[9px]">Periodo:</span>
                    <span className="font-mono font-bold text-slate-800 uppercase">{receiptDetails.mes}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-semibold uppercase text-[9px]">Vía de Pago:</span>
                    <span className="font-bold text-slate-800">{receiptAsistente.banco} N° {receiptAsistente.numeroCuenta}</span>
                  </div>
                </div>

                {/* Details list of pay items */}
                <div className="space-y-2">
                  <h5 className="font-bold text-[10px] uppercase text-slate-500 tracking-wider">Conceptos de Liquidación</h5>
                  
                  <div className="divide-y divide-slate-100 border-t border-b border-slate-200">
                    {/* Fixed salary item */}
                    <div className="py-2 flex justify-between">
                      <div>
                        <span className="font-bold text-slate-800 block">Sueldo Fijo Mensual</span>
                        <span className="text-[9px] text-slate-400">Remuneración Mínima Vital de Ley</span>
                      </div>
                      <span className="font-mono font-bold text-slate-800 self-center">{formatPEN(receiptDetails.sueldoBasico)}</span>
                    </div>

                    {/* Bonos detailed list inside the month */}
                    <div className="py-2 space-y-1">
                      <div className="flex justify-between">
                        <span className="font-bold text-slate-800">Bonificaciones por Cierre</span>
                        <span className="font-mono font-bold text-emerald-600">+{formatPEN(receiptDetails.totalBonos)}</span>
                      </div>
                      
                      {receiptDetails.bonosList.length === 0 ? (
                        <p className="text-[9px] text-slate-400 italic">No se registraron bonos por citas cerradas en este periodo.</p>
                      ) : (
                        <div className="pl-2 space-y-1 max-h-32 overflow-y-auto pr-1">
                          {receiptDetails.bonosList.map((c) => (
                            <div key={c.id} className="flex justify-between text-[9px] text-slate-500 font-mono">
                              <span className="truncate max-w-[150px]">{c.clienteNombre} ({c.tipoOperacion})</span>
                              <span className="font-bold text-slate-700">S/. {c.montoBono.toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Grand Payout Total */}
                <div className="p-3 bg-navy rounded text-white flex justify-between items-center">
                  <div>
                    <span className="text-[10px] uppercase text-slate-300 block font-bold tracking-wider">Monto Neto a Pagar</span>
                    <span className="text-[8px] text-slate-400">Total Soles (PEN)</span>
                  </div>
                  <span className="text-base font-bold font-mono">{formatPEN(receiptDetails.totalPagar)}</span>
                </div>

                {/* Signatures */}
                <div className="pt-8 grid grid-cols-2 gap-4 text-center text-[8px] font-sans">
                  <div className="border-t border-slate-300 pt-1.5 text-slate-500 font-medium">
                    Firma Coordinador<br />
                    Oscar Russo
                  </div>
                  <div className="border-t border-slate-300 pt-1.5 text-slate-500 font-medium">
                    Firma Colaborador<br />
                    DNI: {receiptAsistente.dni}
                  </div>
                </div>

              </div>

              {/* Action utilities bar */}
              <div className="p-4 bg-slate-50 border-t border-slate-200 flex gap-2">
                <button
                  onClick={handleDownloadPdf}
                  className="flex-1 flex items-center justify-center gap-1 py-2 px-2 bg-primary hover:bg-primary/95 text-white rounded text-[11px] font-bold uppercase tracking-wider cursor-pointer shadow-sm transition-colors"
                >
                  <FileText className="w-3.5 h-3.5" />
                  Descargar PDF
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 p-6 rounded-md border border-slate-200 text-center space-y-3 sticky top-20" id="receipt_placeholder">
              <FileText className="w-10 h-10 text-slate-300 mx-auto" />
              <h4 className="text-xs font-bold text-slate-700 uppercase">Previsualización de Boleta</h4>
              <p className="text-xs text-slate-500">
                Selecciona "Ver Boleta de Pago" al costado de cualquier colaborador para generar su liquidación contable, previsualizar su recibo formal y descargar las instrucciones de transferencia bancaria.
              </p>
            </div>
          )}
        </div>

      </div>

      {/* Control de Recibos por Honorarios (RHe) y Liquidaciones Procesadas */}
      <div className="bg-white rounded-md border border-slate-200 shadow-sm overflow-hidden" id="past_liquidations_card">
        <div className="p-4 bg-navy border-b border-navy/20 text-white flex justify-between items-center">
          <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-blue-400" />
            Control de Recibos por Honorarios (RHe) y Liquidaciones Procesadas
          </span>
          <span className="text-[10px] bg-navy/60 px-2 py-0.5 rounded border border-slate-600 font-mono">
            Total Registros: {liquidaciones.length}
          </span>
        </div>

        <div className="p-5 space-y-4">
          <p className="text-xs text-slate-500">
            A continuación se listan las planillas de haberes que han sido cerradas y pagadas en el sistema. Puedes marcar y controlar de manera estricta cuándo el colaborador ha entregado formalmente su <strong>Recibo por Honorarios (RHe)</strong> para efectos de control tributario.
          </p>

          {liquidaciones.length === 0 ? (
            <div className="text-center py-8 text-slate-400 border border-dashed border-slate-200 rounded-md">
              <FileText className="w-8 h-8 mx-auto text-slate-300 mb-2" />
              <p className="text-xs">No se registran planillas de liquidación cerradas en el sistema.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-505 font-bold uppercase tracking-wider text-[10px]">
                    <th className="p-3">Periodo</th>
                    <th className="p-3">Colaborador</th>
                    <th className="p-3">Sueldo Básico (RMV)</th>
                    <th className="p-3">Total Bonos</th>
                    <th className="p-3">Monto Pagar</th>
                    <th className="p-3">Banco / Cuenta de Abono</th>
                    <th className="p-3 text-center">Boleta PDF</th>
                    <th className="p-3 text-center">Recibo Honorarios</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {liquidaciones.map((liq) => (
                    <tr key={liq.id} className="hover:bg-slate-50/50">
                      <td className="p-3 font-mono font-bold text-slate-900">{liq.mes}</td>
                      <td className="p-3 font-semibold text-slate-800">{liq.asistenteNombre}</td>
                      <td className="p-3 font-mono">{formatPEN(liq.sueldoBasico)}</td>
                      <td className="p-3 font-mono text-green-600 font-medium">+{formatPEN(liq.totalBonos)}</td>
                      <td className="p-3 font-mono font-bold text-slate-900">{formatPEN(liq.montoTotal)}</td>
                      <td className="p-3">
                        <span className="font-semibold block">{liq.banco}</span>
                        <span className="text-[10px] text-slate-500 font-mono block">Cuenta: {liq.numeroCuenta}</span>
                      </td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => handleDownloadPastPdf(liq)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-colors"
                          title="Descargar PDF de Boleta"
                        >
                          <FileText className="w-3.5 h-3.5 text-primary" />
                          PDF
                        </button>
                      </td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => {
                            if (onUpdateLiquidacion) {
                              onUpdateLiquidacion({
                                ...liq,
                                reciboHonorariosEntregado: !liq.reciboHonorariosEntregado
                              });
                            }
                          }}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                            liq.reciboHonorariosEntregado
                              ? 'bg-green-550 border-green-200 text-green-700 bg-green-50'
                              : 'bg-slate-100 border-slate-200 text-slate-500 hover:bg-slate-200'
                          }`}
                        >
                          {liq.reciboHonorariosEntregado ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                              Recibido RHe ✓
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3.5 h-3.5 text-slate-400" />
                              Pendiente RHe
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Simplified Audit Log Card */}
      <div className="bg-white rounded-md border border-slate-200 shadow-sm overflow-hidden" id="audit_log_card">
        <div className="p-4 bg-navy border-b border-navy/20 text-white flex justify-between items-center">
          <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-blue-400" />
            Bitácora de Auditoría de Acciones Críticas
          </span>
          <span className="text-[10px] bg-navy/60 px-2 py-0.5 rounded border border-slate-600 font-mono">
            Total Registros: {auditLogs.length}
          </span>
        </div>

        <div className="p-5 space-y-4">
          <p className="text-xs text-slate-500">
            Historial simplificado y ordenado cronológicamente de las operaciones críticas realizadas en el sistema (tales como la liquidación de citas y control de entrega de Recibos por Honorarios).
          </p>

          {auditLogs.length === 0 ? (
            <div className="text-center py-8 text-slate-400 border border-dashed border-slate-200 rounded-md">
              <Clock className="w-8 h-8 mx-auto text-slate-300 mb-2" />
              <p className="text-xs">No se registran acciones críticas en el sistema aún.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                    <th className="p-3">Fecha y Hora</th>
                    <th className="p-3">Operación</th>
                    <th className="p-3">Detalle del Registro</th>
                    <th className="p-3">Monto Relacionado</th>
                    <th className="p-3">Usuario Ejecutor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {auditLogs.map((log) => {
                    const dateObj = new Date(log.timestamp);
                    const formattedDate = !isNaN(dateObj.getTime())
                      ? `${dateObj.toLocaleDateString('es-PE')} ${dateObj.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`
                      : '--';

                    return (
                      <tr key={log.id} className="hover:bg-slate-50/50">
                        <td className="p-3 font-mono font-medium text-slate-500 whitespace-nowrap">
                          {formattedDate}
                        </td>
                        <td className="p-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                            log.action === 'LIQUIDAR_CITAS'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}>
                            {log.action === 'LIQUIDAR_CITAS' ? 'Liquidación' : 'RHe Cambio'}
                          </span>
                        </td>
                        <td className="p-3 font-medium text-slate-800">
                          {log.details}
                        </td>
                        <td className="p-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                          {log.monto !== undefined ? formatPEN(log.monto) : '--'}
                        </td>
                        <td className="p-3 text-slate-500 font-medium">
                          {log.usuario}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Custom Confirmation Modal */}
      {confirmLiquidation && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-md border border-slate-200 shadow-xl max-w-md w-full overflow-hidden">
            <div className="p-4 bg-navy text-white flex justify-between items-center">
              <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Coins className="w-4 h-4 text-blue-400" />
                Confirmar Registro de Pago
              </span>
              <button 
                onClick={() => setConfirmLiquidation(null)}
                className="text-slate-400 hover:text-white font-bold text-xs"
              >
                ✕
              </button>
            </div>
            
            <div className="p-5 space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">
                ¿Confirmas que deseas registrar el pago de haberes y liquidar los bonos para <strong>{confirmLiquidation.asistente.nombreCompleto}</strong> correspondiente al periodo <strong>{selectedMonth}</strong>?
              </p>

              <div className="bg-slate-50 p-3.5 rounded border border-slate-150 space-y-2 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-500">Sueldo Fijo (RMV):</span>
                  <span className="font-bold text-slate-800">{formatPEN(confirmLiquidation.sueldo)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Bonos por Citas:</span>
                  <span className="font-bold text-green-600">+{formatPEN(confirmLiquidation.bonos)}</span>
                </div>
                <div className="border-t border-slate-200 pt-2 flex justify-between font-bold text-slate-900">
                  <span>Monto Neto Total:</span>
                  <span>{formatPEN(confirmLiquidation.sueldo + confirmLiquidation.bonos)}</span>
                </div>
              </div>

              <p className="text-[10px] text-slate-500 italic">
                * Al confirmar, las {confirmLiquidation.citas.length} citas en estado "Cerrado" pasarán automáticamente a "Liquidado" para este mes.
              </p>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-150 flex justify-end gap-2.5">
              <button
                onClick={() => setConfirmLiquidation(null)}
                className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-slate-600 bg-white hover:bg-slate-100 border border-slate-200 rounded transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={executeLiquidation}
                className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-white bg-primary hover:bg-primary/95 rounded shadow-sm transition-colors cursor-pointer"
              >
                Registrar Pago
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Notification Toast */}
      {notification && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 p-4 rounded-md shadow-lg border animate-fade-in bg-white border-slate-200 max-w-sm">
          <div className={`p-1 rounded-full shrink-0 ${notification.type === 'success' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
          </div>
          <div className="text-xs font-medium text-slate-800 flex-1 leading-normal">{notification.message}</div>
          <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-slate-600 shrink-0 font-bold ml-1 text-xs">✕</button>
        </div>
      )}

    </div>
  );
}
