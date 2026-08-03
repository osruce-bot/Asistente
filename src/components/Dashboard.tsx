/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Users, 
  Calendar, 
  TrendingUp, 
  Coins, 
  Activity, 
  Sparkles, 
  Phone,
  Award,
  Layers,
  Zap,
  ChevronRight,
  PieChart as PieChartIcon,
  Target,
  Clock,
  ArrowRight,
  CheckCircle2,
  Filter,
  BarChart3,
  Building2,
  MapPin,
  CheckSquare
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip
} from 'recharts';
import { Asistente, Cita, EstadoCita, EstadoCierre, ConfigGeneral } from '../types';
import { formatPEN } from '../utils/currency';

interface DashboardProps {
  asistentes: Asistente[];
  citas: Cita[];
  config: ConfigGeneral;
  onNavigateToTab: (tab: string) => void;
  userRole?: 'admin' | 'asistente' | null;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    payload: {
      name: string;
      value: number;
      color: string;
      pct: string | number;
      unitLabel?: string;
    };
  }>;
}

function CustomLegendTooltip({ active, payload }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const unit = data.unitLabel || 'registros';
    return (
      <div className="bg-slate-900/95 backdrop-blur-xs text-white p-2.5 rounded-md border border-slate-700 shadow-xl text-xs space-y-1.5 min-w-[180px] z-50 animate-fade-in">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-1.5">
          <span className="w-3 h-3 rounded-full shrink-0 shadow-xs" style={{ backgroundColor: data.color }} />
          <span className="font-bold text-slate-100 text-[11px] leading-tight">{data.name}</span>
        </div>
        <div className="space-y-1 text-[11px] font-mono">
          <div className="flex justify-between items-center text-slate-300">
            <span>Cantidad:</span>
            <strong className="text-white text-xs">{data.value} {unit}</strong>
          </div>
          <div className="flex justify-between items-center text-slate-300">
            <span>Porcentaje:</span>
            <strong className="text-emerald-400 text-xs">{data.pct}%</strong>
          </div>
        </div>
      </div>
    );
  }
  return null;
}

