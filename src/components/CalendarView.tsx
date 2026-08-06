import React, { useState, useMemo } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  MapPin, 
  Phone, 
  ExternalLink, 
  Filter, 
  Eye, 
  X, 
  PhoneCall, 
  Calendar as CalendarIcon,
  Search,
  CheckCircle2,
  CalendarDays,
  CalendarX,
  RotateCcw
} from 'lucide-react';
import { Cita, Asistente, EstadoCita } from '../types';
import { formatToDDMMYYYY } from '../utils/currency';
import { getLocalDateString } from '../utils/date';
import { capitalizeWords } from '../utils/string';

interface CalendarViewProps {
  citas: Cita[];
  asistentes: Asistente[];
  onSaveCita?: (cita: Cita) => void;
}

export type CalendarScale = 'mes' | 'semana' | 'dia' | 'lista';

export interface CalendarEventItem {
  id: string;
  citaId: string;
  eventType: 'cita' | 'rellamada';
  dateStr: string; // YYYY-MM-DD
  timeStr: string; // HH:mm
  clienteNombre: string;
  clienteCelular: string;
  direccionPropiedad: string;
  distritoPropiedad: string;
  tipoPropiedad: string;
  tipoOperacion: string;
  asistenteNombre: string;
  asistenteId: string;
  estadoCita: EstadoCita;
  notas?: string;
  rawCita: Cita;
}

