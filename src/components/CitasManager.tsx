/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Calendar, 
  Clock, 
  User, 
  Phone, 
  MapPin, 
  Tag, 
  PlusCircle, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Sparkles, 
  FileText,
  AlertCircle,
  Coins,
  CheckCircle2,
  XCircle,
  Info,
  Eye,
  X,
  ExternalLink
} from 'lucide-react';
import { Asistente, Cita, EstadoCita, EstadoCierre, TipoOperacionCita, ConfigGeneral } from '../types';
import { formatPEN } from '../utils/currency';
import { formatToDDMMYYYY, getLocalDateString } from '../utils/date';
import { capitalizeWords } from '../utils/string';

const DISTRITOS_LIMA_CALLAO_PROVINCIAS = Array.from(new Set([
  // Lima Metropolitana
  "Ancón", "Ate", "Barranco", "Breña", "Carabayllo", "Chaclacayo", "Chorrillos", "Cieneguilla", "Comas", 
  "El Agustino", "Independencia", "Jesús María", "La Molina", "La Victoria", "Lima (Cercado)", "Lince", 
  "Los Olivos", "Lurigancho-Chosica", "Lurín", "Magdalena del Mar", "Miraflores", "Pachacámac", "Pucusana", 
  "Pueblo Libre", "Puente Piedra", "Punta Hermosa", "Punta Negra", "Rímac", "San Bartolo", "San Borja", 
  "San Isidro", "San Juan de Lurigancho", "San Juan de Miraflores", "San Luis", "San Martín de Porres", 
  "San Miguel", "Santa Anita", "Santa María del Mar", "Santa Rosa", "Santiago de Surco", "Surquillo", 
  "Villa El Salvador", "Villa María del Triunfo",
  // Callao
  "Bellavista", "Callao (Cercado)", "Carmen de la Legua Reynoso", "La Perla", "La Punta", "Mi Perú", "Ventanilla",
  // Cañete
  "San Vicente de Cañete", "Asia", "Chilca", "Mala", "Lunahuaná", "Cerro Azul", "Coayllo", "Imperial", "Nuevo Imperial", 
  "Pacarán", "Quilmaná", "San Antonio", "San Luis", "Santa Cruz de Flores", "Zúñiga",
  // Huaura (Huacho)
  "Huacho", "Ambar", "Carquín", "Checras", "Hualmay", "Huaura", "Leoncio Prado", "Paccho", "Santa María", "Sayán", "Végueta",
  // Huaral
  "Huaral", "Atavillos Alto", "Atavillos Bajo", "Aucos", "Chancay", "Ihuarí", "Lampián", "Pacaraos", "San Miguel de Acos", 
  "Santa Cruz de Andamarca", "Sumbal", "27 de Noviembre",
  // Huarochirí
  "Matucana", "Antioquía", "Callahuanca", "Carampoma", "Chicla", "Cuenca", "Huachupampa", "Huanza", "Huarochirí", 
  "Lahuaytambo", "Langa", "Laraos", "Mariatana", "Ricardo Palma", "San Andrés de Tudela", "San Antonio de Chaclla", 
  "San Bartolomé", "San Damián", "San Juan de Iris", "San Juan de Tantaranche", "San Lorenzo de Quinti", 
  "San Mateo", "San Mateo de Otao", "San Pedro de Casta", "San Pedro de Huancayre", "Sangallaya", "Santa Cruz de Cocachacra", 
  "Santa Eulalia", "Santiago de Anchucaya", "Santiago de Tuna", "Santo Domingo de los Olleros", "Surco",
  // Barranca
  "Barranca", "Paramonga", "Pativilca", "Supe", "Supe Puerto",
  // Canta
  "Canta", "Arahuay", "Huamantanga", "Huaros", "Lachaqui", "San Buenaventura", "Santa Rosa de Quives",
  // Yauyos
  "Yauyos", "Alis", "Ayauca", "Ayaví", "Cacra", "Carania", "Catahuasi", "Chupamarca", "Colonia", "Hongos", "Huacrapampa", 
  "Huampara", "Huancaya", "Huangáscar", "Huantán", "Laraos", "Lincha", "Madean", "Miraflores", "Omas", "Putinja", "Quinches", 
  "Quinquera", "San Joaquín", "San Pedro de Pilas", "Tanta", "Tauripampa", "Tomas", "Vitis", "Viñac",
  // Oyón
  "Oyón", "Andajes", "Caujul", "Cochamarca", "Naván", "Pachangara",
  // Cajatambo
  "Cajatambo", "Copa", "Gorgor", "Huancapón", "Manás"
])).sort((a, b) => a.localeCompare(b));

const getCitaBadge = (status: EstadoCita) => {
  switch (status) {
    case EstadoCita.PROSPECTO:
      return 'bg-indigo-50 text-indigo-700 border border-indigo-200';
    case EstadoCita.REPROGRAMAR:
      return 'bg-amber-100 text-amber-800 border border-amber-300 font-bold';
    case EstadoCita.AGENDADA:
      return 'bg-blue-50 text-primary border border-primary/20';
    case EstadoCita.REALIZADA:
      return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
    case EstadoCita.CANCELADA:
      return 'bg-red-50 text-brand-red border border-brand-red/10';
    default:
      return 'bg-slate-50 text-slate-500';
  }
};

const getCierreBadge = (status: EstadoCierre) => {
  switch (status) {
    case EstadoCierre.CAPTACION_EN_TRAMITE:
      return 'bg-[#E0F2FE] text-[#0369A1] border border-[#7DD3FC] font-bold';
    case EstadoCierre.PENDIENTE:
      return 'bg-slate-100 text-slate-600 border border-slate-200';
    case EstadoCierre.EN_SEGUIMIENTO:
      return 'bg-amber-50 text-amber-800 border border-amber-200';
    case EstadoCierre.DESCARTADO:
      return 'bg-red-50 text-brand-red border border-brand-red/10';
    case EstadoCierre.CERRADO:
      return 'bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold';
    case EstadoCierre.LIQUIDADO:
      return 'bg-navy text-white border border-navy/30 font-bold';
    default:
      return 'bg-slate-100 text-slate-500';
  }
};

interface CitasManagerProps {
  citas: Cita[];
  asistentes: Asistente[];
  config: ConfigGeneral;
  onSaveCita: (cita: Cita) => void;
  onDeleteCita: (id: string) => void;
  isSyncing: boolean;
  userRole?: 'admin' | 'asistente' | null;
  onSaveAsistente?: (asistente: Asistente) => void;
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
}

