/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Users, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  TrendingUp, 
  AlertCircle, 
  Coins, 
  Activity, 
  Sparkles, 
  Info,
  MapPin,
  Tag,
  Phone,
  HelpCircle,
  Award
} from 'lucide-react';
import { Asistente, Cita, EstadoCita, EstadoCierre, ConfigGeneral } from '../types';
import { formatPEN } from '../utils/currency';
import { formatToDDMMYYYY } from '../utils/date';

interface DashboardProps {
  asistentes: Asistente[];
  citas: Cita[];
  config: ConfigGeneral;
  onNavigateToTab: (tab: string) => void;
  userRole?: 'admin' | 'asistente' | null;
}

export default function Dashboard({
  asistentes,
  citas,
  config,
  onNavigateToTab,
  userRole = 'admin'
}: DashboardProps) {
  // Month Filter State
  const [filterMonth, setFilterMonth] = useState<string>(() => {
    const d = new Date();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    return `${d.getFullYear()}-${mm}`;
  });

  // Filter appointments by selected month (only real appointments, not prospects)
  const filteredCitas = filterMonth
    ? citas.filter(c => c.estadoCita !== EstadoCita.PROSPECTO && c.fechaCita && c.fechaCita.startsWith(filterMonth))
    : citas.filter(c => c.estadoCita !== EstadoCita.PROSPECTO);

  // Stats calculations
  const totalAsistentes = asistentes.length;
  const asistentesActivos = asistentes.filter(as => as.activo).length;
  const totalCitas = filteredCitas.length;
  
  // Appointment states
  const citasAgendadas = filteredCitas.filter(c => c.estadoCita === EstadoCita.AGENDADA).length;
  const citasRealizadas = filteredCitas.filter(c => c.estadoCita === EstadoCita.REALIZADA).length;
  const citasCanceladas = filteredCitas.filter(c => c.estadoCita === EstadoCita.CANCELADA).length;
  
  // Cierre states
  const cierresConcretados = filteredCitas.filter(c => c.estadoCierre === EstadoCierre.CERRADO || c.estadoCierre === EstadoCierre.LIQUIDADO).length;
  const cierresPendientes = filteredCitas.filter(c => c.estadoCierre === EstadoCierre.PENDIENTE).length;
  
  // Bonus totals
  const totalBonosPendientes = filteredCitas
    .filter(c => c.estadoCierre === EstadoCierre.CERRADO)
    .reduce((sum, c) => sum + c.montoBono, 0);

  const totalBonosLiquidados = filteredCitas
    .filter(c => c.estadoCierre === EstadoCierre.LIQUIDADO)
    .reduce((sum, c) => sum + c.montoBono, 0);

  // Calls made (calculated as prospects with a registered call date in selected month)
  const totalLlamadas = filterMonth
    ? citas.filter(c => c.fechaLlamada?.startsWith(filterMonth)).length
    : citas.filter(c => !!c.fechaLlamada).length;

  // Conversion rate: Citas Realizadas / Total Citas
  const conversionCitasRealizadas = totalCitas > 0 ? Math.round((citasRealizadas / totalCitas) * 100) : 0;
  // Cierres / Citas Realizadas
  const conversionCierres = citasRealizadas > 0 ? Math.round((cierresConcretados / citasRealizadas) * 100) : 0;

  // New precise conversion ratios:
  // 1. Ratio of Calls vs. Total Logged Appointments (Efectividad de Prospección)
  const ratioLlamadasCitas = totalLlamadas > 0 ? ((totalCitas / totalLlamadas) * 100).toFixed(1) : '0.0';
  // 2. Ratio of Appointments vs. Closures (Efectividad de Cierre)
  const ratioCitasCierres = totalCitas > 0 ? ((cierresConcretados / totalCitas) * 100).toFixed(1) : '0.0';
  // 3. Ratio of Calls vs. Closures (Eficiencia Integral)
  const ratioLlamadasCierres = totalLlamadas > 0 ? ((cierresConcretados / totalLlamadas) * 100).toFixed(2) : '0.00';

  const promedioLlamadasPorCita = totalCitas > 0 ? (totalLlamadas / totalCitas).toFixed(1) : '0';
  const promedioLlamadasPorCierre = cierresConcretados > 0 ? (totalLlamadas / cierresConcretados).toFixed(1) : '0';


  return (
    <div className="space-y-6 animate-fade-in" id="dashboard_root">
      
      {/* Welcome Banner */}
      <div className="p-6 bg-gradient-to-r from-navy to-slate-900 rounded-md border border-slate-800 text-white shadow-md relative overflow-hidden" id="dashboard_welcome">
        {/* Subtle decorative grid effect */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-20" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <span className="inline-flex items-center gap-1 bg-primary/20 text-blue-300 px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border border-primary/30">
              <Sparkles className="w-3 h-3 text-blue-400" />
              {userRole === 'admin' ? 'Oscar Russo — Lima, Perú' : 'Portal de Asistente — Lima, Perú'}
            </span>
            <h2 className="text-xl md:text-2xl font-bold tracking-tight">
              {userRole === 'admin' ? 'Panel de Control de Recursos Humanos' : 'Portal Operativo de Captaciones'}
            </h2>
            <p className="text-xs text-slate-300 max-w-xl font-medium">
              {userRole === 'admin' ? (
                <>Bienvenido, <strong>Oscar Russo</strong>. Administra la planilla de la asistente, el registro legal de citas de captación logradas y la liquidación contable de sus bonos variables por cierres.</>
              ) : (
                <>Bienvenido al sistema de <strong>REMAX Power Expo</strong>. Registra tus llamadas de prospección y citas de captación logradas para maximizar tus bonos variables.</>
              )}
            </p>
          </div>
          
          {/* Quick Config Value Widget */}
          {userRole === 'admin' ? (
            <div className="bg-slate-800/80 backdrop-blur-sm border border-slate-700/60 p-4 rounded-md text-right font-mono self-start md:self-auto shadow-inner">
              <span className="text-[9px] text-slate-400 font-bold uppercase block tracking-widest">Sueldo Base RMV</span>
              <span className="text-xl font-bold text-blue-400 block">{formatPEN(config.rmvVigente)}</span>
              <span className="text-[9px] text-slate-400 font-sans block mt-0.5">Establecido por Ley en Perú</span>
            </div>
          ) : (
            <div className="bg-slate-800/80 backdrop-blur-sm border border-emerald-500/30 p-4 rounded-md text-right font-mono self-start md:self-auto shadow-inner">
              <span className="text-[9px] text-emerald-400 font-bold uppercase block tracking-widest">Perfil Activo</span>
              <span className="text-xs font-bold text-emerald-300 block uppercase">Asistente de Captación</span>
              <span className="text-[8px] text-slate-400 font-sans block mt-0.5">REMAX Power Expo</span>
            </div>
          )}
        </div>
      </div>

      {/* Month Filter Bar */}
      <div className="bg-white p-4 rounded-md border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4" id="month_filter_bar">
        <div className="space-y-0.5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-primary" />
            Filtro Mensual de Desempeño de la Asistente
          </h3>
          <p className="text-[10px] text-slate-500">
            Filtra los KPIs de llamadas, citas y bonos por el mes seleccionado.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <label htmlFor="dashboard_month_select" className="text-[11px] font-bold uppercase text-slate-600 tracking-wider shrink-0">
            Seleccionar Mes:
          </label>
          <div className="flex items-center gap-1.5">
            <input
              type="month"
              id="dashboard_month_select"
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className="py-1 px-2 text-xs bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-slate-800 font-bold"
            />
            {filterMonth && (
              <button
                onClick={() => setFilterMonth('')}
                className="px-2 py-1 text-[10px] uppercase tracking-wider font-bold text-slate-500 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded transition-colors"
              >
                Todos
              </button>
            )}
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" id="kpi_grid">
        
        {/* Total Calls Made */}
        <div className="p-4 bg-white rounded-md border border-slate-200 shadow-sm flex items-center justify-between hover:border-slate-300 transition-colors">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">Llamadas Realizadas</span>
            <span className="text-2xl font-bold text-slate-900 font-mono block">
              {totalLlamadas}
            </span>
            <button 
              onClick={() => onNavigateToTab(userRole === 'admin' ? 'asistentes' : 'citas')}
              className="text-[10px] text-primary hover:underline font-bold"
            >
              Registrar Llamadas →
            </button>
          </div>
          <div className="p-2.5 bg-blue-50 text-primary rounded border border-primary/10">
            <Phone className="w-5 h-5" />
          </div>
        </div>

        {/* Total Appointments */}
        <div className="p-4 bg-white rounded-md border border-slate-200 shadow-sm flex items-center justify-between hover:border-slate-300 transition-colors">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">Citas Logradas</span>
            <span className="text-2xl font-bold text-slate-900 font-mono block">{totalCitas}</span>
            <div className="text-[10px] text-slate-500 font-semibold font-mono">
              <span className="text-emerald-600">{citasRealizadas} exitosas</span> • <span className="text-slate-400">{citasAgendadas} agend.</span>
            </div>
          </div>
          <div className="p-2.5 bg-slate-50 text-slate-700 rounded border border-slate-200">
            <Calendar className="w-5 h-5" />
          </div>
        </div>

        {/* Closed Deals Count */}
        <div className="p-4 bg-white rounded-md border border-slate-200 shadow-sm flex items-center justify-between hover:border-slate-300 transition-colors">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">Cierres Concretados</span>
            <span className="text-2xl font-bold text-slate-900 font-mono block">{cierresConcretados}</span>
            <div className="text-[10px] text-amber-700 font-semibold font-mono">
              {cierresPendientes} captaciones pendientes de cierre
            </div>
          </div>
          <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded border border-emerald-100">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        {/* Pending Payout Bonos or Conversion Rate */}
        {userRole === 'admin' ? (
          <div className="p-4 bg-white rounded-md border border-slate-200 shadow-sm flex items-center justify-between hover:border-slate-300 transition-colors">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">Bonos por Liquidar</span>
              <span className="text-2xl font-bold text-primary font-mono block">{formatPEN(totalBonosPendientes)}</span>
              <button 
                onClick={() => onNavigateToTab('liquidacion')}
                className="text-[10px] text-primary hover:underline font-bold"
              >
                Liquidar Planilla →
              </button>
            </div>
            <div className="p-2.5 bg-blue-50 text-primary rounded border border-primary/10">
              <Coins className="w-5 h-5" />
            </div>
          </div>
        ) : (
          <div className="p-4 bg-white rounded-md border border-slate-200 shadow-sm flex items-center justify-between hover:border-slate-300 transition-colors">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">Conversión Cita a Cierre</span>
              <span className="text-2xl font-bold text-emerald-600 font-mono block">{ratioCitasCierres}%</span>
              <button 
                onClick={() => onNavigateToTab('citas')}
                className="text-[10px] text-primary hover:underline font-bold"
              >
                Ver Citas Logradas →
              </button>
            </div>
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded border border-emerald-100">
              <Award className="w-5 h-5" />
            </div>
          </div>
        )}

      </div>

      {/* Main Section: Graphs & Strategic Advice */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left column: Analytics & Recent Items */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Conversion Visual Panel */}
          <div className="bg-white p-5 rounded-md border border-slate-200 shadow-sm space-y-5" id="conversions_visual">
            
            {/* Title Block */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div className="space-y-0.5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-primary" />
                  Embudo de Eficiencia Comercial y Ratios de Conversión
                </h3>
                <p className="text-[10px] text-slate-500">
                  Desempeño acumulado en base a {totalLlamadas} llamadas, {totalCitas} citas logradas y {cierresConcretados} cierres concretados.
                </p>
              </div>
              <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded font-bold uppercase">
                {filterMonth ? `Mes: ${formatToDDMMYYYY(filterMonth)}` : "Historial Completo"}
              </span>
            </div>

            {/* Core Ratios requested: Llamadas vs Citas vs Cierres */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* Ratio 1: Llamadas vs Efectividad en Citas */}
              <div className="border border-slate-100 p-3.5 rounded bg-slate-50/50 space-y-2 flex flex-col justify-between">
                <div className="space-y-1">
                  <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider block">1. Llamadas ➔ Citas Logradas</span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-xl font-mono font-bold text-slate-800">{ratioLlamadasCitas}%</span>
                    <span className="text-[10px] text-slate-400">de efectividad</span>
                  </div>
                </div>
                <div className="pt-1.5 border-t border-slate-100/80">
                  <p className="text-[10px] text-slate-600 leading-relaxed">
                    Se requiere un promedio de <strong className="text-primary font-mono">{promedioLlamadasPorCita}</strong> llamadas realizadas para conseguir <strong>1 cita lograda</strong>.
                  </p>
                </div>
              </div>

              {/* Ratio 2: Citas vs Cierres (Citas en Cierre) */}
              <div className="border border-slate-100 p-3.5 rounded bg-slate-50/50 space-y-2 flex flex-col justify-between">
                <div className="space-y-1">
                  <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider block">2. Citas Logradas ➔ Cierres</span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-xl font-mono font-bold text-emerald-600">{ratioCitasCierres}%</span>
                    <span className="text-[10px] text-slate-400">de conversión</span>
                  </div>
                </div>
                <div className="pt-1.5 border-t border-slate-100/80">
                  <p className="text-[10px] text-slate-600 leading-relaxed">
                    De cada 10 citas logradas por la asistente, se concretan aproximadamente <strong className="text-emerald-600 font-mono">{(Number(ratioCitasCierres)/10).toFixed(1)}</strong> cierres de venta/alquiler.
                  </p>
                </div>
              </div>

              {/* Ratio 3: Llamadas vs Cierres (Eficiencia Total) */}
              <div className="border border-slate-100 p-3.5 rounded bg-slate-50/50 space-y-2 flex flex-col justify-between">
                <div className="space-y-1">
                  <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider block">3. Llamadas ➔ Cierres Concretados</span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-xl font-mono font-bold text-indigo-600">{ratioLlamadasCierres}%</span>
                    <span className="text-[10px] text-slate-400">tasa global</span>
                  </div>
                </div>
                <div className="pt-1.5 border-t border-slate-100/80">
                  <p className="text-[10px] text-slate-600 leading-relaxed">
                    Se requiere realizar <strong className="text-indigo-600 font-mono">{promedioLlamadasPorCierre}</strong> llamadas de prospección para concretar <strong>1 cierre de inmueble</strong>.
                  </p>
                </div>
              </div>

            </div>

            {/* Graphical Funnel Progress Visual */}
            <div className="space-y-2.5 pt-1">
              <h4 className="text-[9px] font-bold uppercase text-slate-400 tracking-wider">Embudo Visual de Desempeño</h4>
              
              <div className="space-y-2">
                {/* Step 1: Llamadas */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-blue-500" />
                      Llamadas Realizadas (Base Inicial)
                    </span>
                    <span className="font-mono font-bold text-slate-800">{totalLlamadas} llamadas (100%)</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded overflow-hidden">
                    <div className="bg-blue-500 h-full rounded transition-all duration-500" style={{ width: '100%' }} />
                  </div>
                </div>

                {/* Step 2: Citas Logradas */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-primary" />
                      Citas Logradas (Efectividad de Prospección)
                    </span>
                    <span className="font-mono font-bold text-primary">{totalCitas} citas ({ratioLlamadasCitas}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded overflow-hidden">
                    <div className="bg-primary h-full rounded transition-all duration-500" style={{ width: `${Math.min(100, Number(ratioLlamadasCitas) * 4)}%` }} />
                  </div>
                </div>

                {/* Step 3: Cierres */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                      Cierres Concretados (Cierres de Negocio)
                    </span>
                    <span className="font-mono font-bold text-emerald-600">{cierresConcretados} cierres ({ratioLlamadasCierres}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded transition-all duration-500" style={{ width: `${Math.min(100, Number(ratioLlamadasCierres) * 20)}%` }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Estadística Mensual de Llamadas (Explicit Breakdown to show where it's saved) */}
            <div className="pt-4 border-t border-slate-100 space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <h4 className="text-[10px] font-bold uppercase text-slate-800 tracking-wider flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-slate-500" />
                    Estadística Detallada de Llamadas por Asistente
                  </h4>
                  <p className="text-[9px] text-slate-400">
                    Muestra el volumen de llamadas registrado para cada colaboradora en el sistema.
                  </p>
                </div>
                <button
                  onClick={() => onNavigateToTab(userRole === 'admin' ? 'asistentes' : 'citas')}
                  className="text-[9px] uppercase font-bold text-primary hover:underline"
                >
                  Modificar Registro →
                </button>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100/80 border-b border-slate-200 text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                      <th className="py-2 px-3">Asistente / Colaboradora</th>
                      <th className="py-2 px-3 text-center">Mes</th>
                      <th className="py-2 px-3 text-center">Llamadas</th>
                      <th className="py-2 px-3 text-center">Citas Logradas</th>
                      <th className="py-2 px-3 text-center">Cierres</th>
                      <th className="py-2 px-3 text-right">Ratios de Conversión</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/60 text-xs text-slate-700">
                    {asistentes.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-3 px-3 text-center italic text-slate-400 text-[11px]">
                          No hay asistentes registradas en el sistema.
                        </td>
                      </tr>
                    ) : (
                      asistentes.map((as) => {
                        // count real calls registered for this assistant in selected month / overall
                        const llamadasDelMes = filterMonth 
                          ? citas.filter(c => c.asistenteId === as.id && c.fechaLlamada?.startsWith(filterMonth)).length
                          : citas.filter(c => c.asistenteId === as.id && !!c.fechaLlamada).length;

                        // filter appointments for this assistant (excluding prospects, since they are not appointments yet)
                        const citasAsistente = citas.filter(c => c.asistenteId === as.id && c.estadoCita !== EstadoCita.PROSPECTO);
                        const citasFiltradas = filterMonth 
                          ? citasAsistente.filter(c => c.fechaCita && c.fechaCita.startsWith(filterMonth))
                          : citasAsistente;

                        // filter closed/liquidated appointments
                        const cierresFiltrados = citasFiltradas.filter(c => c.estadoCierre === EstadoCierre.CERRADO || c.estadoCierre === EstadoCierre.LIQUIDADO);

                        // calculate conversion ratios
                        const ratioLlamadasCitas = llamadasDelMes > 0 
                          ? ((citasFiltradas.length / llamadasDelMes) * 100).toFixed(1)
                          : '0.0';

                        const ratioCitasCierres = citasFiltradas.length > 0
                          ? ((cierresFiltrados.length / citasFiltradas.length) * 100).toFixed(1)
                          : '0.0';

                        return (
                          <tr key={as.id} className="hover:bg-white transition-colors">
                            <td className="py-2.5 px-3">
                              <span className="font-bold text-slate-800">{as.nombreCompleto}</span>
                              <span className="text-[9px] text-slate-400 font-mono block">Cargo: {as.cargo}</span>
                            </td>
                            <td className="py-2.5 px-3 text-center font-mono font-semibold text-slate-500">
                              {filterMonth ? formatToDDMMYYYY(filterMonth) : "Histórico Total"}
                            </td>
                            <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-900">
                              {llamadasDelMes}
                            </td>
                            <td className="py-2.5 px-3 text-center font-mono font-bold text-primary">
                              {citasFiltradas.length}
                            </td>
                            <td className="py-2.5 px-3 text-center font-mono font-bold text-emerald-600">
                              {cierresFiltrados.length}
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <div className="space-y-0.5">
                                <span className="text-[10px] font-mono text-slate-600 block">
                                  Llam. ➔ Cita: <strong className="text-primary font-bold">{ratioLlamadasCitas}%</strong>
                                </span>
                                <span className="text-[10px] font-mono text-slate-600 block">
                                  Cita ➔ Cierre: <strong className="text-emerald-600 font-bold">{ratioCitasCierres}%</strong>
                                </span>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </div>

        {/* Right column: strategic advice and policies */}
        <div className="space-y-6">
          
          {/* Compensation summary card */}
          <div className="bg-white p-5 rounded-md border border-slate-200 shadow-sm space-y-4" id="compensation_policy_summary">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <Award className="w-4.5 h-4.5 text-primary" />
              Esquema de Compensación Híbrido
            </h3>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-150 rounded space-y-1">
                <h4 className="font-bold text-slate-800 flex justify-between">
                  <span>1. Sueldo Fijo Mensual</span>
                  <span className="text-primary font-mono">{formatPEN(config.rmvVigente)}</span>
                </h4>
                <p className="text-slate-500 text-[11px]">
                  Remuneración Mínima Vital (RMV) vigente en el Perú, de abono permanente e independiente de los resultados de cierres.
                </p>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-150 rounded space-y-1">
                <h4 className="font-bold text-slate-800 flex justify-between">
                  <span>2. Bonos Variables</span>
                  <span className="text-primary font-mono">Por Cierre</span>
                </h4>
                <p className="text-slate-500 text-[11px]">
                  Un incentivo económico de abono directo y variable basado en cada cierre de venta (por defecto S/ {config.bonoVentaPredeterminado}) o de alquiler (por defecto S/ {config.bonoAlquilerPredeterminado}) gestado a partir de las citas que ella haya agendado.
                </p>
              </div>
            </div>
          </div>

          {/* Core motivation & strategy rules */}
          <div className="bg-gradient-to-br from-blue-50/50 to-white p-5 rounded-md border border-primary/20 shadow-sm space-y-4" id="strategic_guide_remax">
            <h3 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
              <Info className="w-4.5 h-4.5 text-primary" />
              Estrategia de Captación Inmobiliaria
            </h3>
            
            <div className="space-y-3 text-xs text-slate-600 font-sans">
              <p>
                Como Coordinador y Agente Top, <strong>Oscar Russo</strong> comprende que la generación constante de citas es el combustible de toda la operación inmobiliaria en Lima.
              </p>
              <ul className="list-disc pl-4 space-y-2 text-[11px] text-slate-500">
                <li>
                  <strong className="text-slate-700">Enfoque de la Asistente:</strong> Ella debe concentrar sus esfuerzos diarios en agendar citas calificadas. Esto alimenta el embudo directamente y gatilla sus bonos por cierre.
                </li>
                <li>
                  <strong className="text-slate-700">Actualización Salarial:</strong> Si el sueldo mínimo vital (RMV) es actualizado por decreto gubernamental en Perú, puedes modificar este valor desde la pestaña de Configuración para mantener el presupuesto siempre preciso.
                </li>
                <li>
                  <strong className="text-slate-700">Seguimiento Diario:</strong> Asegúrate de cambiar el estado de las citas a "EXITOSA" y "CERRADO" de manera ágil para mantener motivado al equipo de soporte.
                </li>
              </ul>
            </div>
          </div>

          {/* Quick Shortcuts */}
          <div className="bg-white p-4 rounded-md border border-slate-200 shadow-sm space-y-2" id="quick_links">
            <h4 className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Accesos Rápidos</h4>
            <div className={`grid ${userRole === 'admin' ? 'grid-cols-3' : 'grid-cols-2'} gap-2`}>
              {userRole === 'admin' ? (
                <button
                  onClick={() => onNavigateToTab('asistentes')}
                  className="py-2 text-center border border-slate-200 rounded text-[10px] font-bold hover:bg-slate-50 hover:border-slate-300 text-slate-700 cursor-pointer"
                >
                  Colaboradores
                </button>
              ) : (
                <button
                  onClick={() => onNavigateToTab('citas')}
                  className="py-2 text-center border border-slate-200 rounded text-[10px] font-bold hover:bg-slate-50 hover:border-slate-300 text-slate-700 cursor-pointer"
                >
                  Registrar Llamadas
                </button>
              )}
              <button
                onClick={() => onNavigateToTab('citas')}
                className="py-2 text-center border border-slate-200 rounded text-[10px] font-bold hover:bg-slate-50 hover:border-slate-300 text-slate-700 cursor-pointer"
              >
                Registrar Citas
              </button>
              {userRole === 'admin' && (
                <button
                  onClick={() => onNavigateToTab('liquidacion')}
                  className="py-2 text-center border border-slate-200 rounded text-[10px] font-bold hover:bg-slate-50 hover:border-slate-300 text-slate-700 cursor-pointer"
                >
                  Ver Planilla
                </button>
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
