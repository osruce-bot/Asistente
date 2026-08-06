/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
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
  Info,
  Trash2,
  Edit2,
  Save,
  Undo2
} from 'lucide-react';
import { Asistente, Cita, EstadoCierre, ConfigGeneral, LiquidacionMensual, AuditLog } from '../types';
import { formatPEN } from '../utils/currency';
import { exportCitasToPDF } from '../utils/export';
import { formatToDDMMYYYY } from '../utils/date';
import { capitalizeWords } from '../utils/string';

interface ReportesLiquidacionProps {
  asistentes: Asistente[];
  citas: Cita[];
  config: ConfigGeneral;
  liquidaciones?: LiquidacionMensual[];
  auditLogs?: AuditLog[];
  onLiquidateAppointments: (
    asistenteId: string,
    mes: string,
    citasIds: string[],
    sueldoBasico: number,
    totalBonos: number,
    montoAdelanto?: number,
    reciboAdelantoEntregado?: boolean
  ) => void;
  onUpdateLiquidacion?: (liq: LiquidacionMensual) => void;
  onDeleteLiquidacion?: (liqId: string) => void;
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
  onDeleteLiquidacion,
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
    montoAdelantoQuincena?: number;
    reciboAdelantoEntregado?: boolean;
  } | null>(null);

  // Custom alert/confirm states for iframe compatibility
  const [confirmLiquidation, setConfirmLiquidation] = useState<{
    asistente: Asistente;
    citas: Cita[];
    sueldo: number;
    bonos: number;
  } | null>(null);
  const [liqMontoAdelanto, setLiqMontoAdelanto] = useState<number>(0);
  const [liqReciboAdelanto, setLiqReciboAdelanto] = useState<boolean>(false);
  const [preLiquidationAdvances, setPreLiquidationAdvances] = useState<{[asistenteId: string]: number}>({});
  const [preLiquidationRecibos, setPreLiquidationRecibos] = useState<{[asistenteId: string]: boolean}>({});
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Inline editing state for liquidations
  const [editingLiqId, setEditingLiqId] = useState<string | null>(null);
  const [editSueldo, setEditSueldo] = useState<number>(0);
  const [editBonos, setEditBonos] = useState<number>(0);
  const [editAdelanto, setEditAdelanto] = useState<number>(0);
  const [editReciboAdelanto, setEditReciboAdelanto] = useState<boolean>(false);
  const [editBanco, setEditBanco] = useState<string>('');
  const [editCuenta, setEditCuenta] = useState<string>('');
  const [editCci, setEditCci] = useState<string>('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const startEditing = (liq: LiquidacionMensual) => {
    setEditingLiqId(liq.id);
    setEditSueldo(liq.sueldoBasico);
    setEditBonos(liq.totalBonos);
    setEditAdelanto(liq.montoAdelantoQuincena || 0);
    setEditReciboAdelanto(!!liq.reciboAdelantoEntregado);
    setEditBanco(liq.banco || '');
    setEditCuenta(liq.numeroCuenta || '');
    setEditCci(liq.cci || '');
  };

  const cancelEditing = () => {
    setEditingLiqId(null);
  };

  const saveEditing = (liq: LiquidacionMensual) => {
    if (onUpdateLiquidacion) {
      onUpdateLiquidacion({
        ...liq,
        sueldoBasico: editSueldo,
        totalBonos: editBonos,
        montoAdelantoQuincena: editAdelanto,
        reciboAdelantoEntregado: editReciboAdelanto,
        montoTotal: editSueldo + editBonos - editAdelanto,
        banco: editBanco,
        numeroCuenta: editCuenta,
        cci: editCci
      });
      setNotification({ message: 'Registro de liquidación actualizado con éxito', type: 'success' });
      setTimeout(() => setNotification(null), 3000);
    }
    setEditingLiqId(null);
  };

  const handleDeleteClick = (liqId: string) => {
    setConfirmDeleteId(liqId);
  };

  const cancelDelete = () => {
    setConfirmDeleteId(null);
  };

  const confirmDelete = (liqId: string) => {
    if (onDeleteLiquidacion) {
      onDeleteLiquidacion(liqId);
      setNotification({ message: 'Registro de liquidación eliminado con éxito', type: 'success' });
      setTimeout(() => setNotification(null), 3000);
    }
    setConfirmDeleteId(null);
  };

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

  // Sync virtual pay stub details reactively
  useEffect(() => {
    if (receiptAsistente) {
      const calcs = calculatePayrollForAssistant(receiptAsistente);
      const combinedCitas = [...calcs.closedCitas, ...calcs.liquidatedCitas];
      
      const existingLiq = liquidaciones.find(l => l.asistenteId === receiptAsistente.id && l.mes === selectedMonth);
      const adelanto = existingLiq ? (existingLiq.montoAdelantoQuincena || 0) : (preLiquidationAdvances[receiptAsistente.id] || 0);
      const reciboEntregado = existingLiq ? !!existingLiq.reciboAdelantoEntregado : !!preLiquidationRecibos[receiptAsistente.id];
      
      setReceiptDetails({
        mes: selectedMonth,
        sueldoBasico: receiptAsistente.sueldoBasico,
        bonosList: combinedCitas,
        totalBonos: calcs.pendingBonosAmount + calcs.liquidatedBonosAmount,
        totalPagar: receiptAsistente.sueldoBasico + calcs.pendingBonosAmount + calcs.liquidatedBonosAmount - adelanto,
        montoAdelantoQuincena: adelanto,
        reciboAdelantoEntregado: reciboEntregado
      });
    } else {
      setReceiptDetails(null);
    }
  }, [receiptAsistente, liquidaciones, preLiquidationAdvances, preLiquidationRecibos, selectedMonth, citas]);

  // Save or Update Adelanto de Quincena explicitly
  const handleSaveAdelanto = (asistente: Asistente, monto: number, reciboEntregado: boolean) => {
    const existingLiq = liquidaciones.find(l => l.asistenteId === asistente.id && l.mes === selectedMonth);
    const liqId = existingLiq?.id || `liq-${asistente.id}-${selectedMonth}`;

    const newLiq: LiquidacionMensual = {
      id: liqId,
      asistenteId: asistente.id,
      asistenteNombre: asistente.nombreCompleto,
      mes: selectedMonth,
      sueldoBasico: asistente.sueldoBasico,
      totalBonos: existingLiq?.totalBonos || 0,
      montoAdelantoQuincena: monto,
      reciboAdelantoEntregado: reciboEntregado,
      fechaPagoAdelanto: existingLiq?.fechaPagoAdelanto || new Date().toISOString().split('T')[0],
      estadoAdelanto: monto > 0 ? 'PAGADO' : 'PENDIENTE',
      montoTotal: (existingLiq?.sueldoBasico || asistente.sueldoBasico) + (existingLiq?.totalBonos || 0) - monto,
      fechaPago: existingLiq?.fechaPago || new Date().toISOString().split('T')[0],
      estado: existingLiq?.estado || 'PENDIENTE',
      citasLiquidadasIds: existingLiq?.citasLiquidadasIds || [],
      banco: existingLiq?.banco || asistente.banco || '--',
      numeroCuenta: existingLiq?.numeroCuenta || asistente.numeroCuenta || '--',
      cci: existingLiq?.cci || asistente.cci || '--',
      reciboHonorariosEntregado: existingLiq?.reciboHonorariosEntregado || false
    };

    if (onUpdateLiquidacion) {
      onUpdateLiquidacion(newLiq);
    }

    setPreLiquidationAdvances(prev => ({ ...prev, [asistente.id]: monto }));
    setPreLiquidationRecibos(prev => ({ ...prev, [asistente.id]: reciboEntregado }));

    setNotification({
      message: `Adelanto de quincena por ${formatPEN(monto)} registrado y guardado para ${asistente.nombreCompleto}.`,
      type: 'success'
    });
    setTimeout(() => setNotification(null), 3500);
  };

  // Handle Action: Process Payment / Liquidate for a specific assistant
  const handleLiquidate = (as: Asistente, closedCitas: Cita[], sueldo: number, bonos: number) => {
    const existingLiq = liquidaciones.find(l => l.asistenteId === as.id && l.mes === selectedMonth);
    const initialAdelanto = existingLiq?.montoAdelantoQuincena !== undefined 
      ? existingLiq.montoAdelantoQuincena 
      : (preLiquidationAdvances[as.id] || 0);
    const initialRecibo = existingLiq?.reciboAdelantoEntregado !== undefined 
      ? !!existingLiq.reciboAdelantoEntregado 
      : !!preLiquidationRecibos[as.id];

    setLiqMontoAdelanto(initialAdelanto);
    setLiqReciboAdelanto(initialRecibo);
    setConfirmLiquidation({
      asistente: as,
      citas: closedCitas,
      sueldo,
      bonos
    });
  };

  const executeLiquidation = () => {
    if (!confirmLiquidation) return;
    try {
      const { asistente, citas: closedCitas, sueldo, bonos } = confirmLiquidation;
      const ids = closedCitas.map(c => c.id);
      onLiquidateAppointments(asistente.id, selectedMonth, ids, sueldo, bonos, liqMontoAdelanto, liqReciboAdelanto);
      setConfirmLiquidation(null);
      setNotification({
        message: `¡Liquidación registrada de forma exitosa para ${asistente.nombreCompleto}!`,
        type: 'success'
      });
      setTimeout(() => setNotification(null), 4000);
    } catch (err) {
      console.error('Error al liquidar planilla:', err);
      setNotification({
        message: 'Ocurrió un inconveniente al procesar la liquidación. Inténtalo de nuevo.',
        type: 'error'
      });
      setTimeout(() => setNotification(null), 5000);
    }
  };

  // Generate Receipt Modal view
  const handleShowReceipt = (as: Asistente) => {
    setReceiptAsistente(as);
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
        totalPagar: receiptDetails.totalPagar,
        montoAdelantoQuincena: receiptDetails.montoAdelantoQuincena
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
        totalPagar: liq.montoTotal,
        montoAdelantoQuincena: liq.montoAdelantoQuincena
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
Adelanto de Quincena:      S/. -${(receiptDetails.montoAdelantoQuincena || 0).toFixed(2)}
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
      <div className="bg-[#111A2E] p-4 rounded-md border border-[#1E2D4A] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4" id="payroll_filters">
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-slate-100 uppercase tracking-tight flex items-center gap-1.5">
            <Coins className="w-5 h-5 text-blue-400" />
            Planilla Mensual y Liquidación de Bonos
          </h3>
          <p className="text-xs text-slate-400">
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
              className="py-1.5 px-3 text-xs bg-[#0B1120] border border-[#1E2D4A] rounded-md focus:outline-none focus:border-amber-500 text-slate-100 font-bold font-mono"
            />
          </div>

          {/* Assistant selector */}
          <div>
            <select
              value={selectedAsistenteId}
              onChange={(e) => setSelectedAsistenteId(e.target.value)}
              className="py-1.5 px-3 text-xs bg-[#0B1120] border border-[#1E2D4A] rounded-md focus:outline-none focus:border-amber-500 text-slate-100"
            >
              <option value="TODOS" className="bg-[#111A2E] text-slate-100">Todos los colaboradores</option>
              {activeAsistentes.map(as => (
                <option key={as.id} value={as.id} className="bg-[#111A2E] text-slate-100">{as.nombreCompleto}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Grid: Payroll detail list & receipt preview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Payroll calculation rows */}
        <div className="lg:col-span-2 space-y-4">
          
          <div className="bg-[#111A2E] rounded-md border border-[#1E2D4A] shadow-sm overflow-hidden" id="payroll_table_card">
            <div className="p-4 bg-[#0B1120] border-b border-[#1E2D4A] text-white flex justify-between items-center">
              <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-4 h-4 text-blue-400" />
                Resumen de Haberes - Periodo {selectedMonth}
              </span>
              <span className="text-[10px] font-mono bg-[#1E2D4A] text-slate-300 px-2 py-0.5 rounded border border-slate-700">
                PAGO NETO DE PLANILLA
              </span>
            </div>

            {payrollList.length === 0 ? (
              <div className="p-10 text-center text-slate-400">
                <Users className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                <p className="text-xs font-semibold">No hay colaboradores activos registrados para este reporte.</p>
              </div>
            ) : (
              <div className="divide-y divide-[#1E2D4A]">
                {payrollList.map(({ asistente, sueldoBasico, closedCitas, liquidatedCitas, pendingBonosAmount, liquidatedBonosAmount, totalPendingToPay, totalLiquidatedPaid }) => {
                  const hasPendingBonos = closedCitas.length > 0;
                  const totalBonosPeriod = pendingBonosAmount + liquidatedBonosAmount;
                  const grandTotalPeriod = sueldoBasico + totalBonosPeriod;

                  // Retrieve existing logged liquidation to check advance
                  const existingLiq = liquidaciones.find(l => l.asistenteId === asistente.id && l.mes === selectedMonth);
                  const registeredAdelanto = existingLiq ? (existingLiq.montoAdelantoQuincena || 0) : (preLiquidationAdvances[asistente.id] || 0);
                  const reciboAdelantoEntregado = existingLiq ? !!existingLiq.reciboAdelantoEntregado : !!preLiquidationRecibos[asistente.id];
                  const netoFinal = grandTotalPeriod - registeredAdelanto;

                  return (
                    <div key={asistente.id} className="p-4 hover:bg-[#1E2D4A]/40 transition-colors space-y-3" id={`payroll_item_${asistente.id}`}>
                      {/* Name & Account Details */}
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                        <div>
                          <h4 className="text-xs font-bold text-white uppercase tracking-tight">{asistente.nombreCompleto}</h4>
                          <p className="text-[10px] text-slate-400 font-mono">DNI: {asistente.dni} • Cargo: {asistente.cargo}</p>
                        </div>
                        <div className="text-right font-mono text-[10px] text-slate-400">
                          <span className="font-bold text-slate-200">{asistente.banco} ({asistente.tipoCuenta})</span> • Cuenta: {asistente.numeroCuenta}
                          {asistente.cci && <div className="text-[9px] text-slate-400">CCI: {asistente.cci}</div>}
                        </div>
                      </div>

                      {/* Calculations Details Grid */}
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5 bg-[#0B1120] p-3 rounded-md border border-[#1E2D4A]">
                        {/* Fixed Salary RMV */}
                        <div>
                          <span className="text-[9px] uppercase font-bold text-slate-400 block">Sueldo Fijo (RMV)</span>
                          <span className="text-xs font-mono font-bold text-slate-100">{formatPEN(sueldoBasico)}</span>
                        </div>

                        {/* Liquidated Bonos */}
                        <div>
                          <span className="text-[9px] uppercase font-bold text-emerald-400 block">Bonos Liquidados</span>
                          <span className="text-xs font-mono font-bold text-emerald-400">+{formatPEN(liquidatedBonosAmount)}</span>
                          <span className="text-[8px] text-slate-400 block font-sans">({liquidatedCitas.length} citas)</span>
                        </div>

                        {/* Pending Bonos */}
                        <div>
                          <span className="text-[9px] uppercase font-bold text-amber-400 block">Bonos Pendientes</span>
                          <span className="text-xs font-mono font-bold text-amber-400">+{formatPEN(pendingBonosAmount)}</span>
                          <span className="text-[8px] text-slate-400 block font-sans">({closedCitas.length} citas cerradas)</span>
                        </div>

                        {/* Adelanto en Quincena - Interactive Input & Guardar */}
                        <div className="space-y-1 bg-amber-950/30 p-2 rounded border border-amber-800/40">
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] uppercase font-bold text-amber-300 block">Adelanto Quincena</span>
                            {existingLiq?.montoAdelantoQuincena && existingLiq.montoAdelantoQuincena > 0 ? (
                              <span className="text-[8px] font-bold text-emerald-300 bg-emerald-950/60 px-1 py-0.2 rounded border border-emerald-700/50">
                                ✓ Registrado
                              </span>
                            ) : null}
                          </div>

                          <div className="flex items-center gap-1">
                            <span className="text-xs font-mono font-bold text-amber-400">-</span>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              className="w-full max-w-[85px] px-1.5 py-0.5 border border-amber-700/60 bg-[#0B1120] rounded text-xs font-mono font-bold text-amber-200 focus:ring-1 focus:ring-amber-500 focus:outline-none"
                              placeholder="0.00"
                              value={registeredAdelanto || ''}
                              onChange={(e) => {
                                const val = Math.max(0, parseFloat(e.target.value) || 0);
                                setPreLiquidationAdvances(prev => ({
                                  ...prev,
                                  [asistente.id]: val
                                }));
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const val = preLiquidationAdvances[asistente.id] !== undefined 
                                  ? preLiquidationAdvances[asistente.id] 
                                  : (existingLiq?.montoAdelantoQuincena || 0);
                                const recibo = preLiquidationRecibos[asistente.id] !== undefined
                                  ? preLiquidationRecibos[asistente.id]
                                  : !!existingLiq?.reciboAdelantoEntregado;
                                handleSaveAdelanto(asistente, val, recibo);
                              }}
                              className="px-2 py-0.5 bg-amber-600 hover:bg-amber-500 text-white rounded text-[9px] font-bold uppercase tracking-wider flex items-center gap-0.5 cursor-pointer shadow-xs shrink-0"
                              title="Guardar adelanto de quincena en el sistema"
                            >
                              <Save className="w-2.5 h-2.5" />
                              Guardar
                            </button>
                          </div>
                          
                          {/* RHe Checkbox */}
                          <div className="flex items-center gap-1 pt-0.5">
                            <input
                              type="checkbox"
                              id={`rhe_checkbox_${asistente.id}`}
                              className="rounded text-amber-500 focus:ring-amber-500 h-3 w-3 cursor-pointer bg-[#0B1120] border-[#1E2D4A]"
                              checked={reciboAdelantoEntregado}
                              onChange={(e) => {
                                const checked = e.target.checked;
                                setPreLiquidationRecibos(prev => ({
                                  ...prev,
                                  [asistente.id]: checked
                                }));
                                const val = preLiquidationAdvances[asistente.id] !== undefined 
                                  ? preLiquidationAdvances[asistente.id] 
                                  : (existingLiq?.montoAdelantoQuincena || 0);
                                handleSaveAdelanto(asistente, val, checked);
                              }}
                            />
                            <label htmlFor={`rhe_checkbox_${asistente.id}`} className="text-[8px] text-slate-300 font-medium cursor-pointer select-none whitespace-nowrap">
                              RHe Quincena
                            </label>
                          </div>
                        </div>

                        {/* Neto Final a Pagar / Paid */}
                        <div>
                          <span className="text-[9px] uppercase font-bold text-slate-300 block">Neto a Transferir</span>
                          <span className="text-xs font-mono font-bold text-white">{formatPEN(netoFinal)}</span>
                          <span className="text-[8px] text-slate-400 block font-sans">
                            {existingLiq?.estado === 'PAGADO' 
                              ? '✅ Liquidado' 
                              : (existingLiq?.montoAdelantoQuincena && existingLiq.montoAdelantoQuincena > 0 
                                  ? '✓ Adelanto Pagado' 
                                  : (hasPendingBonos ? '⚠️ Pendiente cierre' : '✓ Planilla lista'))}
                          </span>
                        </div>
                      </div>

                      {/* Action buttons inside item */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                        <p className="text-[10px] text-slate-400 font-sans italic flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          Último día de ingreso: {formatToDDMMYYYY(asistente.fechaIngreso)}
                        </p>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleShowReceipt(asistente)}
                            className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-200 bg-[#0B1120] hover:bg-[#1E2D4A] border border-[#1E2D4A] rounded transition-all cursor-pointer shadow-sm"
                          >
                            Ver Boleta de Pago
                          </button>

                          <button
                            onClick={() => handleLiquidate(asistente, closedCitas, sueldoBasico, pendingBonosAmount)}
                            className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white bg-amber-500 hover:bg-amber-600 rounded transition-all cursor-pointer shadow-sm flex items-center gap-1"
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            {existingLiq?.estado === 'PAGADO'
                              ? 'Re-Liquidar Fin de Mes'
                              : (hasPendingBonos ? `Liquidar S/. ${pendingBonosAmount.toFixed(2)}` : 'Liquidar Pago Fin de Mes')}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick strategic tip card */}
          <div className="p-4 bg-[#111A2E] border border-[#1E2D4A] rounded-md flex gap-3 text-xs text-slate-300">
            <Info className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-white">Estructura Salarial Híbrida - Oscar Russo:</p>
              <p className="mt-0.5 text-slate-400">
                Al liquidar la planilla del mes, se procesa de forma integrada el <strong>Sueldo Mínimo Fijo ({formatPEN(config.rmvVigente)})</strong> más los bonos de las citas registradas en estado "Cerrado". Al presionar el botón "Liquidar", las citas pasarán automáticamente al estado "Liquidado", asegurando un estricto orden contable interno y previniendo pagos duplicados.
              </p>
            </div>
          </div>

        </div>

        {/* Right Column: Receipt print preview */}
        <div className="lg:col-span-1">
          {receiptAsistente && receiptDetails ? (
            <div className="bg-[#111A2E] rounded-md border border-[#1E2D4A] shadow-sm overflow-hidden sticky top-20" id="receipt_preview_card">
              <div className="p-4 bg-[#0B1120] border-b border-[#1E2D4A] text-white flex justify-between items-center">
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
              <div className="p-5 space-y-4 text-xs font-sans text-slate-300" id="print_receipt_area">
                
                {/* Receipt Header */}
                <div className="text-center pb-3 border-b border-[#1E2D4A]">
                  <h4 className="text-sm font-bold uppercase text-white tracking-tight">OSCAR RUSSO</h4>
                  <p className="text-[9px] text-slate-400 font-medium">Lima, Perú • RUC: 10077932823</p>
                  <p className="text-[10px] font-bold text-amber-400 uppercase mt-1">RECIBO DE HABERES Y BONOS - ASISTENTES</p>
                </div>

                {/* Assistant metadata */}
                <div className="space-y-1.5 bg-[#0B1120] p-2.5 rounded border border-[#1E2D4A]">
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-semibold uppercase text-[9px]">Colaborador:</span>
                    <span className="font-bold text-white">{receiptAsistente.nombreCompleto}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-semibold uppercase text-[9px]">DNI:</span>
                    <span className="font-mono font-bold text-slate-200">{receiptAsistente.dni}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-semibold uppercase text-[9px]">Cargo / Rol:</span>
                    <span className="font-bold text-slate-200">{receiptAsistente.cargo}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-semibold uppercase text-[9px]">Periodo:</span>
                    <span className="font-mono font-bold text-slate-200 uppercase">{receiptDetails.mes}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-semibold uppercase text-[9px]">Vía de Pago:</span>
                    <span className="font-bold text-slate-200">{receiptAsistente.banco} N° {receiptAsistente.numeroCuenta}</span>
                  </div>
                </div>

                {/* Details list of pay items */}
                <div className="space-y-2">
                  <h5 className="font-bold text-[10px] uppercase text-slate-400 tracking-wider">Conceptos de Liquidación</h5>
                  
                  <div className="divide-y divide-[#1E2D4A] border-t border-b border-[#1E2D4A]">
                    {/* Fixed salary item */}
                    <div className="py-2 flex justify-between">
                      <div>
                        <span className="font-bold text-slate-100 block">Sueldo Fijo Mensual</span>
                        <span className="text-[9px] text-slate-400">Remuneración Mínima Vital de Ley</span>
                      </div>
                      <span className="font-mono font-bold text-white self-center">{formatPEN(receiptDetails.sueldoBasico)}</span>
                    </div>

                    {/* Bonos detailed list inside the month */}
                    <div className="py-2 space-y-1">
                      <div className="flex justify-between">
                        <span className="font-bold text-slate-100">Bonificaciones por Cierre</span>
                        <span className="font-mono font-bold text-emerald-400">+{formatPEN(receiptDetails.totalBonos)}</span>
                      </div>
                      
                      {receiptDetails.bonosList.length === 0 ? (
                        <p className="text-[9px] text-slate-400 italic">No se registraron bonos por citas cerradas en este periodo.</p>
                      ) : (
                        <div className="pl-2 space-y-1 max-h-32 overflow-y-auto pr-1">
                          {receiptDetails.bonosList.map((c) => (
                            <div key={c.id} className="flex justify-between text-[9px] text-slate-400 font-mono">
                              <span className="truncate max-w-[150px] text-slate-300">{c.clienteNombre} ({c.tipoOperacion})</span>
                              <span className="font-bold text-slate-200">S/. {c.montoBono.toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Adelanto de quincena item */}
                    {receiptDetails.montoAdelantoQuincena !== undefined && receiptDetails.montoAdelantoQuincena > 0 && (
                      <div className="py-2 flex justify-between border-t border-[#1E2D4A]">
                        <div>
                          <span className="font-bold text-slate-100 block text-amber-400">Adelanto en Quincena</span>
                          <span className="text-[9px] text-slate-400">
                            {receiptDetails.reciboAdelantoEntregado 
                              ? '✓ Recibo por Honorarios entregado' 
                              : '⚠️ Pendiente de entregar Recibo'}
                          </span>
                        </div>
                        <span className="font-mono font-bold text-amber-400 self-center">-{formatPEN(receiptDetails.montoAdelantoQuincena)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Grand Payout Total */}
                <div className="p-3 bg-[#0B1120] border border-[#1E2D4A] rounded text-white flex justify-between items-center">
                  <div>
                    <span className="text-[10px] uppercase text-slate-300 block font-bold tracking-wider">Monto Neto a Pagar</span>
                    <span className="text-[8px] text-slate-400">Total Soles (PEN)</span>
                  </div>
                  <span className="text-base font-bold font-mono text-amber-400">{formatPEN(receiptDetails.totalPagar)}</span>
                </div>

                {/* Signatures */}
                <div className="pt-8 grid grid-cols-2 gap-4 text-center text-[8px] font-sans">
                  <div className="border-t border-[#1E2D4A] pt-1.5 text-slate-400 font-medium">
                    Firma Coordinador<br />
                    Oscar Russo
                  </div>
                  <div className="border-t border-[#1E2D4A] pt-1.5 text-slate-400 font-medium">
                    Firma Colaborador<br />
                    DNI: {receiptAsistente.dni}
                  </div>
                </div>

              </div>

              {/* Action utilities bar */}
              <div className="p-4 bg-[#0B1120] border-t border-[#1E2D4A] flex gap-2">
                <button
                  onClick={handleDownloadPdf}
                  className="flex-1 flex items-center justify-center gap-1 py-2 px-2 bg-amber-500 hover:bg-amber-600 text-white rounded text-[11px] font-bold uppercase tracking-wider cursor-pointer shadow-sm transition-colors"
                >
                  <FileText className="w-3.5 h-3.5" />
                  Descargar PDF
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-[#111A2E] p-6 rounded-md border border-[#1E2D4A] text-center space-y-3 sticky top-20" id="receipt_placeholder">
              <FileText className="w-10 h-10 text-slate-500 mx-auto" />
              <h4 className="text-xs font-bold text-slate-200 uppercase">Previsualización de Boleta</h4>
              <p className="text-xs text-slate-400">
                Selecciona "Ver Boleta de Pago" al costado de cualquier colaborador para generar su liquidación contable, previsualizar su recibo formal y descargar las instrucciones de transferencia bancaria.
              </p>
            </div>
          )}
        </div>

      </div>

      {/* Control de Recibos por Honorarios (RHe) y Liquidaciones Procesadas */}
      <div className="bg-[#111A2E] rounded-md border border-[#1E2D4A] shadow-sm overflow-hidden" id="past_liquidations_card">
        <div className="p-4 bg-[#0B1120] border-b border-[#1E2D4A] text-white flex justify-between items-center">
          <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-blue-400" />
            Control de Recibos por Honorarios (RHe) y Liquidaciones Procesadas
          </span>
          <span className="text-[10px] bg-[#1E2D4A] text-slate-300 px-2 py-0.5 rounded border border-slate-700 font-mono">
            Total Registros: {liquidaciones.length}
          </span>
        </div>

        <div className="p-5 space-y-4">
          <p className="text-xs text-slate-400">
            A continuación se listan las planillas de haberes que han sido cerradas y pagadas en el sistema. Puedes marcar y controlar de manera estricta cuándo el colaborador ha entregado formalmente su <strong>Recibo por Honorarios (RHe)</strong> para efectos de control tributario.
          </p>

          {liquidaciones.length === 0 ? (
            <div className="text-center py-8 text-slate-400 border border-dashed border-[#1E2D4A] rounded-md">
              <FileText className="w-8 h-8 mx-auto text-slate-500 mb-2" />
              <p className="text-xs">No se registran planillas de liquidación cerradas en el sistema.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#0B1120] border-b border-[#1E2D4A] text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                    <th className="p-3">Periodo</th>
                    <th className="p-3">Colaborador</th>
                    <th className="p-3">Sueldo Fijo (RMV)</th>
                    <th className="p-3">Total Bonos</th>
                    <th className="p-3">Adelanto Quincena</th>
                    <th className="p-3">Neto Transferir</th>
                    <th className="p-3">Banco / Cuenta de Abono</th>
                    <th className="p-3 text-center">Boleta PDF</th>
                    <th className="p-3 text-center">RHe Quincena</th>
                    <th className="p-3 text-center">RHe Fin de Mes</th>
                    <th className="p-3 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1E2D4A] text-slate-300">
                  {liquidaciones.map((liq) => {
                    const isEditing = editingLiqId === liq.id;
                    const isConfirmingDelete = confirmDeleteId === liq.id;

                    if (isEditing) {
                      return (
                        <tr key={liq.id} className="bg-[#1E2D4A]/50">
                          <td className="p-3 font-mono font-bold text-white">{liq.mes}</td>
                          <td className="p-3 font-semibold text-slate-200">{liq.asistenteNombre}</td>
                          <td className="p-3">
                            <div className="flex items-center gap-1">
                              <span className="text-slate-400 font-bold">S/.</span>
                              <input
                                type="number"
                                value={editSueldo}
                                onChange={(e) => setEditSueldo(Number(e.target.value))}
                                className="w-20 px-1.5 py-1 text-xs border border-[#1E2D4A] bg-[#0B1120] rounded focus:outline-none focus:border-amber-500 font-mono text-slate-100"
                                placeholder="Sueldo"
                              />
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-1">
                              <span className="text-slate-400 font-bold">S/.</span>
                              <input
                                type="number"
                                value={editBonos}
                                onChange={(e) => setEditBonos(Number(e.target.value))}
                                className="w-20 px-1.5 py-1 text-xs border border-[#1E2D4A] bg-[#0B1120] rounded focus:outline-none focus:border-amber-500 font-mono text-slate-100"
                                placeholder="Bonos"
                              />
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-1">
                              <span className="text-slate-400 font-bold">S/.</span>
                              <input
                                type="number"
                                value={editAdelanto}
                                onChange={(e) => setEditAdelanto(Number(e.target.value))}
                                className="w-20 px-1.5 py-1 text-xs border border-[#1E2D4A] bg-[#0B1120] rounded focus:outline-none focus:border-amber-500 font-mono text-slate-100"
                                placeholder="Adelanto"
                              />
                            </div>
                          </td>
                          <td className="p-3 font-mono font-bold text-white">
                            {formatPEN(editSueldo + editBonos - editAdelanto)}
                          </td>
                          <td className="p-3 space-y-1.5">
                            <input
                              type="text"
                              value={editBanco}
                              onChange={(e) => setEditBanco(capitalizeWords(e.target.value))}
                              className="w-full px-1.5 py-1 text-xs border border-[#1E2D4A] bg-[#0B1120] rounded focus:outline-none focus:border-amber-500 font-semibold text-slate-200 capitalize"
                              placeholder="Banco"
                            />
                            <input
                              type="text"
                              value={editCuenta}
                              onChange={(e) => setEditCuenta(capitalizeWords(e.target.value))}
                              className="w-full px-1.5 py-0.5 text-[10px] border border-[#1E2D4A] bg-[#0B1120] rounded focus:outline-none focus:border-amber-500 font-mono text-slate-300 capitalize"
                              placeholder="Cuenta"
                            />
                            <input
                              type="text"
                              value={editCci}
                              onChange={(e) => setEditCci(e.target.value)}
                              className="w-full px-1.5 py-0.5 text-[10px] border border-[#1E2D4A] bg-[#0B1120] rounded focus:outline-none focus:border-amber-500 font-mono text-slate-300"
                              placeholder="CCI (opcional)"
                            />
                          </td>
                          <td className="p-3 text-center text-slate-500">-</td>
                          <td className="p-3 text-center text-slate-500">-</td>
                          <td className="p-3 text-center text-slate-500">-</td>
                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => saveEditing(liq)}
                                className="p-1 px-1.5 rounded bg-green-600 hover:bg-green-500 text-white font-bold text-[10px] uppercase flex items-center gap-0.5 cursor-pointer shadow-sm"
                                title="Guardar cambios"
                              >
                                <Save className="w-3 h-3" />
                                Guardar
                              </button>
                              <button
                                onClick={cancelEditing}
                                className="p-1 px-1.5 rounded bg-[#1E2D4A] hover:bg-slate-700 text-slate-300 font-bold text-[10px] uppercase flex items-center gap-0.5 cursor-pointer"
                                title="Cancelar"
                              >
                                <Undo2 className="w-3 h-3" />
                                Cancelar
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    }

                    return (
                      <tr key={liq.id} className="hover:bg-[#1E2D4A]/30 transition-colors">
                        <td className="p-3 font-mono font-bold text-white">{liq.mes}</td>
                        <td className="p-3 font-semibold text-slate-200">{liq.asistenteNombre}</td>
                        <td className="p-3 font-mono">{formatPEN(liq.sueldoBasico)}</td>
                        <td className="p-3 font-mono text-emerald-400 font-medium">+{formatPEN(liq.totalBonos)}</td>
                        <td className="p-3 font-mono text-amber-400">
                          {liq.montoAdelantoQuincena && liq.montoAdelantoQuincena > 0 ? `-${formatPEN(liq.montoAdelantoQuincena)}` : 'S/. 0.00'}
                        </td>
                        <td className="p-3 font-mono font-bold text-white">{formatPEN(liq.montoTotal)}</td>
                        <td className="p-3">
                          <span className="font-semibold block text-slate-200">{liq.banco}</span>
                          <span className="text-[10px] text-slate-400 font-mono block">Cuenta: {liq.numeroCuenta}</span>
                          {liq.cci && <span className="text-[9px] text-slate-400 font-mono block">CCI: {liq.cci}</span>}
                        </td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => handleDownloadPastPdf(liq)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-[#1E2D4A] bg-[#0B1120] hover:bg-[#1E2D4A] text-slate-200 text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-colors"
                            title="Descargar PDF de Boleta"
                          >
                            <FileText className="w-3.5 h-3.5 text-amber-400" />
                            PDF
                          </button>
                        </td>
                        {/* RHe Quincena */}
                        <td className="p-3 text-center">
                          <button
                            onClick={() => {
                              if (onUpdateLiquidacion) {
                                onUpdateLiquidacion({
                                  ...liq,
                                  reciboAdelantoEntregado: !liq.reciboAdelantoEntregado
                                });
                              }
                            }}
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded border text-[9px] font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                              liq.reciboAdelantoEntregado
                                ? 'bg-green-950/60 border-green-700/60 text-green-300 font-bold'
                                : 'bg-[#0B1120] border-[#1E2D4A] text-slate-400 hover:bg-[#1E2D4A]'
                            }`}
                          >
                            {liq.reciboAdelantoEntregado ? (
                              <>
                                <CheckCircle2 className="w-3 h-3 text-green-400" />
                                Recibido ✓
                              </>
                            ) : (
                              <>
                                <XCircle className="w-3 h-3 text-slate-500" />
                                Pendiente
                              </>
                            )}
                          </button>
                        </td>
                        {/* RHe Fin de Mes */}
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
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded border text-[9px] font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                              liq.reciboHonorariosEntregado
                                ? 'bg-green-950/60 border-green-700/60 text-green-300 font-bold'
                                : 'bg-[#0B1120] border-[#1E2D4A] text-slate-400 hover:bg-[#1E2D4A]'
                            }`}
                          >
                            {liq.reciboHonorariosEntregado ? (
                              <>
                                <CheckCircle2 className="w-3 h-3 text-green-400" />
                                Recibido ✓
                              </>
                            ) : (
                              <>
                                <XCircle className="w-3 h-3 text-slate-500" />
                                Pendiente
                              </>
                            )}
                          </button>
                        </td>
                        <td className="p-3 text-center">
                          {isConfirmingDelete ? (
                            <div className="flex flex-col items-center justify-center gap-1 bg-red-950/60 p-1.5 rounded border border-red-800/60">
                              <span className="text-[9px] font-bold text-red-300 animate-pulse uppercase mb-1">¿Seguro de eliminar?</span>
                              <div className="flex gap-1.5">
                                <button
                                  onClick={() => confirmDelete(liq.id)}
                                  className="px-2 py-0.5 bg-red-600 hover:bg-red-500 text-white rounded text-[9px] font-bold uppercase cursor-pointer"
                                >
                                  Sí
                                </button>
                                <button
                                  onClick={cancelDelete}
                                  className="px-2 py-0.5 bg-[#1E2D4A] hover:bg-slate-700 text-slate-200 rounded text-[9px] font-bold uppercase cursor-pointer"
                                >
                                  No
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => startEditing(liq)}
                                className="p-1.5 rounded bg-[#0B1120] hover:bg-[#1E2D4A] border border-[#1E2D4A] text-slate-300 hover:text-amber-400 cursor-pointer transition-colors"
                                title="Editar registro"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteClick(liq.id)}
                                className="p-1.5 rounded bg-[#0B1120] hover:bg-red-950/50 border border-[#1E2D4A] text-slate-300 hover:text-red-400 cursor-pointer transition-colors"
                                title="Eliminar registro"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
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
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-[#111A2E] rounded-md border border-[#1E2D4A] shadow-2xl max-w-md w-full overflow-hidden">
            <div className="p-4 bg-[#0B1120] text-white flex justify-between items-center border-b border-[#1E2D4A]">
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
              <p className="text-xs text-slate-300 leading-relaxed">
                ¿Confirmas que deseas registrar el pago de haberes y liquidar los bonos para <strong className="text-white">{confirmLiquidation.asistente.nombreCompleto}</strong> correspondiente al periodo <strong className="text-white">{selectedMonth}</strong>?
              </p>

              <div className="bg-[#0B1120] p-3.5 rounded border border-[#1E2D4A] space-y-2 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-400">Sueldo Fijo (RMV):</span>
                  <span className="font-bold text-slate-100">{formatPEN(confirmLiquidation.sueldo)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Bonos por Citas:</span>
                  <span className="font-bold text-emerald-400">+{formatPEN(confirmLiquidation.bonos)}</span>
                </div>
                <div className="flex justify-between border-t border-[#1E2D4A] pt-2 text-amber-400">
                  <span>Adelanto Quincena (S/.):</span>
                  <span className="font-bold">-{formatPEN(liqMontoAdelanto)}</span>
                </div>
                <div className="border-t border-[#1E2D4A] pt-2 flex justify-between font-bold text-white text-sm">
                  <span>Monto Neto Fin de Mes:</span>
                  <span className="text-amber-400">{formatPEN(confirmLiquidation.sueldo + confirmLiquidation.bonos - liqMontoAdelanto)}</span>
                </div>
              </div>

              {/* Form inputs for Adelanto */}
              <div className="space-y-3 bg-amber-950/30 p-3.5 rounded border border-amber-800/40 text-xs">
                <span className="font-bold uppercase tracking-wider text-amber-300 block text-[10px]">Detalle de Adelanto de Quincena</span>
                
                <div className="grid grid-cols-1 gap-2.5">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Monto de Adelanto (S/.)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className="w-full px-2.5 py-1.5 border border-[#1E2D4A] bg-[#0B1120] rounded text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none font-mono text-slate-100"
                      placeholder="Ingrese monto si aplica adelanto (ej. 500)"
                      value={liqMontoAdelanto || ''}
                      onChange={(e) => {
                        const val = Math.max(0, parseFloat(e.target.value) || 0);
                        setLiqMontoAdelanto(val);
                        setPreLiquidationAdvances(prev => ({
                          ...prev,
                          [confirmLiquidation.asistente.id]: val
                        }));
                      }}
                    />
                  </div>
                  
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="checkbox"
                      id="liqReciboAdelantoCheckbox"
                      className="rounded text-amber-500 focus:ring-amber-500 h-3.5 w-3.5 cursor-pointer bg-[#0B1120] border-[#1E2D4A]"
                      checked={liqReciboAdelanto}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setLiqReciboAdelanto(checked);
                        setPreLiquidationRecibos(prev => ({
                          ...prev,
                          [confirmLiquidation.asistente.id]: checked
                        }));
                      }}
                    />
                    <label htmlFor="liqReciboAdelantoCheckbox" className="text-slate-300 font-medium cursor-pointer select-none">
                      ¿Se recibió el Recibo por Honorarios (RHe) por este adelanto?
                    </label>
                  </div>
                </div>
              </div>

              <p className="text-[10px] text-slate-400 italic">
                * Al confirmar, las {confirmLiquidation.citas.length} citas en estado "Cerrado" pasarán automáticamente a "Liquidado" para este mes.
              </p>
            </div>

            <div className="p-4 bg-[#0B1120] border-t border-[#1E2D4A] flex justify-end gap-2.5">
              <button
                onClick={() => setConfirmLiquidation(null)}
                className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-slate-300 bg-[#1E2D4A] hover:bg-slate-700 border border-slate-700 rounded transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={executeLiquidation}
                className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-white bg-amber-500 hover:bg-amber-600 rounded shadow-sm transition-colors cursor-pointer font-bold"
              >
                Registrar Pago
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Notification Toast */}
      {notification && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 p-4 rounded-md shadow-2xl border animate-fade-in bg-[#111A2E] border-[#1E2D4A] max-w-sm text-slate-100">
          <div className={`p-1 rounded-full shrink-0 ${notification.type === 'success' ? 'bg-green-950 text-green-400' : 'bg-red-950 text-red-400'}`}>
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
          </div>
          <div className="text-xs font-medium text-slate-200 flex-1 leading-normal">{notification.message}</div>
          <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-white shrink-0 font-bold ml-1 text-xs">✕</button>
        </div>
      )}

    </div>
  );
}
