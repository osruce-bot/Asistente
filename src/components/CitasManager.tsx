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
  Info
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

interface CitasManagerProps {
  citas: Cita[];
  asistentes: Asistente[];
  config: ConfigGeneral;
  onSaveCita: (cita: Cita) => void;
  onDeleteCita: (id: string) => void;
  isSyncing: boolean;
  userRole?: 'admin' | 'asistente' | null;
  onSaveAsistente?: (asistente: Asistente) => void;
}

export default function CitasManager({
  citas,
  asistentes,
  config,
  onSaveCita,
  onDeleteCita,
  isSyncing,
  userRole = 'admin',
  onSaveAsistente
}: CitasManagerProps) {
  // Local state for the appointment form
  const [editingId, setEditingId] = useState<string | null>(null);
  const [asistenteId, setAsistenteId] = useState('');
  const [fechaCita, setFechaCita] = useState('');
  const [horaCita, setHoraCita] = useState('');
  const [clienteNombre, setClienteNombre] = useState('');
  const [clienteCelular, setClienteCelular] = useState('');
  const [direccionPropiedad, setDireccionPropiedad] = useState('');
  const [tipoPropiedad, setTipoPropiedad] = useState('Departamento');
  const [tipoOperacion, setTipoOperacion] = useState<TipoOperacionCita>(TipoOperacionCita.VENTA);
  const [estadoCita, setEstadoCita] = useState<EstadoCita>(EstadoCita.PROSPECTO);
  const [estadoCierre, setEstadoCierre] = useState<EstadoCierre>(EstadoCierre.PENDIENTE);
  const [fechaCierre, setFechaCierre] = useState('');
  const [montoBono, setMontoBono] = useState<number>(config.bonoVentaPredeterminado);
  const [notas, setNotas] = useState('');

  // New fields
  const [fechaLlamada, setFechaLlamada] = useState(getLocalDateString());
  const [fechaNuevaLlamada, setFechaNuevaLlamada] = useState('');
  const [distritoPropiedad, setDistritoPropiedad] = useState('');
  const [showDistritos, setShowDistritos] = useState(false);

  const isCelularRepetido = React.useMemo(() => {
    const cleanCelular = clienteCelular.trim();
    if (!cleanCelular) return false;
    return citas.some(c => c.clienteCelular.trim() === cleanCelular && c.id !== editingId);
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

  // Auto-adjust default bonus when operation type changes
  const handleOperationTypeChange = (type: TipoOperacionCita) => {
    setTipoOperacion(type);
    if (!editingId) {
      setMontoBono(
        type === TipoOperacionCita.VENTA 
          ? config.bonoVentaPredeterminado 
          : config.bonoAlquilerPredeterminado
      );
    }
  };

  const handleEdit = (cita: Cita) => {
    setEditingId(cita.id);
    setAsistenteId(cita.asistenteId);
    setFechaCita(cita.fechaCita);
    setHoraCita(cita.horaCita);
    setClienteNombre(cita.clienteNombre);
    setClienteCelular(cita.clienteCelular);
    setDireccionPropiedad(cita.direccionPropiedad);
    setTipoPropiedad(cita.tipoPropiedad);
    setTipoOperacion(cita.tipoOperacion);
    setEstadoCita(cita.estadoCita);
    setEstadoCierre(cita.estadoCierre);
    setFechaCierre(cita.fechaCierre || '');
    setMontoBono(cita.montoBono);
    setNotas(cita.notas || '');
    setFechaLlamada(cita.fechaLlamada || getLocalDateString());
    setFechaNuevaLlamada(cita.fechaNuevaLlamada || '');
    setDistritoPropiedad(cita.distritoPropiedad || '');
    setErrorMsg('');
    setSuccessMsg('');
    // Scroll to form on mobile/desktop
    const formElement = document.getElementById('cita_form_container');
    if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setAsistenteId('');
    setFechaCita('');
    setHoraCita('');
    setClienteNombre('');
    setClienteCelular('');
    setDireccionPropiedad('');
    setTipoPropiedad('Departamento');
    setTipoOperacion(TipoOperacionCita.VENTA);
    setEstadoCita(EstadoCita.PROSPECTO);
    setEstadoCierre(EstadoCierre.PENDIENTE);
    setFechaCierre('');
    setMontoBono(config.bonoVentaPredeterminado);
    setNotas('');
    setFechaLlamada(getLocalDateString());
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

    const finalEstadoCita = userRole === 'admin' 
      ? estadoCita 
      : (editingId ? (citas.find(c => c.id === editingId)?.estadoCita || EstadoCita.PROSPECTO) : EstadoCita.PROSPECTO);

    if (finalEstadoCita === EstadoCita.REPROGRAMAR && !fechaNuevaLlamada) {
      setErrorMsg('Por favor seleccione la fecha de la nueva llamada para reprogramar.');
      return;
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
      tipoPropiedad,
      tipoOperacion,
      estadoCita: finalEstadoCita,
      estadoCierre: userRole === 'admin' ? estadoCierre : EstadoCierre.PENDIENTE,
      fechaCierre: (estadoCierre === EstadoCierre.CERRADO || estadoCierre === EstadoCierre.LIQUIDADO) ? (fechaCierre || new Date().toISOString().split('T')[0]) : '',
      montoBono: Number(montoBono),
      notas: notas.trim(),
      fechaLlamada: fechaLlamada.trim(),
      fechaNuevaLlamada: finalEstadoCita === EstadoCita.REPROGRAMAR ? fechaNuevaLlamada : '',
      distritoPropiedad: distritoPropiedad.trim()
    };

    onSaveCita(compiledCita);
    setSuccessMsg(editingId ? 'Prospecto actualizado correctamente.' : 'Nuevo prospecto registrado con éxito.');
    resetForm();

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
  const filteredCitas = citas.filter(cita => {
    const matchesSearch = 
      cita.clienteNombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cita.asistenteNombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cita.direccionPropiedad.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cita.clienteCelular.includes(searchTerm);

    const matchesAsistente = filterAsistente === 'TODOS' || cita.asistenteId === filterAsistente;
    const matchesEstadoCita = filterEstadoCita === 'TODOS' || cita.estadoCita === filterEstadoCita;
    const matchesEstadoCierre = filterEstadoCierre === 'TODOS' || cita.estadoCierre === filterEstadoCierre;

    return matchesSearch && matchesAsistente && matchesEstadoCita && matchesEstadoCierre;
  });

  const isReprogramadaAlert = (cita: Cita) => {
    if (cita.estadoCita !== EstadoCita.REPROGRAMAR || !cita.fechaNuevaLlamada) return false;
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${day}`;
    return todayStr >= cita.fechaNuevaLlamada;
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Form and Calls */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Create/Edit Appointment */}
          <div className="bg-white rounded-md border border-slate-200 shadow-sm overflow-hidden h-fit" id="cita_form_container">
          <div className="p-4 bg-navy border-b border-navy/20 flex justify-between items-center text-white">
            <h3 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-400" />
              {editingId ? 'Editar Prospecto' : 'Registrar Nuevo Prospecto'}
            </h3>
            {editingId && (
              <button 
                type="button" 
                onClick={resetForm}
                className="text-[10px] bg-slate-800 hover:bg-slate-700 font-bold uppercase px-2 py-1 rounded cursor-pointer"
              >
                Cancelar
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="p-4 space-y-4">
            {/* 1. Assistant dropdown */}
            <div>
              <label htmlFor="select_asistente" className="block text-[10px] uppercase font-bold text-slate-700 tracking-wider mb-1.5">
                Asistente / Colaborador *
              </label>
              <select
                id="select_asistente"
                value={asistenteId}
                onChange={(e) => setAsistenteId(e.target.value)}
                className="block w-full py-2 px-3 text-sm bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-slate-900"
              >
                <option value="">-- Seleccionar Colaborador --</option>
                {asistentes.filter(as => as.activo).map((as) => (
                  <option key={as.id} value={as.id}>{as.nombreCompleto} ({as.cargo})</option>
                ))}
              </select>
              {asistentes.length === 0 && (
                <p className="text-[10px] text-brand-red font-semibold mt-1">
                  ⚠️ No hay asistentes registrados. Por favor cree uno primero en la pestaña de Recursos Humanos.
                </p>
              )}
            </div>

            {/* 2. Celular de Contacto (Immediately after Assistant) */}
            <div>
              <label htmlFor="input_cliente_celular" className="block text-[10px] uppercase font-bold text-slate-700 tracking-wider mb-1.5">
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
                  className={`block w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border rounded-md focus:bg-white focus:outline-none focus:ring-2 text-slate-900 font-mono transition-colors ${
                    isCelularRepetido
                      ? 'border-brand-red ring-2 ring-brand-red/20 focus:border-brand-red focus:ring-brand-red/20 bg-red-50'
                      : 'border-slate-200 focus:ring-primary/20 focus:border-primary'
                  }`}
                />
              </div>
              {isCelularRepetido && (
                <div className="mt-1.5 p-2 bg-red-50 border border-brand-red/30 rounded text-brand-red text-[10px] font-bold flex items-start gap-1.5 animate-pulse">
                  <AlertCircle className="w-3.5 h-3.5 text-brand-red shrink-0 mt-0.5" />
                  <span>
                    Este celular ya está registrado en otro prospecto. 
                    <strong> Corríjalo para poder continuar con el ingreso de datos.</strong>
                  </span>
                </div>
              )}
            </div>

            {/* 3. Fecha de Llamada (Immediately after Celular) */}
            <div>
              <label htmlFor="input_fecha_llamada" className="block text-[10px] uppercase font-bold text-slate-700 tracking-wider mb-1.5">
                Fecha de Registro del Prospecto *
              </label>
              <input
                type="date"
                id="input_fecha_llamada"
                value={fechaLlamada}
                onChange={(e) => setFechaLlamada(e.target.value)}
                disabled={true}
                className="block w-full py-2 px-3 text-sm bg-slate-100 border border-slate-200 rounded-md text-slate-500 font-medium cursor-not-allowed"
              />
              <p className="text-[9px] text-slate-400 mt-0.5">
                Informativo. Se coloca automáticamente con la fecha de registro del prospecto.
              </p>
            </div>

            {/* 4. Nombre del Cliente / Propietario */}
            <div>
              <label htmlFor="input_cliente_nombre" className="block text-[10px] uppercase font-bold text-slate-700 tracking-wider mb-1.5">
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
                  className="block w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-slate-900 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            {/* 5. Date & Time of Appointment (Fecha y Hora de Cita) */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="input_fecha_cita" className="block text-[10px] uppercase font-bold text-slate-700 tracking-wider mb-1.5">
                  Fecha de Cita (Visita) *
                </label>
                <input
                  type="date"
                  id="input_fecha_cita"
                  value={fechaCita}
                  onChange={(e) => setFechaCita(e.target.value)}
                  disabled={isCelularRepetido}
                  className="block w-full py-2 px-3 text-sm bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-slate-900 disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
              <div>
                <label htmlFor="input_hora_cita" className="block text-[10px] uppercase font-bold text-slate-700 tracking-wider mb-1.5">
                  Hora de Cita
                </label>
                <input
                  type="time"
                  id="input_hora_cita"
                  value={horaCita}
                  onChange={(e) => setHoraCita(e.target.value)}
                  disabled={isCelularRepetido}
                  className="block w-full py-2 px-3 text-sm bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-slate-900 disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            {/* 6. Property Address */}
            <div>
              <label htmlFor="input_direccion" className="block text-[10px] uppercase font-bold text-slate-700 tracking-wider mb-1.5">
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
                  className="block w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-slate-900 disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            {/* 7. Distrito de la Propiedad (with autocomplete suggestions) */}
            <div>
              <label htmlFor="input_distrito" className="block text-[10px] uppercase font-bold text-slate-700 tracking-wider mb-1.5">
                Distrito de la Propiedad *
              </label>
              <div className="relative" id="distrito_autocomplete_wrapper">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                  <MapPin className="w-4 h-4 text-emerald-500" />
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
                  className="block w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-slate-900 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                {!isCelularRepetido && showDistritos && distritoPropiedad.trim() && (
                  <div className="absolute z-30 w-full bg-white border border-slate-200 rounded-md shadow-lg max-h-48 overflow-y-auto mt-1 divide-y divide-slate-100">
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
                          className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 text-slate-700 font-medium cursor-pointer"
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
                <label htmlFor="select_tipo_propiedad" className="block text-[10px] uppercase font-bold text-slate-700 tracking-wider mb-1.5">
                  Tipo de Inmueble
                </label>
                <select
                  id="select_tipo_propiedad"
                  value={tipoPropiedad}
                  onChange={(e) => setTipoPropiedad(e.target.value)}
                  disabled={isCelularRepetido}
                  className="block w-full py-2 px-3 text-sm bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-slate-900 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="Departamento">Departamento</option>
                  <option value="Casa">Casa</option>
                  <option value="Local Comercial">Local Comercial</option>
                  <option value="Terreno">Terreno</option>
                  <option value="Oficina">Oficina</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-700 tracking-wider mb-1.5">
                  Operación
                </label>
                <div className="flex bg-slate-100 p-1 rounded-md">
                  <button
                    type="button"
                    onClick={() => !isCelularRepetido && handleOperationTypeChange(TipoOperacionCita.VENTA)}
                    disabled={isCelularRepetido}
                    className={`flex-1 py-1 text-xs font-bold rounded cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                      tipoOperacion === TipoOperacionCita.VENTA 
                        ? 'bg-primary text-white shadow-sm' 
                        : 'text-slate-600 hover:text-slate-900'
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
                        : 'text-slate-600 hover:text-slate-900'
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
                <label htmlFor="select_estado_cita" className="block text-[10px] uppercase font-bold text-slate-700 tracking-wider mb-1.5">
                  Estado de la Cita
                </label>
                <select
                  id="select_estado_cita"
                  value={estadoCita}
                  onChange={(e) => setEstadoCita(e.target.value as EstadoCita)}
                  disabled={isCelularRepetido}
                  className="block w-full py-2 px-3 text-sm bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-slate-900 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value={EstadoCita.PROSPECTO}>Prospecto</option>
                  <option value={EstadoCita.REPROGRAMAR}>Reprogramar</option>
                  <option value={EstadoCita.AGENDADA}>Agendada</option>
                  <option value={EstadoCita.REALIZADA}>Exitosa</option>
                  <option value={EstadoCita.CANCELADA}>Cancelada</option>
                </select>
              </div>

              {estadoCita === EstadoCita.REPROGRAMAR ? (
                <div>
                  <label htmlFor="input_fecha_nueva_llamada" className="block text-[10px] uppercase font-bold text-red-600 tracking-wider mb-1.5 flex items-center gap-1">
                    <Phone className="w-3 h-3 text-red-500 animate-pulse" />
                    Fecha Nueva Llamada *
                  </label>
                  <input
                    type="date"
                    id="input_fecha_nueva_llamada"
                    value={fechaNuevaLlamada}
                    onChange={(e) => setFechaNuevaLlamada(e.target.value)}
                    disabled={isCelularRepetido}
                    className="block w-full py-2 px-3 text-sm bg-amber-50 border border-amber-300 rounded-md focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-slate-900 font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
              ) : (
                <div>
                  <label htmlFor="select_estado_cierre" className="block text-[10px] uppercase font-bold text-slate-700 tracking-wider mb-1.5">
                    Estado del Cierre
                  </label>
                  <select
                    id="select_estado_cierre"
                    value={estadoCierre}
                    onChange={(e) => setEstadoCierre(e.target.value as EstadoCierre)}
                    disabled={userRole !== 'admin' || isCelularRepetido}
                    className="block w-full py-2 px-3 text-sm bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-slate-900 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value={EstadoCierre.PENDIENTE}>Pendiente - la captación se logró pero el cierre aún</option>
                    <option value={EstadoCierre.CERRADO}>Cerrado - se logró el cierre</option>
                    <option value={EstadoCierre.LIQUIDADO}>Liquidado - pagado</option>
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
                <label htmlFor="input_monto_bono" className="block text-[10px] uppercase font-bold text-slate-700 tracking-wider mb-1.5">
                  Bono por Cierre (S/.)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-500 font-mono text-xs font-bold">
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
                    className="block w-full pl-8 pr-3 py-2 text-sm bg-slate-100 border border-slate-200 rounded-md text-slate-500 font-mono font-bold cursor-not-allowed"
                  />
                </div>
                <p className="text-[9px] text-slate-400 mt-0.5">
                  Informativo. El monto del bono se preestablece y edita desde la pestaña de Configuración.
                </p>
              </div>

              {(estadoCierre === EstadoCierre.CERRADO || estadoCierre === EstadoCierre.LIQUIDADO) && (
                <div>
                  <label htmlFor="input_fecha_cierre" className="block text-[10px] uppercase font-bold text-slate-700 tracking-wider mb-1.5">
                    Fecha del Cierre *
                  </label>
                  <input
                    type="date"
                    id="input_fecha_cierre"
                    value={fechaCierre}
                    onChange={(e) => setFechaCierre(e.target.value)}
                    disabled={userRole !== 'admin' || isCelularRepetido}
                    className="block w-full py-2 px-3 text-sm bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-slate-900 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
              )}
            </div>

            {/* Observations / Notes */}
            <div>
              <label htmlFor="textarea_notas" className="block text-[10px] uppercase font-bold text-slate-700 tracking-wider mb-1.5">
                Observaciones / Detalles de Seguimiento
              </label>
              <textarea
                id="textarea_notas"
                rows={3}
                placeholder="Indicar detalles de la captación o el progreso..."
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                disabled={isCelularRepetido}
                className="block w-full py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-slate-900 disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            <button
              type="submit"
              disabled={isCelularRepetido}
              className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/95 text-white py-2.5 px-4 rounded-md font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              id="submit_cita_btn"
            >
              <PlusCircle className="w-4 h-4" />
              {editingId ? 'Guardar Cambios' : 'Registrar Prospecto'}
            </button>
          </form>
        </div>
      </div>

      {/* Right Section: Interactive List & Filtering */}
      <div className="lg:col-span-2 space-y-4">
          
          {/* Filter Bar Panel */}
          <div className="bg-white p-4 rounded-md border border-slate-200 shadow-sm" id="filters_panel">
            <h4 className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-3 flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              Búsqueda y Filtros de Prospectos
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
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-3 py-2 w-full text-xs bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary placeholder-slate-400 text-slate-800 font-medium"
                />
              </div>

              {/* Filter Assistant */}
              <div>
                <select
                  value={filterAsistente}
                  onChange={(e) => setFilterAsistente(e.target.value)}
                  className="py-2 px-2 w-full text-xs bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none text-slate-800"
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
                  className="py-2 px-2 w-full text-xs bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none text-slate-800"
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
                  className="py-2 px-2 w-full text-xs bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none text-slate-800"
                >
                  <option value="TODOS">Todos los estados de cierre</option>
                  <option value={EstadoCierre.PENDIENTE}>Pendiente - captación lograda pero cierre aún no</option>
                  <option value={EstadoCierre.CERRADO}>Cerrado - se logró el cierre</option>
                  <option value={EstadoCierre.LIQUIDADO}>Liquidado - pagado</option>
                </select>
              </div>

              {/* Quick stats badge */}
              <div className="md:col-span-2 flex items-center justify-end gap-2 text-[11px] text-slate-500 font-semibold font-mono">
                <span>Resultados: <strong className="text-primary">{filteredCitas.length}</strong></span>
                <span>•</span>
                <span>Bonos acumulados: <strong className="text-primary">{formatPEN(filteredCitas.reduce((sum, c) => sum + (c.estadoCierre === EstadoCierre.CERRADO ? c.montoBono : 0), 0))}</strong></span>
              </div>
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-white rounded-md border border-slate-200 shadow-sm overflow-hidden" id="citas_table_wrapper">
            {filteredCitas.length === 0 ? (
              <div className="p-10 text-center space-y-2">
                <Info className="w-8 h-8 text-slate-300 mx-auto" />
                <h4 className="text-sm font-bold text-slate-700">No se encontraron citas</h4>
                <p className="text-xs text-slate-500">
                  {searchTerm || filterAsistente !== 'TODOS' || filterEstadoCita !== 'TODOS' || filterEstadoCierre !== 'TODOS' 
                    ? 'Prueba refinando tus criterios de búsqueda o filtros.' 
                    : 'Aún no se han registrado citas logradas en la plataforma.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-navy border-b border-navy/20 text-white text-[10px] font-bold uppercase tracking-wider">
                      <th className="py-3 px-4">Asistente</th>
                      <th className="py-3 px-4">Llamada / Cita</th>
                      <th className="py-3 px-4">Cliente / Contacto</th>
                      <th className="py-3 px-4">Dirección / Distrito</th>
                      <th className="py-3 px-4">Estado Cita</th>
                      <th className="py-3 px-4">Bono / Cierre</th>
                      <th className="py-3 px-4 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                    {sortedCitas.map((cita) => {
                      // Status colors helper
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

                      const alertActive = isReprogramadaAlert(cita);

                      return (
                        <tr 
                          key={cita.id} 
                          className={`transition-all ${
                            alertActive 
                              ? 'bg-amber-50 hover:bg-amber-100/70 border-l-4 border-l-amber-500 animate-pulse' 
                              : 'hover:bg-slate-50'
                          }`} 
                          id={`cita_row_${cita.id}`}
                        >
                          {/* Assistant */}
                          <td className="py-3.5 px-4">
                            <span className="font-bold text-slate-900 block">{cita.asistenteNombre}</span>
                            <span className="text-[10px] text-slate-400 font-mono">ID: {cita.id}</span>
                          </td>

                          {/* Date and hour */}
                          <td className="py-3.5 px-4 font-mono">
                            <div className="text-slate-500 text-[10px] flex items-center gap-0.5 mb-0.5">
                              <span className="font-bold text-slate-600">Llamada:</span> {formatToDDMMYYYY(cita.fechaLlamada)}
                            </div>
                            {cita.estadoCita === EstadoCita.REPROGRAMAR && cita.fechaNuevaLlamada && (
                              <div className="text-amber-800 font-bold text-[10px] flex items-center gap-0.5 mb-0.5 bg-amber-100/70 p-0.5 px-1 rounded border border-amber-200">
                                <span className="font-bold text-amber-700">Re-Llamar:</span> {formatToDDMMYYYY(cita.fechaNuevaLlamada)}
                              </div>
                            )}
                            <div className="text-slate-800 font-bold text-[11px] flex items-center gap-0.5">
                              <span className="text-slate-600">Cita:</span> {cita.fechaCita ? formatToDDMMYYYY(cita.fechaCita) : <span className="text-slate-400 font-medium italic">Sin programar</span>}
                            </div>
                            <div className="text-[10px] text-slate-500 pl-8">{cita.horaCita || '--:--'}</div>
                          </td>

                          {/* Client */}
                          <td className="py-3.5 px-4 font-sans">
                            <div className="flex flex-col gap-0.5">
                              {cita.clienteNombre ? (
                                <span className="font-bold text-slate-800 block">{cita.clienteNombre}</span>
                              ) : (
                                <span className="text-slate-400 font-medium italic block">Sin nombre</span>
                              )}
                              <span className="text-[10px] text-slate-500 font-mono">{cita.clienteCelular}</span>
                              {alertActive && (
                                <span className="inline-flex w-max items-center gap-1 px-1.5 py-0.5 bg-amber-200 text-amber-900 text-[9px] font-black rounded border border-amber-300 animate-bounce mt-1 shadow-sm">
                                  <Phone className="w-2.5 h-2.5 text-amber-700" />
                                  ¡VOLVER A LLAMAR HOY!
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Address / Type */}
                          <td className="py-3.5 px-4 max-w-xs">
                            {cita.direccionPropiedad ? (
                              <span className="font-medium text-slate-800 block truncate" title={cita.direccionPropiedad}>
                                {cita.direccionPropiedad}
                              </span>
                            ) : (
                              <span className="text-slate-400 text-xs italic block truncate">Sin dirección</span>
                            )}
                            <div className="flex flex-wrap gap-1 mt-1 items-center">
                              {cita.distritoPropiedad && (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-emerald-50 text-emerald-700 text-[9px] font-bold rounded border border-emerald-100">
                                  <MapPin className="w-2.5 h-2.5 text-emerald-500 shrink-0" />
                                  {cita.distritoPropiedad}
                                </span>
                              )}
                              <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">
                                {cita.tipoPropiedad} • {cita.tipoOperacion}
                              </span>
                            </div>
                          </td>

                          {/* Cita Status */}
                          <td className="py-3.5 px-4">
                            <span className={`inline-flex px-2 py-0.5 rounded text-[10px] uppercase tracking-wide font-bold ${getCitaBadge(cita.estadoCita)}`}>
                              {cita.estadoCita === EstadoCita.PROSPECTO ? 'Prospecto' : cita.estadoCita === EstadoCita.REPROGRAMAR ? 'Reprogramar' : cita.estadoCita === EstadoCita.REALIZADA ? 'Exitosa' : cita.estadoCita === EstadoCita.AGENDADA ? 'Agendada' : 'Cancelada'}
                            </span>
                          </td>

                          {/* Cierre / Bono Status */}
                          <td className="py-3.5 px-4">
                            <div className="space-y-1">
                              <span className={`inline-flex px-2 py-0.5 rounded text-[10px] uppercase tracking-wide ${getCierreBadge(cita.estadoCierre)}`}>
                                {cita.estadoCierre === EstadoCierre.PENDIENTE ? 'Pendiente' : cita.estadoCierre === EstadoCierre.CERRADO ? 'Cerrado' : cita.estadoCierre === EstadoCierre.LIQUIDADO ? 'Liquidado' : cita.estadoCierre}
                              </span>
                              <div className="text-xs font-mono font-bold text-primary block">
                                {formatPEN(cita.montoBono)}
                              </div>
                            </div>
                          </td>

                          {/* Actions */}
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleEdit(cita)}
                                className="p-1 px-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-primary rounded-md transition-colors cursor-pointer"
                                title="Editar cita"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              
                              {userRole === 'admin' && (
                                deleteConfirmId === cita.id ? (
                                  <div className="flex items-center gap-1">
                                    <button
                                      onClick={() => handleDelete(cita.id)}
                                      className="p-1 text-[10px] font-bold bg-brand-red text-white rounded cursor-pointer"
                                      title="Confirmar eliminación"
                                    >
                                      Eliminar
                                    </button>
                                    <button
                                      onClick={() => setDeleteConfirmId(null)}
                                      className="p-1 text-[10px] font-bold bg-slate-200 text-slate-700 rounded cursor-pointer"
                                    >
                                      No
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => setDeleteConfirmId(cita.id)}
                                    className="p-1 px-1.5 bg-slate-50 hover:bg-red-50 border border-slate-200 hover:border-brand-red/25 text-slate-400 hover:text-brand-red rounded-md transition-colors cursor-pointer"
                                    title="Eliminar cita"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
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
          <div className="p-4 bg-slate-100 border border-slate-200 rounded-md flex gap-3 text-xs text-slate-600">
            <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-slate-800">Estrategia de Captación - Oscar Russo:</p>
              <p className="mt-0.5">
                Para maximizar el éxito comercial y potenciar las ganancias, fomenta que la asistente se enfoque en la gestión rápida y agendamiento impecable de citas. Al alimentar de forma constante este embudo de citas calificadas, aumentará directamente el volumen de cierres de venta o alquiler y, con ello, sus bonos variables correspondientes.
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
