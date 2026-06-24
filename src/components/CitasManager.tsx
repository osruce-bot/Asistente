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
  const [estadoCita, setEstadoCita] = useState<EstadoCita>(EstadoCita.AGENDADA);
  const [estadoCierre, setEstadoCierre] = useState<EstadoCierre>(EstadoCierre.PENDIENTE);
  const [fechaCierre, setFechaCierre] = useState('');
  const [montoBono, setMontoBono] = useState<number>(config.bonoVentaPredeterminado);
  const [notas, setNotas] = useState('');

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
    setEstadoCita(EstadoCita.AGENDADA);
    setEstadoCierre(EstadoCierre.PENDIENTE);
    setFechaCierre('');
    setMontoBono(config.bonoVentaPredeterminado);
    setNotas('');
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
    if (!fechaCita) {
      setErrorMsg('Por favor seleccione la fecha de la cita.');
      return;
    }
    if (!clienteNombre.trim()) {
      setErrorMsg('Por favor ingrese el nombre del cliente.');
      return;
    }
    if (!clienteCelular.trim()) {
      setErrorMsg('Por favor ingrese el celular de contacto del cliente.');
      return;
    }
    if (!direccionPropiedad.trim()) {
      setErrorMsg('Por favor ingrese la dirección o descripción del inmueble.');
      return;
    }

    const selectedAsistente = asistentes.find(as => as.id === asistenteId);
    if (!selectedAsistente) {
      setErrorMsg('El asistente seleccionado no es válido.');
      return;
    }

    const finalEstadoCita = userRole === 'admin' 
      ? estadoCita 
      : (editingId ? (citas.find(c => c.id === editingId)?.estadoCita || EstadoCita.AGENDADA) : EstadoCita.AGENDADA);

    const compiledCita: Cita = {
      id: editingId || Math.random().toString(36).substring(2, 11),
      asistenteId,
      asistenteNombre: selectedAsistente.nombreCompleto,
      fechaCita,
      horaCita,
      clienteNombre: clienteNombre.trim(),
      clienteCelular: clienteCelular.trim(),
      direccionPropiedad: direccionPropiedad.trim(),
      tipoPropiedad,
      tipoOperacion,
      estadoCita: finalEstadoCita,
      estadoCierre: userRole === 'admin' ? estadoCierre : EstadoCierre.PENDIENTE,
      fechaCierre: (estadoCierre === EstadoCierre.CERRADO || estadoCierre === EstadoCierre.LIQUIDADO) ? (fechaCierre || new Date().toISOString().split('T')[0]) : '',
      montoBono: Number(montoBono),
      notas: notas.trim()
    };

    onSaveCita(compiledCita);
    setSuccessMsg(editingId ? 'Cita actualizada correctamente.' : 'Nueva cita registrada con éxito.');
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
              {editingId ? 'Editar Cita Lograda' : 'Registrar Nueva Cita'}
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
            {/* Assistant dropdown */}
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

            {/* Date & Time fields */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="input_fecha_cita" className="block text-[10px] uppercase font-bold text-slate-700 tracking-wider mb-1.5">
                  Fecha de Cita *
                </label>
                <input
                  type="date"
                  id="input_fecha_cita"
                  value={fechaCita}
                  onChange={(e) => setFechaCita(e.target.value)}
                  className="block w-full py-2 px-3 text-sm bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-slate-900"
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
                  className="block w-full py-2 px-3 text-sm bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-slate-900"
                />
              </div>
            </div>

            {/* Client Details */}
            <div className="grid grid-cols-1 gap-3">
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
                    onChange={(e) => setClienteNombre(e.target.value)}
                    className="block w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-slate-900 font-medium"
                  />
                </div>
              </div>

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
                    className="block w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-slate-900 font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Property Address */}
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
                  placeholder="Av. Manuel Olguín 325, Surco"
                  value={direccionPropiedad}
                  onChange={(e) => setDireccionPropiedad(e.target.value)}
                  className="block w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-slate-900"
                />
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
                  className="block w-full py-2 px-3 text-sm bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-slate-900"
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
                    onClick={() => handleOperationTypeChange(TipoOperacionCita.VENTA)}
                    className={`flex-1 py-1 text-xs font-bold rounded cursor-pointer transition-all ${
                      tipoOperacion === TipoOperacionCita.VENTA 
                        ? 'bg-primary text-white shadow-sm' 
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Venta
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOperationTypeChange(TipoOperacionCita.ALQUILER)}
                    className={`flex-1 py-1 text-xs font-bold rounded cursor-pointer transition-all ${
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
                  value={userRole === 'admin' ? estadoCita : (editingId ? (citas.find(c => c.id === editingId)?.estadoCita || EstadoCita.AGENDADA) : EstadoCita.AGENDADA)}
                  onChange={(e) => setEstadoCita(e.target.value as EstadoCita)}
                  disabled={userRole !== 'admin'}
                  className="block w-full py-2 px-3 text-sm bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-slate-900 disabled:opacity-75 disabled:cursor-not-allowed"
                >
                  <option value={EstadoCita.AGENDADA}>Agendada</option>
                  <option value={EstadoCita.REALIZADA}>Exitosa</option>
                  <option value={EstadoCita.CANCELADA}>Cancelada</option>
                </select>
                {userRole !== 'admin' && (
                  <p className="text-[8px] text-slate-400 mt-0.5">Control de Estado exclusivo para Administradores.</p>
                )}
              </div>

              <div>
                <label htmlFor="select_estado_cierre" className="block text-[10px] uppercase font-bold text-slate-700 tracking-wider mb-1.5">
                  Estado del Cierre
                </label>
                <select
                  id="select_estado_cierre"
                  value={estadoCierre}
                  onChange={(e) => setEstadoCierre(e.target.value as EstadoCierre)}
                  disabled={userRole !== 'admin'}
                  className="block w-full py-2 px-3 text-sm bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-slate-900 disabled:opacity-75 disabled:cursor-not-allowed"
                >
                  <option value={EstadoCierre.PENDIENTE}>Pendiente - la captación se logró pero el cierre aún</option>
                  <option value={EstadoCierre.CERRADO}>Cerrado - se logró el cierre</option>
                  <option value={EstadoCierre.LIQUIDADO}>Liquidado - pagado</option>
                </select>
                {userRole !== 'admin' && (
                  <p className="text-[8px] text-slate-400 mt-0.5">Control de Cierre exclusivo para Administradores.</p>
                )}
              </div>
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
                    disabled={userRole !== 'admin'}
                    className="block w-full pl-8 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-slate-900 font-mono font-bold disabled:opacity-75 disabled:cursor-not-allowed"
                  />
                </div>
                <p className="text-[9px] text-slate-400 mt-0.5">
                  {userRole === 'admin' ? 'Editable. Refleja el bono si se concreta el cierre.' : 'Monto de bono preestablecido.'}
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
                    disabled={userRole !== 'admin'}
                    className="block w-full py-2 px-3 text-sm bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-slate-900 disabled:opacity-75 disabled:cursor-not-allowed"
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
                className="block w-full py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-slate-900"
              />
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/95 text-white py-2.5 px-4 rounded-md font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer shadow-sm"
              id="submit_cita_btn"
            >
              <PlusCircle className="w-4 h-4" />
              {editingId ? 'Guardar Cambios' : 'Registrar Cita'}
            </button>
          </form>
        </div>

        {/* New Card: Registro de Llamadas Mensuales */}
        {userRole === 'admin' && onSaveAsistente && (
          <div className="bg-white rounded-md border border-slate-200 shadow-sm overflow-hidden animate-fade-in" id="asistente_llamadas_container">
            <div className="p-4 bg-navy border-b border-navy/20 text-white">
              <h3 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                <Phone className="w-4 h-4 text-blue-400" />
                Ingreso de Llamadas Realizadas
              </h3>
            </div>
            
            <form onSubmit={handleSaveLlamadas} className="p-4 space-y-4">
              <div>
                <label htmlFor="select_asistente_llamadas" className="block text-[10px] uppercase font-bold text-slate-700 tracking-wider mb-1.5">
                  Seleccionar Asistente *
                </label>
                <select
                  id="select_asistente_llamadas"
                  value={selectedAsistenteId}
                  onChange={(e) => setSelectedAsistenteId(e.target.value)}
                  className="block w-full py-2 px-3 text-sm bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-slate-900"
                >
                  <option value="">-- Selecciona una Asistente --</option>
                  {asistentes.filter(as => as.activo).map((as) => (
                    <option key={as.id} value={as.id}>
                      {as.nombreCompleto} ({as.cargo})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="input_mes_llamadas" className="block text-[10px] uppercase font-bold text-slate-700 tracking-wider mb-1.5">
                    Mes de Gestión *
                  </label>
                  <input
                    type="month"
                    id="input_mes_llamadas"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="block w-full py-2 px-3 text-sm bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-slate-900 font-bold"
                  />
                </div>

                <div>
                  <label htmlFor="input_cantidad_llamadas" className="block text-[10px] uppercase font-bold text-slate-700 tracking-wider mb-1.5">
                    Total de Llamadas *
                  </label>
                  <input
                    type="number"
                    id="input_cantidad_llamadas"
                    placeholder="Ej: 150"
                    min={0}
                    value={cantidadLlamadas}
                    onChange={(e) => setCantidadLlamadas(e.target.value === '' ? '' : Number(e.target.value))}
                    className="block w-full py-2 px-3 text-sm bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-slate-900 font-mono font-bold"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 px-4 rounded-md font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer shadow-sm"
                id="submit_llamadas_btn"
              >
                <Phone className="w-4 h-4" />
                Guardar Registro de Llamadas
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Right Section: Interactive List & Filtering */}
      <div className="lg:col-span-2 space-y-4">
          
          {/* Filter Bar Panel */}
          <div className="bg-white p-4 rounded-md border border-slate-200 shadow-sm" id="filters_panel">
            <h4 className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-3 flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              Búsqueda y Filtros de Citas
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
                      <th className="py-3 px-4">Fecha y Hora</th>
                      <th className="py-3 px-4">Cliente / Contacto</th>
                      <th className="py-3 px-4">Dirección / Inmueble</th>
                      <th className="py-3 px-4">Estado Cita</th>
                      <th className="py-3 px-4">Bono / Cierre</th>
                      <th className="py-3 px-4 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                    {filteredCitas.map((cita) => {
                      // Status colors helper
                      const getCitaBadge = (status: EstadoCita) => {
                        switch (status) {
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

                      return (
                        <tr key={cita.id} className="hover:bg-slate-50 transition-colors" id={`cita_row_${cita.id}`}>
                          {/* Assistant */}
                          <td className="py-3.5 px-4">
                            <span className="font-bold text-slate-900 block">{cita.asistenteNombre}</span>
                            <span className="text-[10px] text-slate-400 font-mono">ID: {cita.id}</span>
                          </td>

                          {/* Date and hour */}
                          <td className="py-3.5 px-4 font-mono">
                            <div className="font-bold text-slate-800">{cita.fechaCita}</div>
                            <div className="text-[10px] text-slate-500">{cita.horaCita || '--:--'}</div>
                          </td>

                          {/* Client */}
                          <td className="py-3.5 px-4 font-sans">
                            <span className="font-bold text-slate-800 block">{cita.clienteNombre}</span>
                            <span className="text-[10px] text-slate-500 font-mono">{cita.clienteCelular}</span>
                          </td>

                          {/* Address / Type */}
                          <td className="py-3.5 px-4 max-w-xs truncate">
                            <span className="font-medium text-slate-800 block truncate" title={cita.direccionPropiedad}>
                              {cita.direccionPropiedad}
                            </span>
                            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">
                              {cita.tipoPropiedad} • {cita.tipoOperacion}
                            </span>
                          </td>

                          {/* Cita Status */}
                          <td className="py-3.5 px-4">
                            <span className={`inline-flex px-2 py-0.5 rounded text-[10px] uppercase tracking-wide font-bold ${getCitaBadge(cita.estadoCita)}`}>
                              {cita.estadoCita === EstadoCita.REALIZADA ? 'Exitosa' : cita.estadoCita === EstadoCita.AGENDADA ? 'Agendada' : 'Cancelada'}
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
