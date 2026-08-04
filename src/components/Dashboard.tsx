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
  CheckSquare,
  TrendingDown
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  BarChart,
  Bar
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
      <div className="bg-[#0B1120]/95 backdrop-blur-md text-white p-3 rounded-lg border border-[#2A3B5C] shadow-2xl text-xs space-y-1.5 min-w-[180px] z-50 animate-fade-in">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-1.5">
          <span className="w-3 h-3 rounded-full shrink-0 shadow-xs" style={{ backgroundColor: data.color }} />
          <span className="font-bold text-slate-100 text-xs leading-tight">{data.name}</span>
        </div>
        <div className="space-y-1 text-[11px] font-mono">
          <div className="flex justify-between items-center text-slate-300">
            <span>Cantidad:</span>
            <strong className="text-white text-xs">{data.value} {unit}</strong>
          </div>
          <div className="flex justify-between items-center text-slate-300">
            <span>Porcentaje:</span>
            <strong className="text-cyan-400 text-xs">{data.pct}%</strong>
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
      color: '#10B981', // Vibrant Emerald Green
      pct: ((citasRealizadas / totalPie1) * 100).toFixed(1),
      unitLabel: 'citas'
    },
    { 
      name: 'Citas Agendadas', 
      value: citasAgendadas, 
      color: '#3B82F6', // Vibrant Blue
      pct: ((citasAgendadas / totalPie1) * 100).toFixed(1),
      unitLabel: 'citas'
    },
    { 
      name: 'Sin Cita Concretada', 
      value: llamadasSinCita, 
      color: '#64748B', // Slate
      pct: ((llamadasSinCita / totalPie1) * 100).toFixed(1),
      unitLabel: 'llamadas'
    },
    { 
      name: 'Reagendadas / Canceladas', 
      value: citasCanceladas, 
      color: '#F59E0B', // Amber
      pct: ((citasCanceladas / totalPie1) * 100).toFixed(1),
      unitLabel: 'registros'
    }
  ].filter(d => d.value > 0);

  // Pie Chart Data 2: Objeciones / Motivos de Llamada
  const pieColorsMotivos = [
    '#38BDF8', '#6366F1', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#A855F7', '#64748B'
  ];
  
  const pieDataMotivos = motivosStats.length > 0 ? motivosStats.map((item, idx) => ({
    name: item.motivo,
    value: item.count,
    color: pieColorsMotivos[idx % pieColorsMotivos.length],
    pct: item.percentage,
    unitLabel: 'llamadas'
  })) : [
    { name: 'Sin objeciones registradas', value: 1, color: '#64748B', pct: '100.0', unitLabel: 'registros' }
  ];

  // Calculate Monthly Trend Data (Last 6 Months) for the Area Chart
  const monthsMap: Record<string, { monthKey: string; monthLabel: string; llamadas: number; citas: number }> = {};
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const mStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Set', 'Oct', 'Nov', 'Dic'];
    monthsMap[mStr] = {
      monthKey: mStr,
      monthLabel: `${monthNames[d.getMonth()]} ${d.getFullYear().toString().slice(2)}`,
      llamadas: 0,
      citas: 0
    };
  }

  citas.forEach(c => {
    const dateStr = c.fechaLlamada || c.fechaCita;
    if (dateStr && dateStr.length >= 7) {
      const mStr = dateStr.slice(0, 7);
      if (monthsMap[mStr]) {
        if (c.fechaLlamada) monthsMap[mStr].llamadas++;
        if (c.estadoCita === EstadoCita.REALIZADA || c.estadoCierre === EstadoCierre.CERRADO || c.estadoCierre === EstadoCierre.LIQUIDADO) {
          monthsMap[mStr].citas++;
        }
      }
    }
  });

  const monthlyTrendData = Object.values(monthsMap).sort((a, b) => a.monthKey.localeCompare(b.monthKey));

  return (
    <div className="bg-[#080D1A] min-h-screen text-slate-100 p-3 md:p-6 space-y-6 animate-fade-in font-sans" id="dashboard_root">
      
      {/* Sleek Dark Header */}
      <div className="text-center space-y-2 py-4" id="dashboard_header">
        <h1 className="text-2xl md:text-4xl font-extrabold uppercase tracking-widest text-white drop-shadow-md">
          REMAX POWER EXPO — ANALYTICS DASHBOARD
        </h1>
        <p className="text-xs md:text-sm text-cyan-400 font-mono font-semibold tracking-wider flex items-center justify-center gap-2 flex-wrap">
          <span>SISTEMA DE GESTIÓN Y CAPTACIÓN INMOBILIARIA</span>
          <span className="text-slate-600">•</span>
          <span>LIMA, PERÚ</span>
          <span className="text-slate-600">•</span>
          <span className="text-emerald-400 bg-emerald-950/80 border border-emerald-800/80 px-2.5 py-0.5 rounded text-[11px]">
            RMV VIGENTE: {formatPEN(config.rmvVigente)}
          </span>
        </p>

        {/* Period Filter Bar */}
        <div className="pt-2 flex justify-center">
          <div className="inline-flex flex-wrap items-center gap-2.5 bg-[#111A2E] p-2 rounded-xl border border-[#1E2D4A] shadow-xl">
            <div className="flex items-center gap-1.5 px-2 text-cyan-400">
              <Filter className="w-4 h-4 shrink-0" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Periodo:
              </span>
            </div>
            
            <button
              type="button"
              onClick={() => setFilterMonth('')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                filterMonth === '' 
                  ? 'bg-cyan-500 text-slate-950 font-extrabold shadow-lg shadow-cyan-500/20' 
                  : 'bg-[#18233C] text-slate-300 hover:text-white hover:bg-[#202E4C]'
              }`}
            >
              Histórico Completo
            </button>

            <div className="flex items-center gap-2 border-l border-slate-700/80 pl-2.5">
              <span className="text-xs uppercase font-bold text-slate-400">Mes:</span>
              
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
                className="py-1 px-2.5 text-xs bg-[#0B1120] border border-[#2A3B5C] rounded-lg focus:outline-none focus:border-cyan-400 text-white font-bold cursor-pointer"
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
                className="py-1 px-2.5 text-xs bg-[#0B1120] border border-[#2A3B5C] rounded-lg focus:outline-none focus:border-cyan-400 text-white font-mono font-bold cursor-pointer"
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

      {/* Top Metric Cards Row (Matching Model Image top 4-5 cards) */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3.5" id="kpi_grid">
        
        {/* Metric 1 */}
        <div 
          onClick={() => onNavigateToTab('citas')}
          className="bg-[#111A2E] p-4 rounded-xl border border-[#1E2D4A] shadow-lg flex flex-col justify-between transition-all duration-200 hover:-translate-y-1 hover:border-cyan-500/60 hover:shadow-cyan-500/10 cursor-pointer group"
        >
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">BASE PROSPECTOS</span>
          <div className="my-2">
            <span className="text-3xl md:text-4xl font-extrabold text-white font-mono block tracking-tight">
              {totalRegistrosHistoricos}
            </span>
            <span className="text-xs font-semibold text-cyan-400 font-mono mt-1 block">
              +{registrosPeriodo} en periodo
            </span>
          </div>
          <div className="text-[10px] uppercase font-bold text-slate-400 group-hover:text-cyan-300 flex items-center justify-between border-t border-slate-800/80 pt-2">
            <span>Ver Base</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Metric 2 */}
        <div 
          onClick={() => onNavigateToTab('registrar')}
          className="bg-[#111A2E] p-4 rounded-xl border border-[#1E2D4A] shadow-lg flex flex-col justify-between transition-all duration-200 hover:-translate-y-1 hover:border-cyan-500/60 hover:shadow-cyan-500/10 cursor-pointer group"
        >
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">LLAMADAS REALIZADAS</span>
          <div className="my-2">
            <span className="text-3xl md:text-4xl font-extrabold text-white font-mono block tracking-tight">
              {totalLlamadas}
            </span>
            <span className="text-xs font-semibold text-emerald-400 font-mono mt-1 block">
              Prom: {promedioDiarioLlamadasDiasActivos}/día
            </span>
          </div>
          <div className="text-[10px] uppercase font-bold text-slate-400 group-hover:text-cyan-300 flex items-center justify-between border-t border-slate-800/80 pt-2">
            <span>Registrar</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Metric 3 */}
        <div 
          onClick={() => onNavigateToTab('citas')}
          className="bg-[#111A2E] p-4 rounded-xl border border-[#1E2D4A] shadow-lg flex flex-col justify-between transition-all duration-200 hover:-translate-y-1 hover:border-cyan-500/60 hover:shadow-cyan-500/10 cursor-pointer group"
        >
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">CITAS EJECUTADAS</span>
          <div className="my-2">
            <span className="text-3xl md:text-4xl font-extrabold text-emerald-400 font-mono block tracking-tight">
              {citasRealizadas}
            </span>
            <span className="text-xs font-semibold text-slate-300 font-mono mt-1 block">
              {citasAgendadas} en agenda
            </span>
          </div>
          <div className="text-[10px] uppercase font-bold text-slate-400 group-hover:text-emerald-300 flex items-center justify-between border-t border-slate-800/80 pt-2">
            <span>Ver Citas</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Metric 4 */}
        <div 
          onClick={() => onNavigateToTab('citas')}
          className="bg-[#111A2E] p-4 rounded-xl border border-[#1E2D4A] shadow-lg flex flex-col justify-between transition-all duration-200 hover:-translate-y-1 hover:border-cyan-500/60 hover:shadow-cyan-500/10 cursor-pointer group"
        >
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">CAPTACIONES CERRADAS</span>
          <div className="my-2">
            <span className="text-3xl md:text-4xl font-extrabold text-amber-400 font-mono block tracking-tight">
              {cierresConcretados}
            </span>
            <span className="text-xs font-semibold text-cyan-400 font-mono mt-1 block">
              Efectividad: {ratioCitasCierres}%
            </span>
          </div>
          <div className="text-[10px] uppercase font-bold text-slate-400 group-hover:text-amber-300 flex items-center justify-between border-t border-slate-800/80 pt-2">
            <span>Ver Captaciones</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Metric 5 */}
        <div 
          onClick={() => onNavigateToTab(userRole === 'admin' ? 'liquidacion' : 'citas')}
          className="bg-[#111A2E] p-4 rounded-xl border border-[#1E2D4A] shadow-lg flex flex-col justify-between transition-all duration-200 hover:-translate-y-1 hover:border-cyan-500/60 hover:shadow-cyan-500/10 cursor-pointer group col-span-2 md:col-span-1"
        >
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">BONOS GENERALES</span>
          <div className="my-2">
            <span className="text-2xl md:text-3xl font-extrabold text-purple-300 font-mono block tracking-tight">
              {formatPEN(totalBonosGenerados)}
            </span>
            <span className="text-xs font-semibold text-amber-400 font-mono mt-1 block">
              {formatPEN(totalBonosPendientes)} pend.
            </span>
          </div>
          <div className="text-[10px] uppercase font-bold text-slate-400 group-hover:text-purple-300 flex items-center justify-between border-t border-slate-800/80 pt-2">
            <span>{userRole === 'admin' ? 'Liquidar' : 'Ver Bonos'}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </div>
        </div>

      </div>

      {/* Main Charts & Funnel Grid (Matching layout structure of the reference image) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* LEFT & CENTER COLUMN (2/3 width on desktop) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Chart Block 1: Trend Over Time (Area Chart matching reference image) */}
          <div className="bg-[#111A2E] p-5 rounded-2xl border border-[#1E2D4A] shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div>
                <h3 className="text-sm font-extrabold uppercase tracking-widest text-white flex items-center gap-2">
                  <Activity className="w-4 h-4 text-cyan-400" />
                  ACTIVIDAD DE PROSPECCIÓN Y CITAS EN EL TIEMPO
                </h3>
                <p className="text-xs text-slate-400 font-medium mt-0.5">Evolución mensual de llamadas y citas agendadas</p>
              </div>
              <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-950/80 border border-cyan-800/80 px-2.5 py-1 rounded-lg">
                {filterMonth ? `Mes: ${filterMonth}` : 'Tendencia 6 Meses'}
              </span>
            </div>

            <div className="h-[240px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorLlamadas" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#38BDF8" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#38BDF8" stopOpacity={0.0}/>
                    </linearGradient>
                    <linearGradient id="colorCitas" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                  <XAxis dataKey="monthLabel" stroke="#64748B" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748B" fontSize={11} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0B1120', borderColor: '#2A3B5C', borderRadius: '8px', color: '#FFF', fontSize: '12px' }}
                    itemStyle={{ color: '#38BDF8' }}
                  />
                  <Area type="monotone" dataKey="llamadas" name="Llamadas" stroke="#38BDF8" strokeWidth={2.5} fillOpacity={1} fill="url(#colorLlamadas)" />
                  <Area type="monotone" dataKey="citas" name="Citas Ejecutadas" stroke="#10B981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorCitas)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="flex items-center justify-center gap-6 border-t border-slate-800/80 pt-3 text-xs font-mono">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-cyan-400" />
                <span className="text-slate-300">Llamadas Realizadas</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-400" />
                <span className="text-slate-300">Citas Ejecutadas</span>
              </div>
            </div>
          </div>

          {/* Lower Grid inside Left Column (Pie Chart 1 & Objeciones Breakdown) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Donut Chart: Estado de Citas */}
            <div className="bg-[#111A2E] p-5 rounded-2xl border border-[#1E2D4A] shadow-xl flex flex-col justify-between">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-2">
                <h3 className="text-xs font-extrabold uppercase tracking-widest text-white flex items-center gap-1.5">
                  <PieChartIcon className="w-4 h-4 text-emerald-400" />
                  ESTADO DE PROSPECCIÓN Y CITAS
                </h3>
              </div>

              <div className="h-[200px] w-full relative my-2">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieDataEstadoCitas}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                      onMouseEnter={(data) => setHoveredSliceChart1(data.name)}
                      onMouseLeave={() => setHoveredSliceChart1(null)}
                    >
                      {pieDataEstadoCitas.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.color}
                          stroke={hoveredSliceChart1 === entry.name ? '#FFF' : 'none'}
                          strokeWidth={hoveredSliceChart1 === entry.name ? 2 : 0}
                          style={{
                            transform: hoveredSliceChart1 === entry.name ? 'scale(1.05)' : 'scale(1)',
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
                  <span className="text-2xl font-bold font-mono text-white">{totalLlamadas}</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">TOTAL LLAMADAS</span>
                </div>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-slate-800 text-xs font-mono">
                {pieDataEstadoCitas.map((item) => (
                  <div key={item.name} className="flex items-center justify-between text-slate-300 hover:text-white transition-colors">
                    <span className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                      <span className="truncate max-w-[140px] text-slate-300">{item.name}</span>
                    </span>
                    <strong className="text-white">{item.value} ({item.pct}%)</strong>
                  </div>
                ))}
              </div>
            </div>

            {/* Objeciones / Motivos Progress Bars */}
            <div className="bg-[#111A2E] p-5 rounded-2xl border border-[#1E2D4A] shadow-xl flex flex-col justify-between">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-2">
                <h3 className="text-xs font-extrabold uppercase tracking-widest text-white flex items-center gap-1.5">
                  <Target className="w-4 h-4 text-cyan-400" />
                  DISTRIBUCIÓN DE OBJECIONES
                </h3>
                <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                  {motivosStats.length} Tipos
                </span>
              </div>

              <div className="space-y-3 my-2 flex-1 overflow-y-auto max-h-[220px] pr-1 scrollbar-thin">
                {motivosStats.length === 0 ? (
                  <p className="text-slate-500 italic text-xs py-4 text-center">No hay objeciones registradas en este período.</p>
                ) : (
                  motivosStats.map((item, idx) => {
                    const color = pieColorsMotivos[idx % pieColorsMotivos.length];
                    return (
                      <div key={item.motivo} className="space-y-1">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-300 truncate max-w-[170px] font-medium">{item.motivo}</span>
                          <span className="font-mono text-cyan-400 font-bold">{item.count} <span className="text-slate-500 font-normal">({item.percentage}%)</span></span>
                        </div>
                        <div className="w-full h-2 bg-[#18233C] rounded-full overflow-hidden">
                          <div 
                            className="h-full rounded-full transition-all duration-500" 
                            style={{ width: `${Math.min(100, item.percentage)}%`, backgroundColor: color }}
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 font-mono flex justify-between items-center">
                <span>Total Registradas:</span>
                <strong className="text-white">{motivosStats.reduce((s, m) => s + m.count, 0)} objeciones</strong>
              </div>
            </div>

          </div>

        </div>

        {/* RIGHT COLUMN (1/3 width on desktop) */}
        <div className="space-y-6">
          
          {/* CONVERSION FUNNEL TRACKING (Exact style matching the reference image's Funnel) */}
          <div className="bg-[#111A2E] p-5 rounded-2xl border border-[#1E2D4A] shadow-xl space-y-4">
            <div className="text-center border-b border-slate-800 pb-3">
              <h3 className="text-sm font-extrabold uppercase tracking-widest text-white flex items-center justify-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                CONVERSION FUNNEL TRACKING
              </h3>
              <p className="text-[11px] text-slate-400 font-mono mt-0.5">EMBUDO OPERATIVO DE CAPTACIÓN</p>
            </div>

            {/* Inverted Funnel Layers Stack */}
            <div className="space-y-2 py-2 flex flex-col items-center">
              
              {/* Funnel Stage 1 */}
              <div 
                onClick={() => onNavigateToTab('registrar')}
                className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 p-2.5 rounded-lg text-center cursor-pointer hover:scale-[1.02] transition-transform shadow-lg group relative overflow-hidden"
              >
                <div className="text-[10px] font-extrabold uppercase tracking-widest text-slate-950">1. PROSPECCIÓN (LLAMADAS)</div>
                <div className="text-lg font-black font-mono text-white mt-0.5">{totalLlamadas}</div>
                <div className="text-[10px] font-bold text-slate-900 group-hover:underline">REGISTRAR LLAMADAS →</div>
              </div>

              {/* Funnel Stage 2 */}
              <div 
                onClick={() => onNavigateToTab('citas')}
                className="w-[88%] bg-gradient-to-r from-cyan-600 to-teal-500 p-2.5 rounded-lg text-center cursor-pointer hover:scale-[1.02] transition-transform shadow-lg group relative overflow-hidden"
              >
                <div className="text-[10px] font-extrabold uppercase tracking-widest text-slate-950">2. CITAS AGENDADAS</div>
                <div className="text-lg font-black font-mono text-white mt-0.5">{citasAgendadas}</div>
                <div className="text-[10px] font-bold text-slate-900 group-hover:underline">VER AGENDA →</div>
              </div>

              {/* Funnel Stage 3 */}
              <div 
                onClick={() => onNavigateToTab('citas')}
                className="w-[76%] bg-gradient-to-r from-teal-600 to-emerald-500 p-2.5 rounded-lg text-center cursor-pointer hover:scale-[1.02] transition-transform shadow-lg group relative overflow-hidden"
              >
                <div className="text-[10px] font-extrabold uppercase tracking-widest text-slate-950">3. CITAS EJECUTADAS</div>
                <div className="text-lg font-black font-mono text-white mt-0.5">{citasRealizadas}</div>
                <div className="text-[10px] font-bold text-slate-900 group-hover:underline">{ratioLlamadasCitas}% CONVERSIÓN →</div>
              </div>

              {/* Funnel Stage 4 */}
              <div 
                onClick={() => onNavigateToTab('citas')}
                className="w-[64%] bg-gradient-to-r from-emerald-600 to-amber-500 p-2.5 rounded-lg text-center cursor-pointer hover:scale-[1.02] transition-transform shadow-lg group relative overflow-hidden"
              >
                <div className="text-[10px] font-extrabold uppercase tracking-widest text-slate-950">4. CAPTACIONES CERRADAS</div>
                <div className="text-lg font-black font-mono text-white mt-0.5">{cierresConcretados}</div>
                <div className="text-[10px] font-bold text-slate-900 group-hover:underline">{ratioCitasCierres}% DE CITAS →</div>
              </div>

              {/* Funnel Stage 5 */}
              <div 
                onClick={() => onNavigateToTab(userRole === 'admin' ? 'liquidacion' : 'citas')}
                className="w-[52%] bg-gradient-to-r from-amber-500 to-purple-600 p-2.5 rounded-lg text-center cursor-pointer hover:scale-[1.02] transition-transform shadow-lg group relative overflow-hidden"
              >
                <div className="text-[10px] font-extrabold uppercase tracking-widest text-slate-950">5. BONOS GENERADOS</div>
                <div className="text-base font-black font-mono text-white mt-0.5 truncate">{formatPEN(totalBonosGenerados)}</div>
                <div className="text-[10px] font-bold text-slate-950 group-hover:underline">VER BONOS →</div>
              </div>

            </div>

            <div className="p-3 bg-[#0B1120] rounded-xl border border-slate-800 text-xs font-mono text-slate-300 space-y-1.5">
              <div className="flex justify-between items-center">
                <span>Efectividad Prospección:</span>
                <strong className="text-emerald-400 font-bold">{ratioLlamadasCitas}%</strong>
              </div>
              <div className="flex justify-between items-center">
                <span>Ratio Cita ➔ Captación:</span>
                <strong className="text-amber-400 font-bold">{ratioCitasCierres}%</strong>
              </div>
              <div className="flex justify-between items-center border-t border-slate-800 pt-1 mt-1">
                <span>Llamadas requeridas/Cierre:</span>
                <strong className="text-cyan-400 font-bold">{promedioLlamadasPorCierre}</strong>
              </div>
            </div>
          </div>

          {/* TEAM PERFORMANCE TABLE (Sleek Dark Style) */}
          <div className="bg-[#111A2E] p-5 rounded-2xl border border-[#1E2D4A] shadow-xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-xs font-extrabold uppercase tracking-widest text-white flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-cyan-400" />
                  DESEMPEÑO DEL EQUIPO
                </h3>
                <p className="text-[11px] text-slate-400 font-medium">Asistentes de Captación</p>
              </div>
              <button
                onClick={() => onNavigateToTab(userRole === 'admin' ? 'asistentes' : 'citas')}
                className="text-xs font-bold text-cyan-400 hover:text-cyan-300 uppercase cursor-pointer"
              >
                Gestionar →
              </button>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#0B1120] border-b border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-2.5 px-3">Asistente</th>
                    <th className="py-2.5 px-1.5 text-center">Llam.</th>
                    <th className="py-2.5 px-1.5 text-center">Citas</th>
                    <th className="py-2.5 px-1.5 text-center">Cierres</th>
                    <th className="py-2.5 px-2 text-right">Efect.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-xs text-slate-200 font-mono">
                  {asistentes.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-4 px-3 text-center italic text-slate-500 text-xs font-sans">
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
                        <tr key={as.id} className="hover:bg-[#18233C] transition-colors">
                          <td className="py-2.5 px-3 font-sans">
                            <span className="font-bold text-white block text-xs truncate max-w-[110px]">{as.nombreCompleto}</span>
                            <span className="text-[10px] text-slate-400 font-mono">{as.cargo}</span>
                          </td>
                          <td className="py-2.5 px-1.5 text-center font-bold text-white">
                            {llamadasDelMes}
                          </td>
                          <td className="py-2.5 px-1.5 text-center font-bold text-emerald-400">
                            {citasEjecutadasAsistente}
                          </td>
                          <td className="py-2.5 px-1.5 text-center font-bold text-amber-400">
                            {cierresFiltrados.length}
                          </td>
                          <td className="py-2.5 px-2 text-right">
                            <span className="text-xs font-bold text-cyan-400">
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

    </div>
  );
}