export default function Dashboard({
  asistentes,
  citas,
  config,
  onNavigateToTab,
  userRole = 'admin'
}: DashboardProps) {
  // Month Filter State: Defaults to '' (Histórico Completo)
  const [filterMonth, setFilterMonth] = useState<string>('');

  // Interactive Hover states for Pie Charts
  const [hoveredSliceChart1, setHoveredSliceChart1] = useState<string | null>(null);
  const [hoveredSliceChart2, setHoveredSliceChart2] = useState<string | null>(null);

  // 1. Registros Históricos Totales (A lo largo del tiempo)
  const totalRegistrosHistoricos = citas.length;

  // Filter appointments by selected month (only real appointments, not prospects)
  const filteredCitas = filterMonth
    ? citas.filter(c => c.estadoCita !== EstadoCita.PROSPECTO && c.fechaCita && c.fechaCita.startsWith(filterMonth))
    : citas.filter(c => c.estadoCita !== EstadoCita.PROSPECTO);

  // Calls made in period (including prospects with registered call date)
  const llamadasFiltradas = filterMonth
    ? citas.filter(c => c.fechaLlamada?.startsWith(filterMonth))
    : citas.filter(c => !!c.fechaLlamada);

  const totalLlamadas = llamadasFiltradas.length;

  // Promedio Diario de Llamadas Realizadas
  const fechasConLlamadas = Array.from(new Set(llamadasFiltradas.map(c => c.fechaLlamada).filter(Boolean))) as string[];
  const diasActivosLlamadas = fechasConLlamadas.length || 1;
  const promedioDiarioLlamadasDiasActivos = (totalLlamadas / diasActivosLlamadas).toFixed(1);

  // Registros gestionados en el período
  const registrosPeriodo = filterMonth
    ? citas.filter(c => (c.fechaLlamada && c.fechaLlamada.startsWith(filterMonth)) || (c.fechaCita && c.fechaCita.startsWith(filterMonth))).length
    : totalRegistrosHistoricos;

  // Appointment states
  const citasAgendadas = filteredCitas.filter(c => c.estadoCita === EstadoCita.AGENDADA).length;
  // Citas Logradas / Ejecutadas
  const citasRealizadas = filteredCitas.filter(
    c => c.estadoCita === EstadoCita.REALIZADA || c.estadoCierre === EstadoCierre.CERRADO || c.estadoCierre === EstadoCierre.LIQUIDADO
  ).length;
  const citasCanceladas = filteredCitas.filter(c => c.estadoCita === EstadoCita.CANCELADA || c.estadoCita === EstadoCita.REPROGRAMAR).length;
  
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

  const totalBonosGenerados = totalBonosPendientes + totalBonosLiquidados;

  // Conversion rates based strictly on executed appointments
  const ratioLlamadasCitas = totalLlamadas > 0 ? ((citasRealizadas / totalLlamadas) * 100).toFixed(1) : '0.0';
  const ratioCitasCierres = citasRealizadas > 0 ? ((cierresConcretados / citasRealizadas) * 100).toFixed(1) : '0.0';

  const promedioLlamadasPorCierre = cierresConcretados > 0 ? (totalLlamadas / cierresConcretados).toFixed(1) : '0';

  // Analizar motivos de seguimiento / objeciones
  const citasConMotivo = filterMonth
    ? citas.filter(c => {
        const dateStr = c.fechaCita || c.fechaLlamada || '';
        return dateStr.startsWith(filterMonth);
      })
    : citas;

  const motivosList = [
    "Solo trato directo",
    "Trabaja en abierto (multiagente)",
    "Tiene exclusiva (otra agencia)",
    "Malas experiencias",
    "Agente Inmobiliario",
    "No contesta / Reagendar",
    "No desea exclusividad",
    "Ya vendido / Alquilado"
  ];

  const motivosStats = motivosList.map(motivo => {
    const count = citasConMotivo.filter(c => c.notas === motivo).length;
    const percentage = totalLlamadas > 0 ? Number(((count / totalLlamadas) * 100).toFixed(1)) : 0;
    return { motivo, count, percentage };
  }).filter(m => m.count > 0).sort((a, b) => b.count - a.count);

  // Pie Chart Data 1: Estado de Prospección y Citas
  const llamadasSinCita = Math.max(0, totalLlamadas - (citasRealizadas + citasAgendadas + citasCanceladas));
  const totalPie1 = (citasRealizadas + citasAgendadas + llamadasSinCita + citasCanceladas) || 1;
  
  const pieDataEstadoCitas = [
    { 
      name: 'Citas Ejecutadas', 
      value: citasRealizadas, 
      color: '#059669', // Intense Emerald Green
      pct: ((citasRealizadas / totalPie1) * 100).toFixed(1),
      unitLabel: 'citas'
    },
    { 
      name: 'Citas Agendadas', 
      value: citasAgendadas, 
      color: '#2563EB', // Intense Royal Blue
      pct: ((citasAgendadas / totalPie1) * 100).toFixed(1),
      unitLabel: 'citas'
    },
    { 
      name: 'Sin Cita Concretada', 
      value: llamadasSinCita, 
      color: '#475569', // Intense Slate Gray
      pct: ((llamadasSinCita / totalPie1) * 100).toFixed(1),
      unitLabel: 'llamadas'
    },
    { 
      name: 'Reagendadas / Canceladas', 
      value: citasCanceladas, 
      color: '#D97706', // Intense Amber
      pct: ((citasCanceladas / totalPie1) * 100).toFixed(1),
      unitLabel: 'registros'
    }
  ].filter(d => d.value > 0);

  // Pie Chart Data 2: Objeciones / Motivos de Llamada
  const pieColorsMotivos = [
    '#4F46E5', '#2563EB', '#0284C7', '#059669', '#D97706', '#DC2626', '#7C3AED', '#475569'
  ];
  
  const pieDataMotivos = motivosStats.length > 0 ? motivosStats.map((item, idx) => ({
    name: item.motivo,
    value: item.count,
    color: pieColorsMotivos[idx % pieColorsMotivos.length],
    pct: item.percentage,
    unitLabel: 'llamadas'
  })) : [
    { name: 'Sin objeciones registradas', value: 1, color: '#94A3B8', pct: '100.0', unitLabel: 'registros' }
  ];

  // Feed: Próximas Citas o Tareas Pendientes
  const proximasCitas = citas
    .filter(c => c.estadoCita === EstadoCita.AGENDADA)
    .sort((a, b) => (a.fechaCita || '').localeCompare(b.fechaCita || ''))
    .slice(0, 5);

  return (
    <div className="space-y-4 animate-fade-in text-slate-800" id="dashboard_root">
      
      {/* Header Bar & Filter Controls */}
      <div className="bg-slate-900 rounded-lg border border-slate-800 text-white shadow-md p-5 relative overflow-hidden" id="dashboard_header">
        <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:16px_16px] opacity-25" />
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm">
                <BarChart3 className="w-4 h-4 text-white" />
                REMAX POWER EXPO — PANEL CONTROL
              </span>
              <span className="text-xs font-mono text-slate-200 bg-slate-800 px-3 py-1 rounded-full border border-slate-700 font-bold">
                Lima, Perú
              </span>
              <span className="text-xs font-bold text-emerald-300 bg-emerald-950 border border-emerald-700 px-3 py-1 rounded-full">
                Sueldo Fijo RMV: {formatPEN(config.rmvVigente)}
              </span>
            </div>
            <h2 className="text-xl md:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              Panel de Control & Embudo de Captación
            </h2>
          </div>

          {/* Integrated Filter Controls with Month/Year Dropdown */}
          <div className="flex flex-wrap items-center gap-2.5 bg-slate-800 p-2.5 rounded-lg border border-slate-700 shadow-sm self-start lg:self-center shrink-0">
            <div className="flex items-center gap-1.5 px-1">
              <Filter className="w-4 h-4 text-blue-400 shrink-0" />
              <span className="text-xs font-bold uppercase text-slate-200 tracking-wider">
                Filtro Periodo:
              </span>
            </div>
            
            <button
              type="button"
              onClick={() => setFilterMonth('')}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
                filterMonth === '' 
                  ? 'bg-blue-600 text-white shadow-sm' 
                  : 'bg-slate-700 text-slate-200 hover:text-white hover:bg-slate-600'
              }`}
            >
              Histórico Completo
            </button>

            <div className="flex items-center gap-2 border-l border-slate-700 pl-2.5">
              <span className="text-xs uppercase font-bold text-slate-300">Mes:</span>
              
              {/* Desplegable de Mes */}
              <select
                id="dashboard_month_select"
                value={filterMonth ? filterMonth.split('-')[1] : ''}
                onChange={(e) => {
                  const m = e.target.value;
                  if (!m) {
                    setFilterMonth('');
                  } else {
                    const y = filterMonth ? filterMonth.split('-')[0] : String(new Date().getFullYear());
                    setFilterMonth(`${y}-${m}`);
                  }
                }}
                className="py-1.5 px-2.5 text-xs bg-slate-900 border border-slate-700 rounded-md focus:outline-none focus:border-blue-400 text-white font-bold cursor-pointer"
              >
                <option value="">-- Todos --</option>
                <option value="01">Enero</option>
                <option value="02">Febrero</option>
                <option value="03">Marzo</option>
                <option value="04">Abril</option>
                <option value="05">Mayo</option>
                <option value="06">Junio</option>
                <option value="07">Julio</option>
                <option value="08">Agosto</option>
                <option value="09">Setiembre</option>
                <option value="10">Octubre</option>
                <option value="11">Noviembre</option>
                <option value="12">Diciembre</option>
              </select>

              {/* Desplegable de Año */}
              <select
                id="dashboard_year_select"
                value={filterMonth ? filterMonth.split('-')[0] : String(new Date().getFullYear())}
                onChange={(e) => {
                  const y = e.target.value;
                  const currentM = filterMonth ? filterMonth.split('-')[1] : '';
                  if (currentM) {
                    setFilterMonth(`${y}-${currentM}`);
                  }
                }}
                className="py-1.5 px-2.5 text-xs bg-slate-900 border border-slate-700 rounded-md focus:outline-none focus:border-blue-400 text-white font-mono font-bold cursor-pointer"
              >
                {Array.from(new Set([
                  String(new Date().getFullYear()),
                  String(new Date().getFullYear() - 1),
                  String(new Date().getFullYear() + 1),
                  ...citas.map(c => c.fechaCita ? c.fechaCita.split('-')[0] : (c.fechaLlamada ? c.fechaLlamada.split('-')[0] : '')).filter(Boolean)
                ])).sort().reverse().map(yr => (
                  <option key={yr} value={yr}>{yr}</option>
                ))}
              </select>
            </div>
          </div>

        </div>
      </div>

      {/* Pipeline Bar / Funnel Stages */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs" id="pipeline_bar">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-blue-600" />
            Flujo Operativo del Embudo de Captación
          </span>
          <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded">
            {filterMonth ? `Filtro: ${filterMonth}` : 'Histórico Global'}
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5 text-center">
          
          {/* Stage 1 */}
          <div 
            onClick={() => onNavigateToTab('registrar')}
            className="p-2.5 bg-slate-100 border border-slate-300 rounded-md relative group transition-all duration-200 hover:-translate-y-1 hover:scale-[1.03] hover:shadow-md hover:bg-slate-200/90 hover:border-slate-400 hover:ring-2 hover:ring-slate-400/40 cursor-pointer"
          >
            <div className="text-xs font-bold uppercase text-slate-600 group-hover:text-slate-900 transition-colors">1. Prospección</div>
            <div className="text-lg md:text-xl font-bold font-mono text-slate-900 mt-0.5">{totalLlamadas}</div>
            <div className="text-xs font-bold text-slate-600">Llamadas</div>
            <div className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 text-slate-400 z-10 pointer-events-none">
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>

          {/* Stage 2 */}
          <div 
            onClick={() => onNavigateToTab('citas')}
            className="p-2.5 bg-blue-50 border border-blue-300 rounded-md relative group transition-all duration-200 hover:-translate-y-1 hover:scale-[1.03] hover:shadow-md hover:bg-blue-100 hover:border-blue-500 hover:ring-2 hover:ring-blue-400/50 cursor-pointer"
          >
            <div className="text-xs font-bold uppercase text-blue-700 group-hover:text-blue-900 transition-colors">2. Citas Agendadas</div>
            <div className="text-lg md:text-xl font-bold font-mono text-blue-800 mt-0.5">{citasAgendadas}</div>
            <div className="text-xs font-bold text-blue-700">En agenda</div>
            <div className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 text-slate-400 z-10 pointer-events-none">
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>

          {/* Stage 3 */}
          <div 
            onClick={() => onNavigateToTab('citas')}
            className="p-2.5 bg-emerald-50 border border-emerald-300 rounded-md relative group transition-all duration-200 hover:-translate-y-1 hover:scale-[1.03] hover:shadow-md hover:bg-emerald-100 hover:border-emerald-500 hover:ring-2 hover:ring-emerald-400/50 cursor-pointer"
          >
            <div className="text-xs font-bold uppercase text-emerald-800 group-hover:text-emerald-950 transition-colors">3. Citas Ejecutadas</div>
            <div className="text-lg md:text-xl font-bold font-mono text-emerald-800 mt-0.5">{citasRealizadas}</div>
            <div className="text-xs font-bold text-emerald-700">{ratioLlamadasCitas}% conv.</div>
            <div className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 text-slate-400 z-10 pointer-events-none">
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>

          {/* Stage 4 */}
          <div 
            onClick={() => onNavigateToTab('citas')}
            className="p-2.5 bg-amber-50 border border-amber-300 rounded-md relative group transition-all duration-200 hover:-translate-y-1 hover:scale-[1.03] hover:shadow-md hover:bg-amber-100 hover:border-amber-500 hover:ring-2 hover:ring-amber-400/50 cursor-pointer"
          >
            <div className="text-xs font-bold uppercase text-amber-900 group-hover:text-amber-950 transition-colors">4. Cierres / Captados</div>
            <div className="text-lg md:text-xl font-bold font-mono text-amber-900 mt-0.5">{cierresConcretados}</div>
            <div className="text-xs font-bold text-amber-800">{ratioCitasCierres}% de citas</div>
            <div className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 text-slate-400 z-10 pointer-events-none">
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>

          {/* Stage 5 */}
          <div 
            onClick={() => onNavigateToTab(userRole === 'admin' ? 'liquidacion' : 'citas')}
            className="p-2.5 bg-purple-50 border border-purple-300 rounded-md col-span-2 md:col-span-1 group transition-all duration-200 hover:-translate-y-1 hover:scale-[1.03] hover:shadow-md hover:bg-purple-100 hover:border-purple-500 hover:ring-2 hover:ring-purple-400/50 cursor-pointer"
          >
            <div className="text-xs font-bold uppercase text-purple-800 group-hover:text-purple-950 transition-colors">5. Bonos Ganados</div>
            <div className="text-lg md:text-xl font-bold font-mono text-purple-900 mt-0.5">{formatPEN(totalBonosGenerados)}</div>
            <div className="text-xs font-bold text-purple-700">Comisión Asistente</div>
          </div>

        </div>
      </div>

      {/* Metric KPI Cards with distinct background tonality and interactive hover highlights */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3" id="kpi_grid">
        
        {/* KPI 1: Registros Históricos - Indigo Tonalidad */}
        <div 
          onClick={() => onNavigateToTab('citas')}
          className="p-3.5 bg-gradient-to-br from-indigo-50/90 via-slate-50/80 to-indigo-100/40 rounded-lg border border-indigo-200 shadow-2xs flex flex-col justify-between transition-all duration-200 hover:-translate-y-1 hover:scale-[1.03] hover:shadow-md hover:border-indigo-400 hover:ring-2 hover:ring-indigo-400/50 hover:from-indigo-100 hover:to-indigo-50 cursor-pointer group"
        >
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] uppercase font-bold text-indigo-900 group-hover:text-indigo-950 transition-colors tracking-wider">Base de Prospectos</span>
            <div className="p-1.5 bg-indigo-600 text-white rounded-md border border-indigo-500 shrink-0 shadow-2xs group-hover:scale-110 transition-transform">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 space-y-0.5">
            <span className="text-2xl font-bold text-indigo-950 font-mono block">
              {totalRegistrosHistoricos}
            </span>
            <div className="text-xs text-indigo-800 font-medium truncate">
              <span className="text-indigo-700 font-bold font-mono">+{registrosPeriodo}</span> en este período
            </div>
          </div>
          <button 
            type="button"
            className="mt-2.5 text-xs text-indigo-700 group-hover:text-indigo-900 font-bold text-left cursor-pointer flex items-center gap-0.5 group-hover:underline"
          >
            Ver Base Registros <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>

        {/* KPI 2: Total Llamadas - Blue Tonalidad */}
        <div 
          onClick={() => onNavigateToTab('registrar')}
          className="p-3.5 bg-gradient-to-br from-blue-50/90 via-slate-50/80 to-blue-100/40 rounded-lg border border-blue-200 shadow-2xs flex flex-col justify-between transition-all duration-200 hover:-translate-y-1 hover:scale-[1.03] hover:shadow-md hover:border-blue-400 hover:ring-2 hover:ring-blue-400/50 hover:from-blue-100 hover:to-blue-50 cursor-pointer group"
        >
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] uppercase font-bold text-blue-900 group-hover:text-blue-950 transition-colors tracking-wider">Prospección Telefónica</span>
            <div className="p-1.5 bg-blue-600 text-white rounded-md border border-blue-500 shrink-0 shadow-2xs group-hover:scale-110 transition-transform">
              <Phone className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 space-y-0.5">
            <span className="text-2xl font-bold text-blue-950 font-mono block">
              {totalLlamadas}
            </span>
            <div className="text-xs text-slate-700 font-bold font-mono flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>Prom: <strong className="text-blue-700">{promedioDiarioLlamadasDiasActivos}</strong>/día</span>
            </div>
          </div>
          <button 
            type="button"
            className="mt-2.5 text-xs text-blue-700 group-hover:text-blue-900 font-bold text-left cursor-pointer flex items-center gap-0.5 group-hover:underline"
          >
            Registrar Llamadas <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>

        {/* KPI 3: Citas Logradas - Emerald Tonalidad */}
        <div 
          onClick={() => onNavigateToTab('citas')}
          className="p-3.5 bg-gradient-to-br from-emerald-50/90 via-slate-50/80 to-emerald-100/40 rounded-lg border border-emerald-200 shadow-2xs flex flex-col justify-between transition-all duration-200 hover:-translate-y-1 hover:scale-[1.03] hover:shadow-md hover:border-emerald-400 hover:ring-2 hover:ring-emerald-400/50 hover:from-emerald-100 hover:to-emerald-50 cursor-pointer group"
        >
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] uppercase font-bold text-emerald-900 group-hover:text-emerald-950 transition-colors tracking-wider">Citas Ejecutadas</span>
            <div className="p-1.5 bg-emerald-600 text-white rounded-md border border-emerald-500 shrink-0 shadow-2xs group-hover:scale-110 transition-transform">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 space-y-0.5">
            <span className="text-2xl font-bold text-emerald-800 font-mono block">
              {citasRealizadas}
            </span>
            <div className="text-xs text-slate-700 font-semibold font-mono">
              <span className="text-blue-700 font-bold">{citasAgendadas} agend.</span> • <span className="text-slate-500">{citasCanceladas} cancel.</span>
            </div>
          </div>
          <button 
            type="button"
            className="mt-2.5 text-xs text-emerald-700 group-hover:text-emerald-900 font-bold text-left cursor-pointer flex items-center gap-0.5 group-hover:underline"
          >
            Ver Citas Ejecutadas <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>

        {/* KPI 4: Cierres Concretados - Amber Tonalidad */}
        <div 
          onClick={() => onNavigateToTab('citas')}
          className="p-3.5 bg-gradient-to-br from-amber-50/90 via-slate-50/80 to-amber-100/40 rounded-lg border border-amber-200 shadow-2xs flex flex-col justify-between transition-all duration-200 hover:-translate-y-1 hover:scale-[1.03] hover:shadow-md hover:border-amber-400 hover:ring-2 hover:ring-amber-400/50 hover:from-amber-100 hover:to-amber-50 cursor-pointer group"
        >
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] uppercase font-bold text-amber-900 group-hover:text-amber-950 transition-colors tracking-wider">Captaciones Cerradas</span>
            <div className="p-1.5 bg-amber-600 text-white rounded-md border border-amber-500 shrink-0 shadow-2xs group-hover:scale-110 transition-transform">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 space-y-0.5">
            <span className="text-2xl font-bold text-amber-950 font-mono block">
              {cierresConcretados}
            </span>
            <div className="text-xs text-amber-900 font-semibold font-mono">
              {cierresPendientes} en proceso
            </div>
          </div>
          <button 
            type="button"
            className="mt-2.5 text-xs text-amber-800 group-hover:text-amber-950 font-bold text-left cursor-pointer flex items-center gap-0.5 group-hover:underline"
          >
            Ver Captaciones <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>

        {/* KPI 5: Bonos Variables - Purple Tonalidad */}
        <div 
          onClick={() => onNavigateToTab(userRole === 'admin' ? 'liquidacion' : 'citas')}
          className="p-3.5 bg-gradient-to-br from-purple-50/90 via-slate-50/80 to-purple-100/40 rounded-lg border border-purple-200 shadow-2xs flex flex-col justify-between transition-all duration-200 hover:-translate-y-1 hover:scale-[1.03] hover:shadow-md hover:border-purple-400 hover:ring-2 hover:ring-purple-400/50 hover:from-purple-100 hover:to-purple-50 cursor-pointer group col-span-2 md:col-span-1"
        >
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] uppercase font-bold text-purple-900 group-hover:text-purple-950 transition-colors tracking-wider">Bonos por Cierres</span>
            <div className="p-1.5 bg-purple-600 text-white rounded-md border border-purple-500 shrink-0 shadow-2xs group-hover:scale-110 transition-transform">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 space-y-0.5">
            <span className="text-2xl font-bold text-purple-900 font-mono block">
              {formatPEN(totalBonosGenerados)}
            </span>
            <div className="text-xs text-slate-700 font-semibold font-mono">
              <span className="text-amber-800 font-bold">{formatPEN(totalBonosPendientes)} por liquidar</span>
            </div>
          </div>
          <button 
            type="button"
            className="mt-2.5 text-xs text-purple-800 group-hover:text-purple-950 font-bold text-left cursor-pointer flex items-center gap-0.5 group-hover:underline"
          >
            {userRole === 'admin' ? 'Liquidar Planilla' : 'Detalle Bonos'} <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>

      </div>

      {/* Main Unified Grid (2 Pie Charts + Assistant Performance Table) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch" id="main_charts_and_team">
        
        {/* PIE CHART 1: Embudo y Conversión de Citas */}
        <div className="bg-white p-4.5 rounded-lg border border-slate-200 shadow-xs flex flex-col justify-between min-h-[480px]">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
              <PieChartIcon className="w-4.5 h-4.5 text-emerald-600" />
              Estado de Prospección y Citas
            </h3>
            <span className="text-xs font-mono text-emerald-800 bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 rounded font-bold">
              {ratioLlamadasCitas}% efectividad
            </span>
          </div>

          <div className="h-[220px] w-full relative my-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieDataEstadoCitas}
                  cx="50%"
                  cy="50%"
                  innerRadius={52}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                  onMouseEnter={(data) => setHoveredSliceChart1(data.name)}
                  onMouseLeave={() => setHoveredSliceChart1(null)}
                >
                  {pieDataEstadoCitas.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.color}
                      stroke={hoveredSliceChart1 === entry.name ? '#0F172A' : 'none'}
                      strokeWidth={hoveredSliceChart1 === entry.name ? 2.5 : 0}
                      style={{
                        transform: hoveredSliceChart1 === entry.name ? 'scale(1.06)' : 'scale(1)',
                        transformOrigin: 'center center',
                        transition: 'all 0.2s ease-in-out',
                        cursor: 'pointer'
                      }}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomLegendTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xl font-bold font-mono text-slate-900">{totalLlamadas}</span>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Llamadas</span>
            </div>
          </div>

          {/* Detailed Legend & Conversion Ratios */}
          <div className="space-y-3 border-t border-slate-100 pt-3 text-xs flex-1 flex flex-col justify-between">
            <div className="grid grid-cols-2 gap-2 font-mono">
              {pieDataEstadoCitas.map((item) => {
                const isHovered = hoveredSliceChart1 === item.name;
                return (
                  <div 
                    key={item.name} 
                    onMouseEnter={() => setHoveredSliceChart1(item.name)}
                    onMouseLeave={() => setHoveredSliceChart1(null)}
                    className={`flex items-center justify-between gap-1 p-1.5 rounded transition-colors cursor-pointer ${
                      isHovered ? 'bg-slate-100 font-bold border border-slate-300 shadow-2xs' : 'hover:bg-slate-50'
                    }`}
                  >
                    <span className="flex items-center gap-1.5 truncate max-w-[125px]">
                      <span className="w-3 h-3 rounded-full shrink-0 shadow-xs" style={{ backgroundColor: item.color }} />
                      <span className="text-slate-700 truncate font-semibold">{item.name}:</span>
                    </span>
                    <strong className="text-slate-900 shrink-0">{item.value} <span className="text-[10px] text-slate-500 font-normal">({item.pct}%)</span></strong>
                  </div>
                );
              })}
            </div>

            <div className="bg-slate-50 p-2.5 rounded-md border border-slate-200 flex items-center justify-between text-xs text-slate-700 font-mono mt-auto">
              <span>Ratio Cita ➔ Cierre: <strong className="text-emerald-700 font-bold">{ratioCitasCierres}%</strong></span>
              <span>Llamadas/Cierre: <strong className="text-blue-700 font-bold">{promedioLlamadasPorCierre}</strong></span>
            </div>
          </div>
        </div>

        {/* PIE CHART 2: Objeciones y Razones de Prospección */}
        <div className="bg-white p-4.5 rounded-lg border border-slate-200 shadow-xs flex flex-col justify-between min-h-[480px]">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
              <PieChartIcon className="w-4.5 h-4.5 text-primary" />
              Distribución de Objeciones
            </h3>
            <span className="text-xs font-mono text-slate-700 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded font-bold">
              {motivosStats.length} categorías
            </span>
          </div>

          <div className="h-[210px] w-full relative my-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieDataMotivos}
                  cx="50%"
                  cy="50%"
                  innerRadius={48}
                  outerRadius={82}
                  paddingAngle={2.5}
                  dataKey="value"
                  onMouseEnter={(data) => setHoveredSliceChart2(data.name)}
                  onMouseLeave={() => setHoveredSliceChart2(null)}
                >
                  {pieDataMotivos.map((entry, index) => (
                    <Cell 
                      key={`cell-motivo-${index}`} 
                      fill={entry.color}
                      stroke={hoveredSliceChart2 === entry.name ? '#0F172A' : 'none'}
                      strokeWidth={hoveredSliceChart2 === entry.name ? 2.5 : 0}
                      style={{
                        transform: hoveredSliceChart2 === entry.name ? 'scale(1.06)' : 'scale(1)',
                        transformOrigin: 'center center',
                        transition: 'all 0.2s ease-in-out',
                        cursor: 'pointer'
                      }}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomLegendTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-lg font-bold font-mono text-slate-900">{motivosStats.reduce((s, m) => s + m.count, 0)}</span>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Motivos</span>
            </div>
          </div>

          {/* Motivos List - All 6 visible without scrollbar */}
          <div className="space-y-1.5 border-t border-slate-100 pt-3 text-xs flex-1 overflow-visible">
            {motivosStats.length === 0 ? (
              <p className="text-slate-500 italic text-xs">No hay notas u objeciones registradas en el período.</p>
            ) : (
              motivosStats.map((item, idx) => {
                const color = pieColorsMotivos[idx % pieColorsMotivos.length];
                const isHovered = hoveredSliceChart2 === item.motivo;
                return (
                  <div 
                    key={item.motivo} 
                    onMouseEnter={() => setHoveredSliceChart2(item.motivo)}
                    onMouseLeave={() => setHoveredSliceChart2(null)}
                    className={`flex justify-between items-center py-1 px-2 rounded transition-colors cursor-pointer ${
                      isHovered ? 'bg-slate-100 font-bold border border-slate-300' : 'hover:bg-slate-50'
                    }`}
                  >
                    <span className="flex items-center gap-2 truncate max-w-[200px] text-slate-800 font-semibold">
                      <span 
                        className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs" 
                        style={{ backgroundColor: color }} 
                      />
                      <span className="truncate">{item.motivo}</span>
                    </span>
                    <span className="font-mono text-slate-900 font-bold shrink-0 ml-1">
                      {item.count} <span className="text-slate-500 font-normal text-[11px]">({item.percentage}%)</span>
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* TEAM PERFORMANCE TABLE */}
        <div className="bg-white p-4.5 rounded-lg border border-slate-200 shadow-xs flex flex-col justify-between min-h-[480px]">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="space-y-0.5">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                <Users className="w-4.5 h-4.5 text-primary" />
                Desempeño del Equipo
              </h3>
              <p className="text-xs text-slate-500 font-medium">Métricas por Asistente de Captación</p>
            </div>
            <button
              onClick={() => onNavigateToTab(userRole === 'admin' ? 'asistentes' : 'citas')}
              className="text-xs font-bold text-primary hover:underline uppercase cursor-pointer"
            >
              Gestionar →
            </button>
          </div>

          <div className="border border-slate-200 rounded-md overflow-hidden flex-1 my-2">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 text-[10px] font-bold text-slate-700 uppercase tracking-wider">
                  <th className="py-2.5 px-3">Asistente</th>
                  <th className="py-2.5 px-2 text-center">Llam.</th>
                  <th className="py-2.5 px-2 text-center">Citas</th>
                  <th className="py-2.5 px-2 text-center">Cierres</th>
                  <th className="py-2.5 px-3 text-right">Efect.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-800">
                {asistentes.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-4 px-3 text-center italic text-slate-500 text-xs">
                      No hay asistentes registradas.
                    </td>
                  </tr>
                ) : (
                  asistentes.map((as) => {
                    const llamadasDelMes = filterMonth 
                      ? citas.filter(c => c.asistenteId === as.id && c.fechaLlamada?.startsWith(filterMonth)).length
                      : citas.filter(c => c.asistenteId === as.id && !!c.fechaLlamada).length;

                    const citasAsistente = citas.filter(c => c.asistenteId === as.id && c.estadoCita !== EstadoCita.PROSPECTO);
                    const citasFiltradas = filterMonth 
                      ? citasAsistente.filter(c => c.fechaCita && c.fechaCita.startsWith(filterMonth))
                      : citasAsistente;

                    const citasEjecutadasAsistente = citasFiltradas.filter(
                      c => c.estadoCita === EstadoCita.REALIZADA || c.estadoCierre === EstadoCierre.CERRADO || c.estadoCierre === EstadoCierre.LIQUIDADO
                    ).length;

                    const cierresFiltrados = citasFiltradas.filter(c => c.estadoCierre === EstadoCierre.CERRADO || c.estadoCierre === EstadoCierre.LIQUIDADO);

                    const ratioLlamadasCitas = llamadasDelMes > 0 
                      ? ((citasEjecutadasAsistente / llamadasDelMes) * 100).toFixed(1)
                      : '0.0';

                    return (
                      <tr key={as.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-2.5 px-3">
                          <span className="font-bold text-slate-900 block text-xs truncate max-w-[120px]">{as.nombreCompleto}</span>
                          <span className="text-[10px] text-slate-500 font-mono">{as.cargo}</span>
                        </td>
                        <td className="py-2.5 px-2 text-center font-mono font-bold text-slate-900 text-xs">
                          {llamadasDelMes}
                        </td>
                        <td className="py-2.5 px-2 text-center font-mono font-bold text-emerald-700 text-xs">
                          {citasEjecutadasAsistente}
                        </td>
                        <td className="py-2.5 px-2 text-center font-mono font-bold text-amber-800 text-xs">
                          {cierresFiltrados.length}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <span className="text-xs font-mono font-bold text-primary">
                            {ratioLlamadasCitas}%
                          </span>
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
  );
}