export default function CitasManager({
  citas,
  asistentes,
  config,
  onSaveCita,
  onDeleteCita,
  isSyncing,
  userRole = 'admin',
  onSaveAsistente,
  activeTab = 'citas',
  setActiveTab
}: CitasManagerProps) {
  // Local state for the appointment form
  const [editingId, setEditingId] = useState<string | null>(null);
  const [asistenteId, setAsistenteId] = useState('');
  const [fechaCita, setFechaCita] = useState('');
  const [horaCita, setHoraCita] = useState('');
  const [clienteNombre, setClienteNombre] = useState('');
  const [clienteCelular, setClienteCelular] = useState('');
  const [direccionPropiedad, setDireccionPropiedad] = useState('');
  const [tipoPropiedad, setTipoPropiedad] = useState('');
  const [tipoOperacion, setTipoOperacion] = useState<TipoOperacionCita>(TipoOperacionCita.VENTA);
  const [estadoCita, setEstadoCita] = useState<EstadoCita | ''>('');
  const [estadoCierre, setEstadoCierre] = useState<EstadoCierre | ''>('');
  const [fechaCierre, setFechaCierre] = useState('');
  const [montoBono, setMontoBono] = useState<number>(config.bonoVentaPredeterminado);
  const [notas, setNotas] = useState('');

  // New fields
  const [fechaLlamada, setFechaLlamada] = useState(getLocalDateString());
  const [horaLlamada, setHoraLlamada] = useState(() => {
    const d = new Date();
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
  });
  const [fechaNuevaLlamada, setFechaNuevaLlamada] = useState('');
  const [distritoPropiedad, setDistritoPropiedad] = useState('');
  const [showDistritos, setShowDistritos] = useState(false);

  const isCelularRepetido = React.useMemo(() => {
    const cleanCelular = (clienteCelular || '').trim();
    if (!cleanCelular) return false;
    return (citas || []).some(c => c && (c.clienteCelular || '').trim() === cleanCelular && c.id !== editingId);
  }, [clienteCelular, citas, editingId]);

  // States for monthly calls form
  const [selectedAsistenteId, setSelectedAsistenteId] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    return `${d.getFullYear()}-${mm}`;
  });
  const [cantidadLlamadas, setCantidadLlamadas] = useState<number | ''>('');

  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAsistente, setFilterAsistente] = useState('TODOS');
  const [filterEstadoCita, setFilterEstadoCita] = useState('TODOS');
  const [filterEstadoCierre, setFilterEstadoCierre] = useState('TODOS');

  // Error and success state
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [viewingCita, setViewingCita] = useState<Cita | null>(null);

  // Auto-adjust default bonus when operation type changes
  const handleOperationTypeChange = (type: TipoOperacionCita) => {
    setTipoOperacion(type);
    if (!editingId) {
      setMontoBono(
        type === TipoOperacionCita.VENTA 
          ? (config?.bonoVentaPredeterminado || 150) 
          : (config?.bonoAlquilerPredeterminado || 100)
      );
    }
  };

  const handleEdit = (cita: Cita) => {
    if (!cita) return;
    setEditingId(cita.id);
    setAsistenteId(cita.asistenteId || '');
    setFechaCita(cita.fechaCita || '');
    setHoraCita(cita.horaCita || '');
    setClienteNombre(cita.clienteNombre || '');
    setClienteCelular(cita.clienteCelular || '');
    setDireccionPropiedad(cita.direccionPropiedad || '');
    setTipoPropiedad(cita.tipoPropiedad || '');
    setTipoOperacion(cita.tipoOperacion || TipoOperacionCita.VENTA);
    setEstadoCita(cita.estadoCita || '');
    setEstadoCierre(cita.estadoCierre || '');
    setFechaCierre(cita.fechaCierre || '');
    setMontoBono(cita.montoBono ?? (config?.bonoVentaPredeterminado || 150));
    setNotas(cita.notas || '');
    setFechaLlamada(cita.fechaLlamada || getLocalDateString());
    setHoraLlamada(cita.horaLlamada || (() => {
      const d = new Date();
      const hh = String(d.getHours()).padStart(2, '0');
      const mm = String(d.getMinutes()).padStart(2, '0');
      return `${hh}:${mm}`;
    })());
    const todayStr = getLocalDateString();
    const isReprog = cita.estadoCita === EstadoCita.REPROGRAMAR;
    let initialFechaNueva = cita.fechaNuevaLlamada || '';
    if (isReprog && (!initialFechaNueva || initialFechaNueva < todayStr)) {
      initialFechaNueva = todayStr;
    }
    setFechaNuevaLlamada(initialFechaNueva);
    setDistritoPropiedad(cita.distritoPropiedad || '');
    setErrorMsg('');
    setSuccessMsg('');

    if (setActiveTab) {
      setActiveTab('registrar');
    }

    // Scroll to form on mobile/desktop
    setTimeout(() => {
      const formElement = document.getElementById('cita_form_container');
      if (formElement) {
        formElement.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  // Auto-select assistant if there is only 1 active assistant and no assistant is selected yet (for new records)
  React.useEffect(() => {
    const active = (asistentes || []).filter(as => as.activo);
    if (!editingId && !asistenteId && active.length === 1) {
      setAsistenteId(active[0].id);
    }
    if (!selectedAsistenteId && active.length === 1) {
      setSelectedAsistenteId(active[0].id);
    }
  }, [asistentes, editingId, asistenteId, selectedAsistenteId]);

  const resetForm = () => {
    setEditingId(null);
    const active = (asistentes || []).filter(as => as.activo);
    setAsistenteId(active.length === 1 ? active[0].id : '');
    setFechaCita('');
    setHoraCita('');
    setClienteNombre('');
    setClienteCelular('');
    setDireccionPropiedad('');
    setTipoPropiedad('');
    setTipoOperacion(TipoOperacionCita.VENTA);
    setEstadoCita('');
    setEstadoCierre('');
    setFechaCierre('');
    setMontoBono(config.bonoVentaPredeterminado);
    setNotas('');
    setFechaLlamada(getLocalDateString());
    setHoraLlamada(() => {
      const d = new Date();
      const hh = String(d.getHours()).padStart(2, '0');
      const mm = String(d.getMinutes()).padStart(2, '0');
      return `${hh}:${mm}`;
    });
    setFechaNuevaLlamada('');
    setDistritoPropiedad('');
    setErrorMsg('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!asistenteId) {
      setErrorMsg('Por favor seleccione un asistente/colaborador.');
      return;
    }
    if (!clienteCelular.trim()) {
      setErrorMsg('Por favor ingrese el celular de contacto del cliente.');
      return;
    }
    
    // Celular duplication validation
    const cleanCelular = clienteCelular.trim();
    const isDuplicateCelular = citas.some(c => 
      c.clienteCelular.trim() === cleanCelular && c.id !== editingId
    );
    if (isDuplicateCelular) {
      setErrorMsg(`El número de celular (${cleanCelular}) ya está registrado en otro prospecto.`);
      return;
    }

    if (!fechaLlamada) {
      setErrorMsg('Por favor seleccione la fecha de llamada del prospecto.');
      return;
    }
    if (!distritoPropiedad.trim()) {
      setErrorMsg('Por favor seleccione o escriba el distrito de la propiedad.');
      return;
    }

    const selectedAsistente = asistentes.find(as => as.id === asistenteId);
    if (!selectedAsistente) {
      setErrorMsg('El asistente seleccionado no es válido.');
      return;
    }

    const finalEstadoCita = (estadoCita || EstadoCita.PROSPECTO) as EstadoCita;
    const finalEstadoCierre = userRole === 'admin' 
      ? ((estadoCierre || EstadoCierre.PENDIENTE) as EstadoCierre)
      : (editingId ? (citas.find(c => c.id === editingId)?.estadoCierre || EstadoCierre.PENDIENTE) : EstadoCierre.PENDIENTE);
    const todayStr = getLocalDateString();
    let finalFechaNuevaLlamada = fechaNuevaLlamada;

    if (finalEstadoCita === EstadoCita.REPROGRAMAR) {
      if (!finalFechaNuevaLlamada || finalFechaNuevaLlamada < todayStr) {
        finalFechaNuevaLlamada = todayStr;
      }
    } else {
      finalFechaNuevaLlamada = '';
    }

    const compiledCita: Cita = {
      id: editingId || Math.random().toString(36).substring(2, 11),
      asistenteId,
      asistenteNombre: selectedAsistente.nombreCompleto,
      fechaCita,
      horaCita,
      clienteNombre: clienteNombre.trim(),
      clienteCelular: cleanCelular,
      direccionPropiedad: direccionPropiedad.trim(),
      tipoPropiedad: tipoPropiedad || 'Departamento',
      tipoOperacion,
      estadoCita: finalEstadoCita,
      estadoCierre: finalEstadoCierre,
      fechaCierre: (estadoCierre === EstadoCierre.CERRADO || estadoCierre === EstadoCierre.LIQUIDADO) ? (fechaCierre || new Date().toISOString().split('T')[0]) : '',
      montoBono: Number(montoBono),
      notas: notas.trim(),
      fechaLlamada: fechaLlamada.trim(),
      horaLlamada: horaLlamada.trim(),
      fechaNuevaLlamada: finalFechaNuevaLlamada,
      distritoPropiedad: distritoPropiedad.trim()
    };

    onSaveCita(compiledCita);
    setSuccessMsg(editingId ? 'Prospecto actualizado correctamente.' : 'Nuevo prospecto registrado con éxito.');
    resetForm();

    if (setActiveTab) {
      setTimeout(() => {
        setActiveTab('citas');
      }, 1500);
    }

    setTimeout(() => {
      setSuccessMsg('');
    }, 4000);
  };

  const handleDelete = (id: string) => {
    onDeleteCita(id);
    setDeleteConfirmId(null);
    setSuccessMsg('Cita eliminada correctamente.');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleSaveLlamadas = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!selectedAsistenteId) {
      setErrorMsg('Por favor, selecciona un colaborador para registrar las llamadas.');
      return;
    }
    if (cantidadLlamadas === '' || Number(cantidadLlamadas) < 0) {
      setErrorMsg('Por favor, ingresa una cantidad válida de llamadas (0 o más).');
      return;
    }

    const targetAsistente = asistentes.find(as => as.id === selectedAsistenteId);
    if (!targetAsistente) return;

    const existingLlamadas = targetAsistente.llamadasMensuales || {};
    const updatedLlamadas = {
      ...existingLlamadas,
      [selectedMonth]: Number(cantidadLlamadas)
    };

    const updatedAsistente: Asistente = {
      ...targetAsistente,
      llamadasMensuales: updatedLlamadas
    };

    if (onSaveAsistente) {
      onSaveAsistente(updatedAsistente);
      setSuccessMsg(`Llamadas mensuales registradas con éxito para ${targetAsistente.nombreCompleto} (${selectedMonth}): ${cantidadLlamadas} llamadas.`);
      setCantidadLlamadas('');
      setTimeout(() => {
        setSuccessMsg('');
      }, 5000);
    }
  };

  // Filter appointments logic
  const filteredCitas = (citas || []).filter(cita => {
    if (!cita) return false;
    const term = (searchTerm || '').trim().toLowerCase();
    const matchesSearch = !term ||
      (cita.clienteNombre || '').toLowerCase().includes(term) ||
      (cita.asistenteNombre || '').toLowerCase().includes(term) ||
      (cita.direccionPropiedad || '').toLowerCase().includes(term) ||
      (cita.distritoPropiedad || '').toLowerCase().includes(term) ||
      (cita.clienteCelular || '').includes(term);

    const matchesAsistente = filterAsistente === 'TODOS' || cita.asistenteId === filterAsistente;
    const matchesEstadoCita = filterEstadoCita === 'TODOS' || cita.estadoCita === filterEstadoCita;
    const matchesEstadoCierre = filterEstadoCierre === 'TODOS' || cita.estadoCierre === filterEstadoCierre;

    return matchesSearch && matchesAsistente && matchesEstadoCita && matchesEstadoCierre;
  });

  const isReprogramadaAlert = (cita: Cita) => {
    if (cita.estadoCita !== EstadoCita.REPROGRAMAR) return false;
    const todayStr = getLocalDateString();
    return !cita.fechaNuevaLlamada || cita.fechaNuevaLlamada <= todayStr;
  };

  const sortedCitas = React.useMemo(() => {
    return [...filteredCitas].sort((a, b) => {
      const alertA = isReprogramadaAlert(a) ? 1 : 0;
      const alertB = isReprogramadaAlert(b) ? 1 : 0;
      if (alertA !== alertB) {
        return alertB - alertA; // alert goes to top!
      }
      
      const dateA = a.fechaLlamada || '';
      const dateB = b.fechaLlamada || '';
      if (dateA !== dateB) {
        return dateB.localeCompare(dateA); // Most recent first
      }
      
      return b.id.localeCompare(a.id);
    });
  }, [filteredCitas]);

  return (
    <div className="space-y-6" id="citas_manager_root">
      
      {/* Messages */}
      {errorMsg && (
        <div className="p-4 bg-red-50 border border-brand-red/20 rounded-md flex items-start gap-2 text-brand-red animate-fade-in" id="error_alert">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <div className="text-xs font-semibold">{errorMsg}</div>
        </div>
      )}
      
      {successMsg && (
        <div className="p-4 bg-blue-50 border border-primary/20 rounded-md flex items-start gap-2 text-primary animate-fade-in" id="success_alert">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-primary" />
          <div className="text-xs font-semibold">{successMsg}</div>
        </div>
      )}

      {activeTab === 'registrar' ? (
        /* Left Column / Registration Form - Made full-width and centered for an elegant single-view */
        <div className="max-w-2xl mx-auto w-full space-y-6">
          {/* Create/Edit Appointment */}
          <div className="bg-[#111A2E] rounded-2xl border border-[#1E2D4A] shadow-xl overflow-hidden h-fit" id="cita_form_container">
          <div className="p-4 bg-[#0B1120] border-b border-[#1E2D4A] flex justify-between items-center text-white">
            <h3 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
              <Calendar className="w-4 h-4 text-cyan-400" />
              {editingId ? 'Editar Prospecto' : 'Registrar Nuevo Prospecto'}
            </h3>
            {editingId && (
              <button 
                type="button" 
                onClick={resetForm}
                className="text-[10px] bg-[#1E2D4A] hover:bg-[#2A3B5C] text-slate-300 font-bold uppercase px-2 py-1 rounded cursor-pointer"
              >
                Cancelar
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            {/* 1. Assistant dropdown */}
            <div>
              <label htmlFor="select_asistente" className="block text-[10px] uppercase font-bold text-slate-300 tracking-wider mb-1.5">
                Asistente / Colaborador *
              </label>
              <select
                id="select_asistente"
                value={asistenteId}
                onChange={(e) => setAsistenteId(e.target.value)}
                className="block w-full py-2.5 px-3 text-xs bg-[#0B1120] border border-[#2A3B5C] rounded-lg focus:outline-none focus:border-cyan-400 text-white"
              >
                <option value="">-- Seleccionar Colaborador --</option>
                {asistentes.filter(as => as.activo).map((as) => (
                  <option key={as.id} value={as.id}>{as.nombreCompleto} ({as.cargo})</option>
                ))}
              </select>
              {asistentes.length === 0 && (
                <p className="text-[10px] text-rose-400 font-semibold mt-1">
                  ⚠️ No hay asistentes registrados. Por favor cree uno primero en la pestaña de Recursos Humanos.
                </p>
              )}
            </div>

            {/* 2. Celular de Contacto (Immediately after Assistant) */}
            <div>
              <label htmlFor="input_cliente_celular" className="block text-[10px] uppercase font-bold text-slate-300 tracking-wider mb-1.5">
                Celular de Contacto *
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                  <Phone className="w-4 h-4" />
                </span>
                <input
                  type="tel"
                  id="input_cliente_celular"
                  placeholder="Ej. 999888777"
                  value={clienteCelular}
                  onChange={(e) => setClienteCelular(e.target.value)}
                  className={`block w-full pl-9 pr-3 py-2 text-xs bg-[#0B1120] border rounded-lg focus:outline-none text-white font-mono transition-colors ${
                    isCelularRepetido
                      ? 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-950/20'
                      : 'border-[#2A3B5C] focus:border-cyan-400'
                  }`}
                />
              </div>
              {isCelularRepetido && (
                <div className="mt-1.5 p-2 bg-rose-950/40 border border-rose-500/30 rounded text-rose-300 text-[10px] font-bold flex items-start gap-1.5 animate-pulse">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                  <span>
                    Este celular ya está registrado en otro prospecto. 
                    <strong> Corríjalo para poder continuar con el ingreso de datos.</strong>
                  </span>
                </div>
              )}
            </div>

            {/* 3. Fecha y Hora de Registro del Prospecto (Immediately after Celular) */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="input_fecha_llamada" className="block text-[10px] uppercase font-bold text-slate-300 tracking-wider mb-1.5">
                  Fecha de Registro *
                </label>
                <input
                  type="date"
                  id="input_fecha_llamada"
                  value={fechaLlamada}
                  onChange={(e) => setFechaLlamada(e.target.value)}
                  disabled={true}
                  className="block w-full py-2 px-3 text-xs bg-[#0B1120]/60 border border-[#1E2D4A] rounded-lg text-slate-400 font-medium cursor-not-allowed"
                />
              </div>
              <div>
                <label htmlFor="input_hora_llamada" className="block text-[10px] uppercase font-bold text-slate-300 tracking-wider mb-1.5">
                  Hora de Registro *
                </label>
                <input
                  type="time"
                  id="input_hora_llamada"
                  value={horaLlamada}
                  onChange={(e) => setHoraLlamada(e.target.value)}
                  disabled={true}
                  className="block w-full py-2 px-3 text-xs bg-[#0B1120]/60 border border-[#1E2D4A] rounded-lg text-slate-400 font-medium cursor-not-allowed font-mono"
                />
              </div>
            </div>
            <p className="text-[9px] text-slate-400 mt-0.5">
              Informativo. Se coloca automáticamente con la fecha y hora de registro del prospecto.
            </p>

            {/* 4. Nombre del Cliente / Propietario */}
            <div>
              <label htmlFor="input_cliente_nombre" className="block text-[10px] uppercase font-bold text-slate-300 tracking-wider mb-1.5">
                Nombre del Cliente / Propietario *
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  id="input_cliente_nombre"
                  placeholder="Ej. Oscar Russo"
                  value={clienteNombre}
                  onChange={(e) => setClienteNombre(capitalizeWords(e.target.value))}
                  disabled={isCelularRepetido}
                  className="block w-full pl-9 pr-3 py-2 text-xs bg-[#0B1120] border border-[#2A3B5C] rounded-lg focus:outline-none focus:border-cyan-400 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed capitalize"
                />
              </div>
            </div>

            {/* 5. Date & Time of Appointment (Fecha y Hora de Cita) */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="input_fecha_cita" className="block text-[10px] uppercase font-bold text-slate-300 tracking-wider mb-1.5">
                  Fecha de Cita (Visita) *
                </label>
                <input
                  type="date"
                  id="input_fecha_cita"
                  value={fechaCita}
                  onChange={(e) => setFechaCita(e.target.value)}
                  disabled={isCelularRepetido}
                  className="block w-full py-2 px-3 text-xs bg-[#0B1120] border border-[#2A3B5C] rounded-lg focus:outline-none focus:border-cyan-400 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
              <div>
                <label htmlFor="input_hora_cita" className="block text-[10px] uppercase font-bold text-slate-300 tracking-wider mb-1.5">
                  Hora de Cita
                </label>
                <input
                  type="time"
                  id="input_hora_cita"
                  value={horaCita}
                  onChange={(e) => setHoraCita(e.target.value)}
                  disabled={isCelularRepetido}
                  className="block w-full py-2 px-3 text-xs bg-[#0B1120] border border-[#2A3B5C] rounded-lg focus:outline-none focus:border-cyan-400 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            {/* 6. Property Address */}
            <div>
              <label htmlFor="input_direccion" className="block text-[10px] uppercase font-bold text-slate-300 tracking-wider mb-1.5">
                Dirección / Detalles del Inmueble *
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                  <MapPin className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  id="input_direccion"
                  placeholder="Av. Manuel Olguín 325"
                  value={direccionPropiedad}
                  onChange={(e) => setDireccionPropiedad(capitalizeWords(e.target.value))}
                  disabled={isCelularRepetido}
                  className="block w-full pl-9 pr-3 py-2 text-xs bg-[#0B1120] border border-[#2A3B5C] rounded-lg focus:outline-none focus:border-cyan-400 text-white disabled:opacity-50 disabled:cursor-not-allowed capitalize"
                />
              </div>
            </div>

            {/* 7. Distrito de la Propiedad (with autocomplete suggestions) */}
            <div>
              <label htmlFor="input_distrito" className="block text-[10px] uppercase font-bold text-slate-300 tracking-wider mb-1.5">
                Distrito de la Propiedad *
              </label>
              <div className="relative" id="distrito_autocomplete_wrapper">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                  <MapPin className="w-4 h-4 text-emerald-400" />
                </span>
                <input
                  type="text"
                  id="input_distrito"
                  placeholder="Escriba distrito (Ej: Miraflores, Asia...)"
                  value={distritoPropiedad}
                  onChange={(e) => {
                    setDistritoPropiedad(capitalizeWords(e.target.value));
                    setShowDistritos(true);
                  }}
                  onFocus={() => !isCelularRepetido && setShowDistritos(true)}
                  onBlur={() => setTimeout(() => setShowDistritos(false), 200)}
                  disabled={isCelularRepetido}
                  className="block w-full pl-9 pr-3 py-2 text-xs bg-[#0B1120] border border-[#2A3B5C] rounded-lg focus:outline-none focus:border-cyan-400 text-white disabled:opacity-50 disabled:cursor-not-allowed capitalize"
                />
                {!isCelularRepetido && showDistritos && distritoPropiedad.trim() && (
                  <div className="absolute z-30 w-full bg-[#0B1120] border border-[#2A3B5C] rounded-lg shadow-xl max-h-48 overflow-y-auto mt-1 divide-y divide-[#1E2D4A]">
                    {DISTRITOS_LIMA_CALLAO_PROVINCIAS.filter(d => 
                      d.toLowerCase().includes(distritoPropiedad.toLowerCase())
                    ).length > 0 ? (
                      DISTRITOS_LIMA_CALLAO_PROVINCIAS.filter(d => 
                        d.toLowerCase().includes(distritoPropiedad.toLowerCase())
                      ).slice(0, 8).map((dist) => (
                        <button
                          key={dist}
                          type="button"
                          onMouseDown={() => {
                            setDistritoPropiedad(dist);
                            setShowDistritos(false);
                          }}
                          className="w-full text-left px-3 py-2 text-xs hover:bg-[#1E2D4A] text-slate-200 font-medium cursor-pointer"
                        >
                          {dist}
                        </button>
                      ))
                    ) : (
                      <div className="px-3 py-2 text-xs text-slate-400 font-medium">Sin coincidencias</div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Property Type and Operation */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="select_tipo_propiedad" className="block text-[10px] uppercase font-bold text-slate-300 tracking-wider mb-1.5">
                  Tipo de Inmueble
                </label>
                <select
                  id="select_tipo_propiedad"
                  value={tipoPropiedad}
                  onChange={(e) => setTipoPropiedad(e.target.value)}
                  disabled={isCelularRepetido}
                  className="block w-full py-2 px-3 text-xs bg-[#0B1120] border border-[#2A3B5C] rounded-lg focus:outline-none focus:border-cyan-400 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">-- Seleccionar Tipo de Inmueble --</option>
                  <option value="Departamento">Departamento</option>
                  <option value="Casa">Casa</option>
                  <option value="Local Comercial">Local Comercial</option>
                  <option value="Terreno">Terreno</option>
                  <option value="Oficina">Oficina</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-300 tracking-wider mb-1.5">
                  Operación
                </label>
                <div className="flex bg-[#0B1120] p-1 rounded-lg border border-[#2A3B5C]">
                  <button
                    type="button"
                    onClick={() => !isCelularRepetido && handleOperationTypeChange(TipoOperacionCita.VENTA)}
                    disabled={isCelularRepetido}
                    className={`flex-1 py-1 text-xs font-bold rounded cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                      tipoOperacion === TipoOperacionCita.VENTA 
                        ? 'bg-primary text-white shadow-sm' 
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Venta
                  </button>
                  <button
                    type="button"
                    onClick={() => !isCelularRepetido && handleOperationTypeChange(TipoOperacionCita.ALQUILER)}
                    disabled={isCelularRepetido}
                    className={`flex-1 py-1 text-xs font-bold rounded cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                      tipoOperacion === TipoOperacionCita.ALQUILER 
                        ? 'bg-primary text-white shadow-sm' 
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Alquiler
                  </button>
                </div>
              </div>
            </div>

            {/* Appointment Status */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="select_estado_cita" className="block text-[10px] uppercase font-bold text-slate-300 tracking-wider mb-1.5">
                  Estado de la Cita
                </label>
                <select
                  id="select_estado_cita"
                  value={estadoCita}
                  onChange={(e) => {
                    const val = e.target.value as EstadoCita;
                    setEstadoCita(val);
                    if (val === EstadoCita.REPROGRAMAR) {
                      const todayStr = getLocalDateString();
                      if (!fechaNuevaLlamada || fechaNuevaLlamada < todayStr) {
                        setFechaNuevaLlamada(todayStr);
                      }
                    }
                  }}
                  disabled={isCelularRepetido}
                  className="block w-full py-2 px-3 text-xs bg-[#0B1120] border border-[#2A3B5C] rounded-lg focus:outline-none focus:border-cyan-400 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">-- Seleccionar Estado de la Cita --</option>
                  <option value={EstadoCita.PROSPECTO}>Prospecto: Por contactar.</option>
                  <option value={EstadoCita.REPROGRAMAR}>Reprogramar: Llamada pospuesta.</option>
                  <option value={EstadoCita.AGENDADA}>Agendada: Cita confirmada.</option>
                  <option value={EstadoCita.CANCELADA}>Cancelada: Descartado / No aplica.</option>
                </select>
              </div>

              {estadoCita === EstadoCita.REPROGRAMAR ? (
                <div>
                  <label htmlFor="input_fecha_nueva_llamada" className="block text-[10px] uppercase font-bold text-rose-400 tracking-wider mb-1.5 flex items-center gap-1">
                    <Phone className="w-3 h-3 text-rose-400 animate-pulse" />
                    Fecha Nueva Llamada *
                  </label>
                  <input
                    type="date"
                    id="input_fecha_nueva_llamada"
                    value={fechaNuevaLlamada}
                    onChange={(e) => setFechaNuevaLlamada(e.target.value)}
                    disabled={isCelularRepetido}
                    className="block w-full py-2 px-3 text-xs bg-amber-950/30 border border-amber-500/40 rounded-lg focus:outline-none focus:border-amber-400 text-amber-200 font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
              ) : (
                <div>
                  <label htmlFor="select_estado_cierre" className="block text-[10px] uppercase font-bold text-slate-300 tracking-wider mb-1.5">
                    Estado del Cierre
                  </label>
                  <select
                    id="select_estado_cierre"
                    value={estadoCierre}
                    onChange={(e) => setEstadoCierre(e.target.value as EstadoCierre)}
                    disabled={userRole !== 'admin' || isCelularRepetido}
                    className="block w-full py-2 px-3 text-xs bg-[#0B1120] border border-[#2A3B5C] rounded-lg focus:outline-none focus:border-cyan-400 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">-- Seleccionar Estado del Cierre --</option>
                    <option value={EstadoCierre.CAPTACION_EN_TRAMITE}>Captación en Trámite: Proceso de captación en curso.</option>
                    <option value={EstadoCierre.PENDIENTE}>Pendiente: Captado, falta cierre.</option>
                    <option value={EstadoCierre.CERRADO}>Cerrado: Cierre logrado.</option>
                    <option value={EstadoCierre.LIQUIDADO}>Liquidado: Operación pagada.</option>
                  </select>
                  {userRole !== 'admin' && (
                    <p className="text-[8px] text-slate-400 mt-0.5">Control de Cierre exclusivo para Administradores.</p>
                  )}
                </div>
              )}
            </div>

            {/* Custom Bonus Amount */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label htmlFor="input_monto_bono" className="block text-[10px] uppercase font-bold text-slate-300 tracking-wider mb-1.5">
                  Bono por Cierre (S/.)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400 font-mono text-xs font-bold">
                    S/
                  </span>
                  <input
                    type="number"
                    id="input_monto_bono"
                    min="0"
                    step="5"
                    value={montoBono}
                    onChange={(e) => setMontoBono(Number(e.target.value))}
                    disabled={true}
                    className="block w-full pl-8 pr-3 py-2 text-xs bg-[#0B1120]/60 border border-[#1E2D4A] rounded-lg text-slate-400 font-mono font-bold cursor-not-allowed"
                  />
                </div>
                <p className="text-[9px] text-slate-400 mt-0.5">
                  Informativo. El monto del bono se preestablece y edita desde la pestaña de Configuración.
                </p>
              </div>

              {(estadoCierre === EstadoCierre.CERRADO || estadoCierre === EstadoCierre.LIQUIDADO) && (
                <div>
                  <label htmlFor="input_fecha_cierre" className="block text-[10px] uppercase font-bold text-slate-300 tracking-wider mb-1.5">
                    Fecha del Cierre *
                  </label>
                  <input
                    type="date"
                    id="input_fecha_cierre"
                    value={fechaCierre}
                    onChange={(e) => setFechaCierre(e.target.value)}
                    disabled={userRole !== 'admin' || isCelularRepetido}
                    className="block w-full py-2 px-3 text-xs bg-[#0B1120] border border-[#2A3B5C] rounded-lg focus:outline-none focus:border-cyan-400 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
              )}
            </div>

            {/* Observations / Notes as dropdown select */}
            <div>
              <label htmlFor="select_notas" className="block text-[10px] uppercase font-bold text-slate-300 tracking-wider mb-1.5">
                Motivo / Detalle de Seguimiento (Opcional)
              </label>
              <select
                id="select_notas"
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                disabled={isCelularRepetido}
                className="block w-full py-2.5 px-3 text-xs bg-[#0B1120] border border-[#2A3B5C] rounded-lg focus:outline-none focus:border-cyan-400 text-white disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                <option value="">-- Seleccionar Motivo --</option>
                <option value="Agente Inmobiliario">Agente Inmobiliario</option>
                <option value="Malas experiencias">Malas experiencias</option>
                <option value="No contesta / Reagendar">No contesta / Reagendar</option>
                <option value="No desea exclusividad">No desea exclusividad</option>
                <option value="Solo trato directo">Solo trato directo</option>
                <option value="Tiene exclusiva (otra agencia)">Tiene exclusiva (otra agencia)</option>
                <option value="Trabaja en abierto (multiagente)">Trabaja en abierto (multiagente)</option>
                <option value="Ya vendido / Alquilado">Ya vendido / Alquilado</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={isCelularRepetido}
              className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white py-2.5 px-4 rounded-xl font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
              id="submit_cita_btn"
            >
              <PlusCircle className="w-4 h-4" />
              Guardar
            </button>
          </form>
        </div>
      </div>
      ) : (
        /* Right Section: Interactive List & Filtering - Now taking full width */
        <div className="w-full space-y-4">
          
          {/* Filter Bar Panel */}
          <div className="bg-[#111A2E] p-4 rounded-2xl border border-[#1E2D4A] shadow-xl" id="filters_panel">
            <h4 className="text-xs uppercase font-bold text-slate-300 tracking-wider mb-3 flex items-center gap-1.5">
              <Filter className="w-4 h-4 text-cyan-400" />
              Búsqueda y Filtros de Registros
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              {/* Search text */}
              <div className="relative md:col-span-2">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                  <Search className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  placeholder="Buscar por cliente, asistente, dirección o celular..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(capitalizeWords(e.target.value))}
                  className="pl-9 pr-3 py-2 w-full text-sm bg-[#0B1120] border border-[#2A3B5C] rounded-lg focus:outline-none focus:border-cyan-400 placeholder-slate-400 text-white font-medium capitalize"
                />
              </div>

              {/* Filter Assistant */}
              <div>
                <select
                  value={filterAsistente}
                  onChange={(e) => setFilterAsistente(e.target.value)}
                  className="py-2 px-2.5 w-full text-sm bg-[#0B1120] border border-[#2A3B5C] rounded-lg focus:outline-none focus:border-cyan-400 text-white"
                >
                  <option value="TODOS">Todos los asistentes</option>
                  {asistentes.map(as => (
                    <option key={as.id} value={as.id}>{as.nombreCompleto}</option>
                  ))}
                </select>
              </div>

              {/* Filter Cita State */}
              <div>
                <select
                  value={filterEstadoCita}
                  onChange={(e) => setFilterEstadoCita(e.target.value)}
                  className="py-2 px-2.5 w-full text-sm bg-[#0B1120] border border-[#2A3B5C] rounded-lg focus:outline-none focus:border-cyan-400 text-white"
                >
                  <option value="TODOS">Todos los estados de cita</option>
                  <option value={EstadoCita.PROSPECTO}>Prospecto</option>
                  <option value={EstadoCita.AGENDADA}>Agendada</option>
                  <option value={EstadoCita.REALIZADA}>Exitosa</option>
                  <option value={EstadoCita.CANCELADA}>Cancelada</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-3">
              {/* Filter Cierre State */}
              <div className="md:col-span-2">
                <select
                  value={filterEstadoCierre}
                  onChange={(e) => setFilterEstadoCierre(e.target.value)}
                  className="py-2 px-2.5 w-full text-sm bg-[#0B1120] border border-[#2A3B5C] rounded-lg focus:outline-none focus:border-cyan-400 text-white"
                >
                  <option value="TODOS">Todos los estados de cierre</option>
                  <option value={EstadoCierre.CAPTACION_EN_TRAMITE}>Captación en Trámite - Proceso de captación en curso</option>
                  <option value={EstadoCierre.PENDIENTE}>Pendiente - captación lograda pero cierre aún no</option>
                  <option value={EstadoCierre.EN_SEGUIMIENTO}>En seguimiento - propiedad en promoción</option>
                  <option value={EstadoCierre.DESCARTADO}>Descartado - cliente o propiedad descartada</option>
                  <option value={EstadoCierre.CERRADO}>Cerrado - se logró el cierre</option>
                  <option value={EstadoCierre.LIQUIDADO}>Liquidado - pagado</option>
                </select>
              </div>

              {/* Quick stats badge */}
              <div className="md:col-span-2 flex items-center justify-end gap-2 text-xs sm:text-sm text-slate-300 font-semibold font-mono">
                <span>Resultados: <strong className="text-cyan-400 font-bold">{filteredCitas.length}</strong></span>
                <span>•</span>
                <span>Bonos acumulados: <strong className="text-emerald-400 font-bold">{formatPEN(filteredCitas.reduce((sum, c) => sum + (c.estadoCierre === EstadoCierre.CERRADO ? c.montoBono : 0), 0))}</strong></span>
              </div>
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-[#111A2E] rounded-2xl border border-[#1E2D4A] shadow-xl overflow-hidden" id="citas_table_wrapper">
            {filteredCitas.length === 0 ? (
              <div className="p-10 text-center space-y-2">
                <Info className="w-8 h-8 text-slate-500 mx-auto" />
                <h4 className="text-base font-bold text-slate-300">No se encontraron registros</h4>
                <p className="text-sm text-slate-400">
                  {searchTerm || filterAsistente !== 'TODOS' || filterEstadoCita !== 'TODOS' || filterEstadoCierre !== 'TODOS' 
                    ? 'Prueba refinando tus criterios de búsqueda o filtros.' 
                    : 'Aún no se han ingresado registros en la plataforma.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#0B1120] border-b border-[#1E2D4A] text-slate-200 text-xs font-bold uppercase tracking-wider">
                      <th className="py-3.5 px-4">Asistente</th>
                      <th className="py-3.5 px-4">Llamada / Cita</th>
                      <th className="py-3.5 px-4">Cliente / Contacto</th>
                      <th className="py-3.5 px-4">Dirección / Distrito</th>
                      <th className="py-3.5 px-4">Motivo</th>
                      <th className="py-3.5 px-4">Estado Cita</th>
                      <th className="py-3.5 px-4">Bono / Cierre</th>
                      <th className="py-3.5 px-4 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1E2D4A]/60 text-sm text-slate-300">
                    {sortedCitas.map((cita) => {
                      const alertActive = isReprogramadaAlert(cita);

                      return (
                        <tr 
                          key={cita.id} 
                          className="transition-all hover:bg-[#1E2D4A]/40" 
                          id={`cita_row_${cita.id}`}
                        >
                          {/* Assistant */}
                          <td className="py-3.5 px-4">
                            <span className="font-bold text-white text-sm block">{cita.asistenteNombre}</span>
                            <span className="text-xs text-slate-400 font-mono">ID: {cita.id}</span>
                          </td>

                          {/* Date and hour */}
                          <td className="py-3.5 px-4 font-mono">
                            <div className="text-slate-300 text-xs flex items-center gap-1 mb-1">
                              <span className="font-bold text-slate-200">Llamada:</span> {formatToDDMMYYYY(cita.fechaLlamada)} {cita.horaLlamada ? `(${cita.horaLlamada})` : ''}
                            </div>
                            {cita.estadoCita === EstadoCita.REPROGRAMAR && cita.fechaNuevaLlamada && (
                              <div className={`text-amber-300 font-bold text-xs flex items-center gap-1 mb-1 bg-amber-950/80 p-1 px-2 rounded border border-amber-500/40 ${
                                alertActive ? 'animate-pulse bg-amber-900/90 border-amber-400 text-amber-200' : ''
                              }`}>
                                <span className="font-bold text-amber-400">Re-Llamar:</span> {formatToDDMMYYYY(cita.fechaNuevaLlamada)}
                              </div>
                            )}
                            <div className="text-white font-bold text-sm flex items-center gap-1">
                              <span className="text-slate-400 text-xs font-normal">Cita:</span> {cita.fechaCita ? formatToDDMMYYYY(cita.fechaCita) : <span className="text-slate-500 font-medium italic text-xs">Sin programar</span>}
                            </div>
                            <div className="text-xs text-slate-400 pl-8">{cita.horaCita || '--:--'}</div>
                          </td>

                          {/* Client */}
                          <td className="py-3.5 px-4 font-sans">
                            <div className="flex flex-col gap-1">
                              {cita.clienteNombre ? (
                                <span className="font-bold text-white text-sm block">{cita.clienteNombre}</span>
                              ) : (
                                <span className="text-slate-500 font-medium italic text-xs block">Sin nombre</span>
                              )}
                              <span className="text-xs text-slate-300 font-mono font-medium">{cita.clienteCelular}</span>
                              {alertActive && (
                                <span className="inline-flex w-max items-center gap-1 px-2 py-1 bg-amber-500/20 text-amber-300 text-xs font-black rounded border border-amber-500/40 animate-pulse mt-1 shadow-sm">
                                  <Phone className="w-3 h-3 text-amber-400" />
                                  ¡VOLVER A LLAMAR HOY!
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Address / Type */}
                          <td className="py-3.5 px-4 max-w-xs">
                            {cita.direccionPropiedad ? (
                              <span className="font-medium text-slate-100 text-sm block truncate" title={cita.direccionPropiedad}>
                                {cita.direccionPropiedad}
                              </span>
                            ) : (
                              <span className="text-slate-500 text-xs italic block truncate">Sin dirección</span>
                            )}
                            <div className="flex flex-wrap gap-1.5 mt-1 items-center">
                              {cita.distritoPropiedad && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-950/50 text-emerald-300 text-xs font-bold rounded border border-emerald-500/30">
                                  <MapPin className="w-3 h-3 text-emerald-400 shrink-0" />
                                  {cita.distritoPropiedad}
                                </span>
                              )}
                              <span className="text-xs text-slate-300 font-semibold uppercase tracking-wider">
                                {cita.tipoPropiedad} • {cita.tipoOperacion}
                              </span>
                            </div>
                          </td>

                          {/* Motivo / Detalle */}
                          <td className="py-3.5 px-4">
                            {cita.notas ? (
                              <span className="inline-flex items-center px-2.5 py-1 rounded bg-[#0B1120] text-slate-200 text-xs font-medium border border-[#2A3B5C]">
                                {cita.notas}
                              </span>
                            ) : (
                              <span className="text-slate-500 italic text-xs">Sin especificar</span>
                            )}
                          </td>

                          {/* Cita Status */}
                          <td className="py-3.5 px-4">
                            <span className={`inline-flex px-2.5 py-1 rounded text-xs uppercase tracking-wide font-bold ${getCitaBadge(cita.estadoCita)}`}>
                              {cita.estadoCita === EstadoCita.PROSPECTO ? 'Prospecto' : cita.estadoCita === EstadoCita.REPROGRAMAR ? 'Reprogramar' : cita.estadoCita === EstadoCita.REALIZADA ? 'Exitosa' : cita.estadoCita === EstadoCita.AGENDADA ? 'Agendada' : 'Cancelada'}
                            </span>
                          </td>

                          {/* Cierre / Bono Status */}
                          <td className="py-3.5 px-4">
                            <div className="space-y-1">
                              <span className={`inline-flex px-2.5 py-1 rounded text-xs uppercase tracking-wide font-semibold ${getCierreBadge(cita.estadoCierre)}`}>
                                {cita.estadoCierre === EstadoCierre.PENDIENTE ? 'Pendiente' : cita.estadoCierre === EstadoCierre.CERRADO ? 'Cerrado' : cita.estadoCierre === EstadoCierre.LIQUIDADO ? 'Liquidado' : cita.estadoCierre}
                              </span>
                              <div className="text-sm font-mono font-bold text-cyan-400 block">
                                {formatPEN(cita.montoBono)}
                              </div>
                            </div>
                          </td>

                          {/* Actions */}
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => setViewingCita(cita)}
                                className="p-1.5 px-2 bg-[#0B1120] hover:bg-[#1E2D4A] border border-[#2A3B5C] text-slate-300 hover:text-white rounded-md transition-colors cursor-pointer"
                                title="Ver detalles del registro"
                              >
                                <Eye className="w-4 h-4" />
                              </button>

                              <button
                                onClick={() => handleEdit(cita)}
                                className="p-1.5 px-2 bg-[#0B1120] hover:bg-[#1E2D4A] border border-[#2A3B5C] text-cyan-400 rounded-md transition-colors cursor-pointer"
                                title="Editar cita"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              
                              {userRole === 'admin' && (
                                deleteConfirmId === cita.id ? (
                                  <div className="flex items-center gap-1">
                                    <button
                                      onClick={() => handleDelete(cita.id)}
                                      className="p-1 px-2 text-xs font-bold bg-rose-600 text-white rounded cursor-pointer"
                                      title="Confirmar eliminación"
                                    >
                                      Eliminar
                                    </button>
                                    <button
                                      onClick={() => setDeleteConfirmId(null)}
                                      className="p-1 px-2 text-xs font-bold bg-[#1E2D4A] text-slate-300 rounded cursor-pointer"
                                    >
                                      No
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => setDeleteConfirmId(cita.id)}
                                    className="p-1.5 px-2 bg-[#0B1120] hover:bg-rose-950/40 border border-[#2A3B5C] hover:border-rose-500/30 text-slate-400 hover:text-rose-400 rounded-md transition-colors cursor-pointer"
                                    title="Eliminar cita"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          
          {/* Helpful Strategic Tips Footer */}
          <div className="p-4 bg-[#111A2E] border border-[#1E2D4A] rounded-2xl flex gap-3 text-xs text-slate-300">
            <Info className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-white">Estrategia de Captación - Oscar Russo:</p>
              <p className="mt-0.5 text-slate-400">
                Para maximizar el éxito comercial y potenciar las ganancias, fomenta que la asistente se enfoque en la gestión rápida y agendamiento impecable de citas. Al alimentar de forma constante este embudo de citas calificadas, aumentará directamente el volumen de cierres de venta o alquiler y, con ello, sus bonos variables correspondientes.
              </p>
            </div>
          </div>

        </div>
      )}

      {/* Modal Visor de Detalles del Registro (Solo Lectura) */}
      {viewingCita && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#111A2E] w-full max-w-2xl rounded-2xl shadow-2xl border border-[#1E2D4A] overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="bg-[#0B1120] p-4 text-white flex justify-between items-center shrink-0 border-b border-[#1E2D4A]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-[#1E2D4A] rounded-xl text-cyan-400">
                  <Eye className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base tracking-wide text-white">Detalles del Registro</h3>
                  <p className="text-xs text-slate-400">Vista de solo lectura del historial registrado</p>
                </div>
              </div>
              <button
                onClick={() => setViewingCita(null)}
                className="p-1.5 hover:bg-[#1E2D4A] rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
                title="Cerrar visor"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body - Scrollable */}
            <div className="p-5 space-y-5 overflow-y-auto text-sm text-slate-300">
              
              {/* Status Highlights */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-[#0B1120] p-3.5 rounded-xl border border-[#1E2D4A]">
                <div>
                  <span className="text-xs uppercase font-bold text-slate-400 block mb-1">Estado de Cita</span>
                  <span className={`inline-flex px-2.5 py-1 rounded text-xs uppercase tracking-wide font-bold ${getCitaBadge(viewingCita.estadoCita)}`}>
                    {viewingCita.estadoCita === EstadoCita.PROSPECTO ? 'Prospecto' : viewingCita.estadoCita === EstadoCita.REPROGRAMAR ? 'Reprogramar' : viewingCita.estadoCita === EstadoCita.REALIZADA ? 'Exitosa' : viewingCita.estadoCita === EstadoCita.AGENDADA ? 'Agendada' : 'Cancelada'}
                  </span>
                </div>

                <div>
                  <span className="text-xs uppercase font-bold text-slate-400 block mb-1">Estado de Cierre</span>
                  <span className={`inline-flex px-2.5 py-1 rounded text-xs uppercase tracking-wide font-bold ${getCierreBadge(viewingCita.estadoCierre)}`}>
                    {viewingCita.estadoCierre === EstadoCierre.PENDIENTE ? 'Pendiente' : viewingCita.estadoCierre === EstadoCierre.CERRADO ? 'Cerrado' : viewingCita.estadoCierre === EstadoCierre.LIQUIDADO ? 'Liquidado' : viewingCita.estadoCierre}
                  </span>
                </div>

                <div>
                  <span className="text-xs uppercase font-bold text-slate-400 block mb-1">Bono Estimado</span>
                  <span className="font-mono font-bold text-cyan-400 text-base block">
                    {formatPEN(viewingCita.montoBono)}
                  </span>
                </div>
              </div>

              {/* Section 1: Cliente & Asistente */}
              <div className="space-y-2">
                <h4 className="text-xs uppercase font-bold text-slate-300 tracking-wider flex items-center gap-1.5 border-b border-[#1E2D4A] pb-1">
                  <User className="w-4 h-4 text-cyan-400" />
                  Cliente & Gestión
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-[#0B1120]/60 p-3 rounded-xl border border-[#1E2D4A]">
                  <div>
                    <span className="text-xs font-semibold text-slate-400 block">Nombre del Cliente</span>
                    <span className="text-sm font-bold text-white block">{viewingCita.clienteNombre || 'No registrado'}</span>
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-slate-400 block">Celular de Contacto</span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-sm font-bold font-mono text-white">{viewingCita.clienteCelular || 'Sin teléfono'}</span>
                      {viewingCita.clienteCelular && (
                        <a
                          href={`https://wa.me/51${viewingCita.clienteCelular.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-950/50 hover:bg-emerald-900/60 px-2 py-0.5 rounded border border-emerald-500/30 transition-colors"
                        >
                          WhatsApp
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-xs font-semibold text-slate-400 block">Asistente Responsable</span>
                    <span className="text-sm font-semibold text-slate-200">
                      {asistentes.find(a => a.id === viewingCita.asistenteId)?.nombreCompleto || viewingCita.asistenteNombre || 'No asignada'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Section 2: Inmueble y Operación */}
              <div className="space-y-2">
                <h4 className="text-xs uppercase font-bold text-slate-300 tracking-wider flex items-center gap-1.5 border-b border-[#1E2D4A] pb-1">
                  <MapPin className="w-4 h-4 text-cyan-400" />
                  Propiedad & Operación
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-[#0B1120]/60 p-3 rounded-xl border border-[#1E2D4A]">
                  <div>
                    <span className="text-xs font-semibold text-slate-400 block">Distrito</span>
                    <span className="text-sm font-bold text-white block">{viewingCita.distritoPropiedad || 'No especificado'}</span>
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-slate-400 block">Tipo & Operación</span>
                    <span className="text-sm font-bold text-white block">
                      {viewingCita.tipoPropiedad} • <span className="text-cyan-400">{viewingCita.tipoOperacion}</span>
                    </span>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-xs font-semibold text-slate-400 block">Dirección de la Propiedad</span>
                    <span className="text-sm text-slate-200 block">{viewingCita.direccionPropiedad || 'Sin dirección especificada'}</span>
                  </div>
                </div>
              </div>

              {/* Section 3: Fechas de Gestión */}
              <div className="space-y-2">
                <h4 className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1.5 border-b border-[#1E2D4A] pb-1">
                  <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                  Fechas y Tiempos de Gestión
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-[#0B1120]/60 p-3 rounded-xl border border-[#1E2D4A]">
                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 block">Fecha de Captación / Llamada</span>
                    <span className="text-xs font-medium text-slate-200 block">
                      {viewingCita.fechaLlamada ? formatToDDMMYYYY(viewingCita.fechaLlamada) : 'Sin fecha'} {viewingCita.horaLlamada ? `(${viewingCita.horaLlamada})` : ''}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 block">Fecha de Cita Agendada</span>
                    <span className="text-xs font-medium text-slate-200 block">
                      {viewingCita.fechaCita ? `${formatToDDMMYYYY(viewingCita.fechaCita)} (${viewingCita.horaCita || ''})` : 'Sin cita agendada'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 block">Próxima Re-Llamada</span>
                    <span className="text-xs font-medium text-slate-200 block">
                      {viewingCita.fechaNuevaLlamada ? formatToDDMMYYYY(viewingCita.fechaNuevaLlamada) : 'No requerida'}
                    </span>
                  </div>
                  {viewingCita.fechaCierre && (
                    <div className="sm:col-span-3 pt-1 border-t border-[#1E2D4A]">
                      <span className="text-[10px] font-semibold text-slate-400 block">Fecha de Cierre Comercial</span>
                      <span className="text-xs font-bold text-emerald-400">{formatToDDMMYYYY(viewingCita.fechaCierre)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Section 4: Motivo / Detalle de Seguimiento */}
              <div className="space-y-2">
                <h4 className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1.5 border-b border-[#1E2D4A] pb-1">
                  <FileText className="w-3.5 h-3.5 text-cyan-400" />
                  Motivo / Detalle de Seguimiento
                </h4>
                <div className="bg-[#0B1120]/60 p-3 rounded-xl border border-[#1E2D4A]">
                  {viewingCita.notas ? (
                    <span className="inline-block bg-[#1E2D4A] px-2.5 py-1 rounded-lg border border-[#2A3B5C] text-xs font-bold text-slate-200">
                      {viewingCita.notas}
                    </span>
                  ) : (
                    <span className="text-slate-500 italic text-xs">Sin motivo u observaciones registradas.</span>
                  )}
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-[#0B1120] border-t border-[#1E2D4A] flex justify-between items-center shrink-0">
              <span className="text-[11px] text-slate-400 italic">Modo Visor • Registro # {viewingCita.id.slice(0, 8)}</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const toEdit = viewingCita;
                    setViewingCita(null);
                    handleEdit(toEdit);
                  }}
                  className="px-3 py-1.5 bg-[#1E2D4A] border border-[#2A3B5C] hover:bg-[#2A3B5C] text-slate-200 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Edit className="w-3.5 h-3.5 text-cyan-400" />
                  Editar
                </button>
                <button
                  onClick={() => setViewingCita(null)}
                  className="px-4 py-1.5 bg-primary hover:bg-primary/90 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