export default function CalendarView({ citas, asistentes, onSaveCita }: CalendarViewProps) {
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  // View state
  const [scale, setScale] = useState<CalendarScale>('semana');
  const [currentDate, setCurrentDate] = useState<Date>(today);
  const [selectedAsistenteId, setSelectedAsistenteId] = useState<string>('TODOS');
  const [filterType, setFilterType] = useState<'TODOS' | 'CITAS' | 'RELLAMADAS'>('TODOS');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedEvent, setSelectedEvent] = useState<CalendarEventItem | null>(null);

  // Drag and drop state
  const [draggedEvent, setDraggedEvent] = useState<CalendarEventItem | null>(null);
  const [dragOverDate, setDragOverDate] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, evt: CalendarEventItem) => {
    e.dataTransfer.setData('text/plain', JSON.stringify({ citaId: evt.citaId, eventType: evt.eventType }));
    e.dataTransfer.effectAllowed = 'move';
    setDraggedEvent(evt);
  };

  const handleDragOver = (e: React.DragEvent, dateStr: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverDate !== dateStr) {
      setDragOverDate(dateStr);
    }
  };

  const handleDragLeave = (e: React.DragEvent, dateStr: string) => {
    e.preventDefault();
    if (dragOverDate === dateStr) {
      setDragOverDate(null);
    }
  };

  const handleDragEnd = () => {
    setDraggedEvent(null);
    setDragOverDate(null);
  };

  const handleDrop = (e: React.DragEvent, targetDateStr: string) => {
    e.preventDefault();
    setDragOverDate(null);

    if (!draggedEvent) return;

    if (draggedEvent.dateStr === targetDateStr) {
      setDraggedEvent(null);
      return;
    }

    const citaToUpdate = citas.find(c => c.id === draggedEvent.citaId);
    if (!citaToUpdate) {
      setDraggedEvent(null);
      return;
    }

    const updatedCita: Cita = { ...citaToUpdate };

    if (draggedEvent.eventType === 'cita') {
      updatedCita.fechaCita = targetDateStr;
      if (updatedCita.estadoCita === EstadoCita.PROSPECTO) {
        updatedCita.estadoCita = EstadoCita.AGENDADA;
      }
    } else if (draggedEvent.eventType === 'rellamada') {
      updatedCita.fechaNuevaLlamada = targetDateStr;
    }

    if (onSaveCita) {
      onSaveCita(updatedCita);
      const formattedDate = formatToDDMMYYYY(targetDateStr);
      const tipo = draggedEvent.eventType === 'cita' ? 'Cita' : 'Re-llamada';
      setToastMessage(`¡${tipo} de ${draggedEvent.clienteNombre} trasladada exitosamente al ${formattedDate}!`);
      setTimeout(() => setToastMessage(null), 4000);
    }

    setDraggedEvent(null);
  };

  const handleRemoveFromCalendar = (evt: CalendarEventItem) => {
    const citaToUpdate = citas.find(c => c.id === evt.citaId);
    if (!citaToUpdate) return;

    const updatedCita: Cita = { ...citaToUpdate };

    if (evt.eventType === 'cita') {
      // Clear appointment date & reset status to Prospecto so card is removed from calendar but lead stays in Prospectos
      updatedCita.fechaCita = '';
      updatedCita.horaCita = '';
      updatedCita.estadoCita = EstadoCita.PROSPECTO;
    } else if (evt.eventType === 'rellamada') {
      // Clear follow-up call date
      updatedCita.fechaNuevaLlamada = '';
    }

    if (onSaveCita) {
      onSaveCita(updatedCita);
      setToastMessage(`Tarjeta de ${evt.clienteNombre} quitada del calendario. El cliente se mantiene 100% conservado en la lista de Prospectos.`);
      setTimeout(() => setToastMessage(null), 5000);
    }

    setSelectedEvent(null);
  };

  // Month metadata
  const currentYear = currentDate.getFullYear();
  const currentMonthNum = currentDate.getMonth() + 1; // 1-indexed
  const currentMonthStr = `${currentYear}-${String(currentMonthNum).padStart(2, '0')}`;

  const monthNamesSpanish = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  // Map all citations & re-calls into calendar events
  const allEvents = useMemo<CalendarEventItem[]>(() => {
    const events: CalendarEventItem[] = [];

    citas.forEach(c => {
      // Filter by assistant
      if (selectedAsistenteId !== 'TODOS' && c.asistenteId !== selectedAsistenteId) {
        return;
      }

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = (c.clienteNombre || '').toLowerCase().includes(q);
        const matchAddress = (c.direccionPropiedad || '').toLowerCase().includes(q);
        const matchDistrict = (c.distritoPropiedad || '').toLowerCase().includes(q);
        const matchPhone = (c.clienteCelular || '').includes(q);
        if (!matchName && !matchAddress && !matchDistrict && !matchPhone) {
          return;
        }
      }

      // 1. Cita en Campo Event
      if (c.fechaCita) {
        if (filterType === 'TODOS' || filterType === 'CITAS') {
          events.push({
            id: `cita_${c.id}_${c.fechaCita}`,
            citaId: c.id,
            eventType: 'cita',
            dateStr: c.fechaCita,
            timeStr: c.horaCita || '09:00',
            clienteNombre: c.clienteNombre || 'Sin nombre',
            clienteCelular: c.clienteCelular || '',
            direccionPropiedad: c.direccionPropiedad || 'Sin dirección',
            distritoPropiedad: c.distritoPropiedad || '',
            tipoPropiedad: c.tipoPropiedad,
            tipoOperacion: c.tipoOperacion,
            asistenteNombre: c.asistenteNombre || 'No asignada',
            asistenteId: c.asistenteId,
            estadoCita: c.estadoCita,
            notas: c.notas,
            rawCita: c
          });
        }
      }

      // 2. Re-llamada Event
      if (c.fechaNuevaLlamada || c.estadoCita === EstadoCita.REPROGRAMAR) {
        const targetDate = (c.fechaNuevaLlamada && c.fechaNuevaLlamada >= getLocalDateString())
          ? c.fechaNuevaLlamada
          : getLocalDateString();

        if (filterType === 'TODOS' || filterType === 'RELLAMADAS') {
          events.push({
            id: `rellamada_${c.id}_${targetDate}`,
            citaId: c.id,
            eventType: 'rellamada',
            dateStr: targetDate,
            timeStr: '10:00',
            clienteNombre: c.clienteNombre || 'Sin nombre',
            clienteCelular: c.clienteCelular || '',
            direccionPropiedad: c.direccionPropiedad || 'Sin dirección',
            distritoPropiedad: c.distritoPropiedad || '',
            tipoPropiedad: c.tipoPropiedad,
            tipoOperacion: c.tipoOperacion,
            asistenteNombre: c.asistenteNombre || 'No asignada',
            asistenteId: c.asistenteId,
            estadoCita: c.estadoCita,
            notas: c.notas ? `Re-llamada: ${c.notas}` : 'Volver a llamar para seguimiento',
            rawCita: c
          });
        }
      }
    });

    return events;
  }, [citas, selectedAsistenteId, filterType, searchQuery]);

  // Map events by date YYYY-MM-DD
  const eventsByDate = useMemo(() => {
    const map: { [dateStr: string]: CalendarEventItem[] } = {};
    allEvents.forEach(evt => {
      if (!map[evt.dateStr]) {
        map[evt.dateStr] = [];
      }
      map[evt.dateStr].push(evt);
    });
    Object.keys(map).forEach(d => {
      map[d].sort((a, b) => (a.timeStr || '').localeCompare(b.timeStr || ''));
    });
    return map;
  }, [allEvents]);

  // Date Navigation
  const handlePrev = () => {
    const newDate = new Date(currentDate);
    if (scale === 'mes' || scale === 'lista') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else if (scale === 'semana') {
      newDate.setDate(newDate.getDate() - 7);
    } else if (scale === 'dia') {
      newDate.setDate(newDate.getDate() - 1);
    }
    setCurrentDate(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(currentDate);
    if (scale === 'mes' || scale === 'lista') {
      newDate.setMonth(newDate.getMonth() + 1);
    } else if (scale === 'semana') {
      newDate.setDate(newDate.getDate() + 7);
    } else if (scale === 'dia') {
      newDate.setDate(newDate.getDate() + 1);
    }
    setCurrentDate(newDate);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const toYYYYMMDD = (d: Date) => {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  // Week calculation
  const weekDays = useMemo(() => {
    const d = new Date(currentDate);
    let day = d.getDay() - 1; // Mon=0
    if (day === -1) day = 6; // Sun
    
    const startOfWeek = new Date(d);
    startOfWeek.setDate(d.getDate() - day);

    const days: Array<{ date: Date; dateStr: string; dayName: string; dayNum: number; isToday: boolean }> = [];
    const dayNames = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'];

    for (let i = 0; i < 7; i++) {
      const cur = new Date(startOfWeek);
      cur.setDate(startOfWeek.getDate() + i);
      const dateStr = toYYYYMMDD(cur);
      days.push({
        date: cur,
        dateStr,
        dayName: dayNames[i],
        dayNum: cur.getDate(),
        isToday: dateStr === todayStr
      });
    }
    return days;
  }, [currentDate, todayStr]);

  // Month grid calculation
  const monthGridDays = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonthNum - 1, 1);
    const lastDay = new Date(currentYear, currentMonthNum, 0);
    const daysInMonth = lastDay.getDate();

    let startDayOfWeek = firstDay.getDay() - 1;
    if (startDayOfWeek === -1) startDayOfWeek = 6;

    const days: Array<{
      dateStr: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      isToday: boolean;
      dateObj: Date;
    }> = [];

    // Padding previous month
    const prevMonthLastDay = new Date(currentYear, currentMonthNum - 1, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const dayNum = prevMonthLastDay - i;
      let pMonth = currentMonthNum - 1;
      let pYear = currentYear;
      if (pMonth < 1) { pMonth = 12; pYear -= 1; }
      const dateStr = `${pYear}-${String(pMonth).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      days.push({
        dateStr,
        dayNumber: dayNum,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
        dateObj: new Date(pYear, pMonth - 1, dayNum)
      });
    }

    // Current month
    for (let dayNum = 1; dayNum <= daysInMonth; dayNum++) {
      const dateStr = `${currentYear}-${String(currentMonthNum).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      days.push({
        dateStr,
        dayNumber: dayNum,
        isCurrentMonth: true,
        isToday: dateStr === todayStr,
        dateObj: new Date(currentYear, currentMonthNum - 1, dayNum)
      });
    }

    // Padding next month
    const totalCells = days.length > 35 ? 42 : 35;
    const remaining = totalCells - days.length;
    for (let i = 1; i <= remaining; i++) {
      let nMonth = currentMonthNum + 1;
      let nYear = currentYear;
      if (nMonth > 12) { nMonth = 1; nYear += 1; }
      const dateStr = `${nYear}-${String(nMonth).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      days.push({
        dateStr,
        dayNumber: i,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
        dateObj: new Date(currentYear, currentMonthNum - 1, i)
      });
    }

    return days;
  }, [currentYear, currentMonthNum, todayStr]);

  // Header Title Text
  const headerTitle = useMemo(() => {
    if (scale === 'mes' || scale === 'lista') {
      return `${monthNamesSpanish[currentMonthNum - 1]} ${currentYear}`;
    }
    if (scale === 'semana') {
      const first = weekDays[0].date;
      const last = weekDays[6].date;
      return `${first.getDate()} ${monthNamesSpanish[first.getMonth()].slice(0, 3)} - ${last.getDate()} ${monthNamesSpanish[last.getMonth()].slice(0, 3)} ${last.getFullYear()}`;
    }
    if (scale === 'dia') {
      const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
      return `${dayNames[currentDate.getDay()]}, ${currentDate.getDate()} de ${monthNamesSpanish[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
    }
    return '';
  }, [scale, currentMonthNum, currentYear, weekDays, currentDate]);

  // Hours for Day / Week Timeline (8:00 AM - 8:00 PM)
  const hoursList = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'];

  return (
    <div className="flex flex-col min-h-[calc(100vh-140px)] w-full bg-[#0B1120] rounded-2xl border border-[#1E2D4A] shadow-xl overflow-hidden font-sans text-slate-200">
      
      {/* APPLE CALENDAR TOP TOOLBAR */}
      <div className="bg-[#111A2E] px-4 sm:px-6 py-3 border-b border-[#1E2D4A] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shrink-0">
        
        {/* Left Section: Today & Nav + Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleToday}
            className="px-3.5 py-1.5 bg-[#FF3B30] hover:bg-[#E03126] text-white text-xs font-semibold rounded-xl shadow-xs transition-all cursor-pointer active:scale-95 flex items-center gap-1.5"
          >
            <CalendarDays className="w-3.5 h-3.5" />
            Hoy
          </button>

          <div className="flex items-center bg-[#0B1120] rounded-xl p-0.5 border border-[#1E2D4A]">
            <button
              onClick={handlePrev}
              className="p-1.5 hover:bg-[#1E2D4A] text-slate-300 hover:text-white rounded-lg transition-all cursor-pointer"
              title="Anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNext}
              className="p-1.5 hover:bg-[#1E2D4A] text-slate-300 hover:text-white rounded-lg transition-all cursor-pointer"
              title="Siguiente"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <h1 className="text-base sm:text-lg font-bold text-white tracking-tight ml-1">
            {headerTitle}
          </h1>
        </div>

        {/* Center/Right Section: Apple-Style Segmented Control [Día | Semana | Mes | Lista] */}
        <div className="flex flex-wrap items-center justify-between md:justify-end gap-3">
          
          {/* Segmented Control */}
          <div className="bg-[#0B1120] p-1 rounded-xl flex items-center gap-0.5 text-xs font-medium border border-[#1E2D4A]">
            <button
              onClick={() => setScale('dia')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                scale === 'dia' 
                  ? 'bg-[#1E2D4A] text-white font-bold shadow-xs' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Día
            </button>
            <button
              onClick={() => setScale('semana')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                scale === 'semana' 
                  ? 'bg-[#1E2D4A] text-white font-bold shadow-xs' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Semana
            </button>
            <button
              onClick={() => setScale('mes')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                scale === 'mes' 
                  ? 'bg-[#1E2D4A] text-white font-bold shadow-xs' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Mes
            </button>
            <button
              onClick={() => setScale('lista')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                scale === 'lista' 
                  ? 'bg-[#1E2D4A] text-white font-bold shadow-xs' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Lista
            </button>
          </div>

          {/* Quick Filters */}
          <div className="flex items-center gap-2">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(capitalizeWords(e.target.value))}
                placeholder="Buscar cliente, dirección..."
                className="pl-8 pr-3 py-1 bg-[#0B1120] focus:bg-[#111A2E] border border-[#1E2D4A] rounded-xl text-xs font-normal text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 w-36 sm:w-48 transition-all capitalize"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Assistant Filter */}
            <select
              value={selectedAsistenteId}
              onChange={(e) => setSelectedAsistenteId(e.target.value)}
              className="py-1 px-2.5 bg-[#0B1120] border border-[#1E2D4A] rounded-xl text-xs font-medium text-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
            >
              <option value="TODOS" className="bg-[#0B1120] text-slate-200">Todos los Agentes</option>
              {asistentes.map(as => (
                <option key={as.id} value={as.id} className="bg-[#0B1120] text-slate-200">{as.nombreCompleto}</option>
              ))}
            </select>

            {/* Type Filter */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="py-1 px-2.5 bg-[#0B1120] border border-[#1E2D4A] rounded-xl text-xs font-medium text-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
            >
              <option value="TODOS" className="bg-[#0B1120] text-slate-200">Todos Eventos</option>
              <option value="CITAS" className="bg-[#0B1120] text-slate-200">Solo Citas</option>
              <option value="RELLAMADAS" className="bg-[#0B1120] text-slate-200">Solo Re-llamadas</option>
            </select>
          </div>

        </div>
      </div>

      {/* DRAG AND DROP INSTRUCTION BANNER & TOAST */}
      {(scale === 'mes' || scale === 'semana') && (
        <div className="bg-cyan-950/40 px-4 py-2 border-b border-[#1E2D4A] flex items-center justify-between text-xs text-cyan-300">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-cyan-400 animate-pulse shrink-0"></span>
            <span className="font-semibold text-[11px] text-cyan-200">
              <strong>Reprogramación rápida:</strong> Mantén presionada cualquier cita o re-llamada y arrástrala hacia otro día para reprogramar su fecha automáticamente.
            </span>
          </div>
          {draggedEvent && (
            <span className="text-[10px] bg-cyan-500 text-black font-bold px-2 py-0.5 rounded-full shadow-2xs">
              Moviendo: {draggedEvent.clienteNombre}
            </span>
          )}
        </div>
      )}

      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#111A2E] text-white px-4 py-3 rounded-2xl shadow-2xl border border-cyan-500/40 flex items-center gap-3 animate-slide-up max-w-md">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <p className="text-xs font-semibold leading-tight">{toastMessage}</p>
          <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-white ml-2">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* CALENDAR BODY */}
      <div className="flex-1 flex flex-col min-h-0 bg-[#0B1120] overflow-hidden">
        
        {/* SCALE 1: MES (MONTH VIEW) */}
        {scale === 'mes' && (
          <div className="flex-1 flex flex-col min-h-0 w-full">
            {/* Days of week header */}
            <div className="grid grid-cols-7 border-b border-[#1E2D4A] bg-[#111A2E] text-center font-semibold text-[11px] text-slate-400 uppercase tracking-wider py-2">
              <div>Lun</div>
              <div>Mar</div>
              <div>Mié</div>
              <div>Jue</div>
              <div>Vie</div>
              <div className="text-slate-500">Sáb</div>
              <div className="text-slate-500">Dom</div>
            </div>

            {/* Grid of Days filling full height */}
            <div className="flex-1 grid grid-cols-7 divide-x divide-y divide-[#1E2D4A] bg-[#0B1120] overflow-y-auto">
              {monthGridDays.map((cell) => {
                const dayEvents = eventsByDate[cell.dateStr] || [];
                const isHovered = dragOverDate === cell.dateStr;

                return (
                  <div
                    key={cell.dateStr}
                    onDragOver={(e) => handleDragOver(e, cell.dateStr)}
                    onDragLeave={(e) => handleDragLeave(e, cell.dateStr)}
                    onDrop={(e) => handleDrop(e, cell.dateStr)}
                    onClick={() => {
                      setCurrentDate(cell.dateObj);
                      setScale('dia');
                    }}
                    className={`min-h-[110px] sm:min-h-[120px] p-1.5 transition-all flex flex-col justify-start gap-1 group ${
                      isHovered
                        ? 'bg-cyan-950/60 ring-2 ring-cyan-400 ring-inset z-10'
                        : cell.isCurrentMonth
                        ? 'bg-[#111A2E]'
                        : 'bg-[#0B1120]/40 text-slate-600'
                    } ${cell.isToday && !isHovered ? 'bg-cyan-500/10' : ''} hover:bg-[#1E2D4A]/50 cursor-pointer`}
                  >
                    {/* Cell Top Bar */}
                    <div className="flex items-center justify-between mb-0.5 shrink-0">
                      <span className={`text-xs font-semibold font-mono tracking-tight ${
                        cell.isToday 
                          ? 'bg-[#FF3B30] text-white w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center font-bold shadow-xs' 
                          : cell.isCurrentMonth ? 'text-slate-200' : 'text-slate-600'
                      }`}>
                        {cell.dayNumber}
                      </span>

                      {dayEvents.length > 0 && (
                        <span className="text-[9.5px] font-mono font-bold px-1.5 py-0.2 bg-[#0B1120] text-cyan-400 rounded-full border border-[#1E2D4A]">
                          {dayEvents.length}
                        </span>
                      )}
                    </div>

                    {/* Events Pills */}
                    <div className="space-y-1 overflow-y-auto flex-1 w-full no-scrollbar">
                      {dayEvents.map((evt) => {
                        const isCita = evt.eventType === 'cita';
                        const isBeingDragged = draggedEvent?.id === evt.id;

                        return (
                          <div
                            key={evt.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, evt)}
                            onDragEnd={handleDragEnd}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedEvent(evt);
                            }}
                            className={`p-1.5 rounded-lg border text-[11px] font-medium leading-tight transition-all cursor-grab active:cursor-grabbing shadow-2xs hover:scale-[1.02] ${
                              isBeingDragged ? 'opacity-30 border-dashed border-cyan-400 scale-95' : ''
                            } ${
                              isCita 
                                ? 'bg-blue-950/80 border-blue-500/40 text-blue-200 hover:bg-blue-900/80' 
                                : 'bg-amber-950/80 border-amber-500/40 text-amber-200 hover:bg-amber-900/80'
                            }`}
                          >
                            <div className="flex items-center justify-between font-mono text-[9px] font-bold opacity-90 mb-0.5">
                              <span className="flex items-center gap-1">
                                <span className={`w-1.5 h-1.5 rounded-full ${isCita ? 'bg-cyan-400' : 'bg-amber-400'}`}></span>
                                {isCita ? evt.timeStr : 'Re-llamada'}
                              </span>
                              <span className="uppercase text-[8px] tracking-wider opacity-80">
                                {isCita ? evt.tipoOperacion : 'Seguimiento'}
                              </span>
                            </div>

                            <div className="font-bold truncate text-white">
                              {evt.clienteNombre}
                            </div>

                            <div className="text-[9.5px] truncate text-slate-300 flex items-center gap-0.5 mt-0.5">
                              <MapPin className="w-2.5 h-2.5 shrink-0 text-slate-400" />
                              <span className="truncate">{evt.distritoPropiedad || evt.direccionPropiedad}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* SCALE 2: SEMANA (WEEK VIEW TIMELINE) */}
        {scale === 'semana' && (
          <div className="flex-1 flex flex-col min-h-0 w-full overflow-hidden">
            {/* Week Header Days */}
            <div className="grid grid-cols-7 border-b border-[#1E2D4A] bg-[#111A2E] text-center py-3">
              {weekDays.map((wd) => (
                <div key={wd.dateStr} className="flex flex-col items-center">
                  <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">{wd.dayName}</span>
                  <span className={`text-base font-bold font-mono mt-0.5 ${
                    wd.isToday 
                      ? 'bg-[#FF3B30] text-white w-7 h-7 rounded-full flex items-center justify-center shadow-xs' 
                      : 'text-white'
                  }`}>
                    {wd.dayNum}
                  </span>
                </div>
              ))}
            </div>

            {/* Week Content Columns */}
            <div className="flex-1 grid grid-cols-7 divide-x divide-[#1E2D4A] bg-[#0B1120] overflow-y-auto">
              {weekDays.map((wd) => {
                const dayEvents = eventsByDate[wd.dateStr] || [];
                const isHovered = dragOverDate === wd.dateStr;

                return (
                  <div
                    key={wd.dateStr}
                    onDragOver={(e) => handleDragOver(e, wd.dateStr)}
                    onDragLeave={(e) => handleDragLeave(e, wd.dateStr)}
                    onDrop={(e) => handleDrop(e, wd.dateStr)}
                    className={`p-2.5 flex flex-col gap-2 min-h-[500px] transition-all ${
                      isHovered
                        ? 'bg-cyan-950/60 ring-2 ring-cyan-400 ring-inset z-10'
                        : wd.isToday
                        ? 'bg-cyan-500/5'
                        : 'bg-[#111A2E]/50'
                    }`}
                  >
                    {dayEvents.length === 0 ? (
                      <div className="text-center py-10 text-[11px] text-slate-500 italic">
                        {isHovered ? '¡Soltar para reprogramar!' : 'Sin agenda'}
                      </div>
                    ) : (
                      dayEvents.map((evt) => {
                        const isCita = evt.eventType === 'cita';
                        const isBeingDragged = draggedEvent?.id === evt.id;

                        return (
                          <div
                            key={evt.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, evt)}
                            onDragEnd={handleDragEnd}
                            onClick={() => setSelectedEvent(evt)}
                            className={`p-2.5 rounded-xl border text-xs transition-all cursor-grab active:cursor-grabbing shadow-2xs hover:shadow-sm ${
                              isBeingDragged ? 'opacity-30 border-dashed border-cyan-400 scale-95' : ''
                            } ${
                              isCita 
                                ? 'bg-blue-950/80 border-blue-500/40 text-blue-100 hover:bg-blue-900/80' 
                                : 'bg-amber-950/80 border-amber-500/40 text-amber-100 hover:bg-amber-900/80'
                            }`}
                          >
                            <div className="flex items-center justify-between font-mono font-bold mb-1">
                              <span className="flex items-center gap-1 text-[11px]">
                                {isCita ? <Clock className="w-3 h-3 text-cyan-400" /> : <PhoneCall className="w-3 h-3 text-amber-400" />}
                                {isCita ? evt.timeStr : 'Llamada'}
                              </span>
                              <span className="text-[9px] uppercase font-bold opacity-75">
                                {evt.tipoOperacion}
                              </span>
                            </div>

                            <div className="font-bold text-white text-xs truncate">
                              {evt.clienteNombre}
                            </div>

                            <div className="text-[10px] text-slate-300 flex items-center gap-1 mt-1 truncate">
                              <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="truncate">{evt.direccionPropiedad}</span>
                            </div>

                            <div className="text-[9.5px] text-slate-400 mt-2 pt-1.5 border-t border-[#1E2D4A] flex justify-between items-center">
                              <span>{evt.asistenteNombre.split(' ')[0]}</span>
                              <span className="text-cyan-400 font-bold">Detalle</span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* SCALE 3: DÍA (DAY DETAILED TIMELINE) */}
        {scale === 'dia' && (
          <div className="flex-1 flex flex-col min-h-0 w-full overflow-y-auto p-4 sm:p-6 bg-[#0B1120]">
            <div className="max-w-4xl mx-auto w-full space-y-4">
              
              {/* Day Header Summary */}
              <div className="bg-[#111A2E] p-4 rounded-2xl border border-[#1E2D4A] shadow-xs flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-white">
                    Agenda para el {formatToDDMMYYYY(toYYYYMMDD(currentDate))}
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {eventsByDate[toYYYYMMDD(currentDate)]?.length || 0} compromiso(s) programado(s)
                  </p>
                </div>

                <button
                  onClick={() => setScale('mes')}
                  className="px-3 py-1.5 bg-[#1E2D4A] hover:bg-[#2A3B5C] text-slate-200 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                >
                  Ver Mes
                </button>
              </div>

              {/* Events for selected day */}
              {(() => {
                const dateStr = toYYYYMMDD(currentDate);
                const dayEvents = eventsByDate[dateStr] || [];

                if (dayEvents.length === 0) {
                  return (
                    <div className="text-center py-16 bg-[#111A2E] rounded-2xl border border-[#1E2D4A]">
                      <CalendarIcon className="w-10 h-10 text-slate-500 mx-auto mb-2" />
                      <p className="text-sm font-semibold text-slate-300">Sin eventos registrados para este día.</p>
                      <p className="text-xs text-slate-500 mt-1">Selecciona otro día en el calendario de mes o semana.</p>
                    </div>
                  );
                }

                return (
                  <div className="space-y-3">
                    {dayEvents.map((evt) => {
                      const isCita = evt.eventType === 'cita';

                      return (
                        <div
                          key={evt.id}
                          onClick={() => setSelectedEvent(evt)}
                          className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-xs hover:border-cyan-500/40 bg-[#111A2E] ${
                            isCita ? 'border-l-4 border-l-cyan-400 border-[#1E2D4A]' : 'border-l-4 border-l-amber-400 border-[#1E2D4A]'
                          }`}
                        >
                          <div className="flex items-start gap-3.5">
                            <div className={`p-3 rounded-xl text-white font-mono text-center shrink-0 ${
                              isCita ? 'bg-cyan-600' : 'bg-amber-600'
                            }`}>
                              <span className="text-[10px] uppercase font-bold block opacity-80">
                                {isCita ? 'Cita' : 'Re-llamada'}
                              </span>
                              <span className="text-sm font-bold block">
                                {isCita ? evt.timeStr : '10:00'}
                              </span>
                            </div>

                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <h3 className="font-bold text-white text-sm">{evt.clienteNombre}</h3>
                                <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-[#1E2D4A] text-slate-300 border border-[#2A3B5C]">
                                  {evt.tipoOperacion}
                                </span>
                              </div>

                              <div className="text-xs text-slate-300 flex flex-wrap items-center gap-x-4 gap-y-1">
                                <span className="flex items-center gap-1 font-mono font-semibold text-slate-200">
                                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                                  {evt.clienteCelular || 'Sin teléfono'}
                                </span>

                                <span className="flex items-center gap-1">
                                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                                  <strong className="text-white">{evt.direccionPropiedad}</strong> {evt.distritoPropiedad ? `(${evt.distritoPropiedad})` : ''}
                                </span>
                              </div>

                              <p className="text-[11px] text-slate-400">
                                Tipo: <strong className="text-slate-200">{evt.tipoPropiedad}</strong> • Asistente: <strong className="text-slate-200">{evt.asistenteNombre}</strong>
                              </p>
                            </div>
                          </div>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedEvent(evt);
                            }}
                            className="px-3.5 py-1.5 bg-[#1E2D4A] hover:bg-[#2A3B5C] text-slate-200 text-xs font-semibold rounded-xl transition-colors cursor-pointer shrink-0 self-end sm:self-center flex items-center gap-1.5"
                          >
                            <Eye className="w-3.5 h-3.5 text-cyan-400" />
                            Ficha Completa
                          </button>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}

            </div>
          </div>
        )}

        {/* SCALE 4: LISTA CHRONOLOGICAL */}
        {scale === 'lista' && (
          <div className="flex-1 flex flex-col min-h-0 w-full overflow-y-auto p-4 sm:p-6 bg-[#0B1120]">
            <div className="max-w-5xl mx-auto w-full space-y-3">
              {allEvents.filter(e => e.dateStr.startsWith(currentMonthStr)).length === 0 ? (
                <div className="text-center py-16 bg-[#111A2E] rounded-2xl border border-[#1E2D4A]">
                  <CalendarIcon className="w-10 h-10 text-slate-500 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-300">No hay compromisos para este mes.</p>
                </div>
              ) : (
                allEvents
                  .filter(e => e.dateStr.startsWith(currentMonthStr))
                  .sort((a, b) => a.dateStr.localeCompare(b.dateStr))
                  .map((evt) => {
                    const isCita = evt.eventType === 'cita';

                    return (
                      <div
                        key={evt.id}
                        onClick={() => setSelectedEvent(evt)}
                        className={`p-4 rounded-2xl border bg-[#111A2E] transition-all cursor-pointer flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-xs border-[#1E2D4A] hover:border-cyan-500/40 ${
                          isCita ? 'border-l-4 border-l-cyan-400' : 'border-l-4 border-l-amber-400'
                        }`}
                      >
                        <div className="flex items-start gap-3.5">
                          <div className={`px-3 py-2 rounded-xl text-center font-mono shrink-0 text-white ${
                            isCita ? 'bg-cyan-600' : 'bg-amber-600'
                          }`}>
                            <span className="text-[10px] uppercase font-bold block opacity-90">
                              {formatToDDMMYYYY(evt.dateStr)}
                            </span>
                            <span className="text-xs font-bold block mt-0.5">
                              {isCita ? evt.timeStr : 'Re-llamada'}
                            </span>
                          </div>

                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-white text-sm">{evt.clienteNombre}</h3>
                              <span className={`px-2 py-0.5 rounded text-[9.5px] uppercase font-bold ${
                                isCita ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/30' : 'bg-amber-950 text-amber-300 border border-amber-500/30'
                              }`}>
                                {isCita ? `Cita Campo (${evt.estadoCita})` : 'Seguimiento'}
                              </span>
                            </div>

                            <div className="text-xs text-slate-300 flex flex-wrap items-center gap-x-4 gap-y-1">
                              <span className="flex items-center gap-1 font-mono font-medium text-slate-200">
                                <Phone className="w-3.5 h-3.5 text-slate-400" />
                                {evt.clienteCelular || 'Sin celular'}
                              </span>

                              <span className="flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                                <strong className="text-white">{evt.direccionPropiedad}</strong> {evt.distritoPropiedad ? `(${evt.distritoPropiedad})` : ''}
                              </span>
                            </div>

                            <div className="text-[11px] text-slate-400">
                              Propiedad: <strong className="text-slate-200">{evt.tipoPropiedad}</strong> • Operación: <strong className="text-cyan-400 uppercase">{evt.tipoOperacion}</strong> • Asistente: <strong className="text-slate-200">{evt.asistenteNombre}</strong>
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedEvent(evt);
                          }}
                          className="px-3.5 py-1.5 bg-[#1E2D4A] hover:bg-[#2A3B5C] text-slate-200 text-xs font-semibold rounded-xl transition-colors cursor-pointer shrink-0 self-end md:self-center flex items-center gap-1.5"
                        >
                          <Eye className="w-3.5 h-3.5 text-cyan-400" />
                          Ver Ficha
                        </button>
                      </div>
                    );
                  })
              )}
            </div>
          </div>
        )}

      </div>

      {/* APPLE CALENDAR EVENT SHEET MODAL */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#111A2E] w-full max-w-md rounded-2xl shadow-2xl border border-[#1E2D4A] overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Sheet Header */}
            <div className={`p-4 text-white flex justify-between items-center shrink-0 border-b border-[#1E2D4A] ${
              selectedEvent.eventType === 'cita' ? 'bg-[#0B1120]' : 'bg-[#0B1120]'
            }`}>
              <div className="flex items-center gap-2.5">
                <div className={`p-2 rounded-xl ${selectedEvent.eventType === 'cita' ? 'bg-cyan-500/20 text-cyan-400' : 'bg-amber-500/20 text-amber-400'}`}>
                  {selectedEvent.eventType === 'cita' ? <Clock className="w-5 h-5" /> : <PhoneCall className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="font-bold text-sm tracking-wide text-white">
                    {selectedEvent.eventType === 'cita' ? 'Cita de Campo Programada' : 'Re-llamada de Seguimiento'}
                  </h3>
                  <p className="text-[11px] text-slate-400">Acceso Público y de Gestión</p>
                </div>
              </div>

              <button
                onClick={() => setSelectedEvent(null)}
                className="p-1.5 hover:bg-[#1E2D4A] rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Sheet Body */}
            <div className="p-5 space-y-4 overflow-y-auto text-xs text-slate-300">
              
              {/* Date Box */}
              <div className="bg-[#0B1120] border border-[#1E2D4A] p-3.5 rounded-xl flex justify-between items-center">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Fecha Agendada</span>
                  <span className="text-sm font-bold font-mono text-white block mt-0.5">
                    {formatToDDMMYYYY(selectedEvent.dateStr)}
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Hora</span>
                  <span className="text-sm font-bold font-mono text-cyan-400 block mt-0.5">
                    {selectedEvent.eventType === 'cita' ? selectedEvent.timeStr : 'Seguimiento'}
                  </span>
                </div>
              </div>

              {/* Client Info */}
              <div className="space-y-2 bg-[#0B1120]/60 p-3.5 rounded-xl border border-[#1E2D4A]">
                <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">Cliente Contacto</span>
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-sm font-bold text-white block">{selectedEvent.clienteNombre}</span>
                    <span className="text-xs font-mono font-semibold text-slate-300 block mt-0.5">{selectedEvent.clienteCelular || 'Sin teléfono'}</span>
                  </div>

                  {selectedEvent.clienteCelular && (
                    <a
                      href={`https://wa.me/51${selectedEvent.clienteCelular.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-all flex items-center gap-1 shadow-2xs"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      WhatsApp
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>

              {/* Property & Address */}
              <div className="space-y-2 bg-[#0B1120]/60 p-3.5 rounded-xl border border-[#1E2D4A]">
                <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">Ubicación del Inmueble</span>
                <div className="space-y-1 text-xs">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-white block">{selectedEvent.direccionPropiedad}</span>
                      {selectedEvent.distritoPropiedad && (
                        <span className="text-[11px] text-slate-400 block">Distrito: <strong className="text-slate-200">{selectedEvent.distritoPropiedad}</strong></span>
                      )}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#1E2D4A] flex justify-between items-center text-slate-300">
                    <span>Propiedad: <strong className="text-white">{selectedEvent.tipoPropiedad}</strong></span>
                    <span>Operación: <strong className="text-cyan-400 uppercase">{selectedEvent.tipoOperacion}</strong></span>
                  </div>
                </div>
              </div>

              {/* Assistant & Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-[#0B1120]/60 p-3 rounded-xl border border-[#1E2D4A]">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Asistente Responsable</span>
                  <span className="text-xs font-semibold text-slate-200 block">{selectedEvent.asistenteNombre}</span>
                </div>

                <div className="bg-[#0B1120]/60 p-3 rounded-xl border border-[#1E2D4A]">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Motivo / Notas</span>
                  <span className="text-xs text-slate-300 block italic">
                    {selectedEvent.notas || 'Sin observaciones'}
                  </span>
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="p-4 bg-[#0B1120] border-t border-[#1E2D4A] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
              <button
                type="button"
                onClick={() => handleRemoveFromCalendar(selectedEvent)}
                className="px-3.5 py-2 bg-amber-950/60 hover:bg-amber-900/80 text-amber-200 border border-amber-500/40 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                title="Quita esta fecha de agendamiento del calendario pero conserva la información del cliente en Prospectos"
              >
                <CalendarX className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Quitar de Calendario (Conservar Prospecto)</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedEvent(null)}
                className="px-4 py-2 bg-primary hover:bg-primary/90 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-xs"
              >
                Cerrar Visor
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
