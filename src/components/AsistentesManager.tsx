/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  Search, 
  Edit, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  CreditCard, 
  Briefcase, 
  Mail, 
  Phone, 
  Calendar,
  DollarSign,
  AlertCircle,
  Clock,
  Info
} from 'lucide-react';
import { Asistente, ConfigGeneral, Cita } from '../types';
import { formatPEN } from '../utils/currency';
import { formatToDDMMYYYY } from '../utils/date';
import { capitalizeWords } from '../utils/string';

interface AsistentesManagerProps {
  asistentes: Asistente[];
  citas: Cita[];
  config: ConfigGeneral;
  onSaveAsistente: (asistente: Asistente) => void;
  onDeleteAsistente: (id: string) => void;
  isSyncing: boolean;
  userRole?: 'admin' | 'asistente' | null;
}

export default function AsistentesManager({
  asistentes,
  citas,
  config,
  onSaveAsistente,
  onDeleteAsistente,
  isSyncing,
  userRole = 'admin'
}: AsistentesManagerProps) {
  // Form states
  const [editingId, setEditingId] = useState<string | null>(null);
  const [nombreCompleto, setNombreCompleto] = useState('');
  const [dni, setDni] = useState('');
  const [celular, setCelular] = useState('');
  const [correo, setCorreo] = useState('');
  const [banco, setBanco] = useState('BCP');
  const [tipoCuenta, setTipoCuenta] = useState('Ahorros');
  const [numeroCuenta, setNumeroCuenta] = useState('');
  const [cci, setCci] = useState('');
  const [fechaIngreso, setFechaIngreso] = useState('');
  const [cargo, setCargo] = useState('Asistente Inmobiliario');
  const [sueldoBasico, setSueldoBasico] = useState<number>(config.rmvVigente);
  const [activo, setActivo] = useState(true);

  // Sync sueldoBasico state with config.rmvVigente when it loads/changes if we are not editing
  useEffect(() => {
    if (!editingId) {
      setSueldoBasico(config.rmvVigente);
    }
  }, [config.rmvVigente, editingId]);

  // Search filter
  const [searchTerm, setSearchTerm] = useState('');
  
  // Feedback states
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // States for monthly calls form
  const [selectedAsistenteId, setSelectedAsistenteId] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    return `${d.getFullYear()}-${mm}`;
  });
  const [cantidadLlamadas, setCantidadLlamadas] = useState<number | ''>('');

  const handleEdit = (as: Asistente) => {
    setEditingId(as.id);
    setNombreCompleto(as.nombreCompleto);
    setDni(as.dni);
    setCelular(as.celular);
    setCorreo(as.correo);
    setBanco(as.banco);
    setTipoCuenta(as.tipoCuenta);
    setNumeroCuenta(as.numeroCuenta);
    setCci(as.cci);
    setFechaIngreso(as.fechaIngreso);
    setCargo(as.cargo);
    setSueldoBasico(as.sueldoBasico);
    setActivo(as.activo);
    setErrorMsg('');
    setSuccessMsg('');
    // Scroll form to view
    const formElement = document.getElementById('asistente_form_container');
    if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setNombreCompleto('');
    setDni('');
    setCelular('');
    setCorreo('');
    setBanco('BCP');
    setTipoCuenta('Ahorros');
    setNumeroCuenta('');
    setCci('');
    setFechaIngreso('');
    setCargo('Asistente Inmobiliario');
    setSueldoBasico(config.rmvVigente);
    setActivo(true);
    setErrorMsg('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!nombreCompleto.trim()) {
      setErrorMsg('Por favor, ingresa el nombre completo del colaborador.');
      return;
    }
    if (!dni.trim() || dni.length < 8) {
      setErrorMsg('Por favor, ingresa un DNI válido de 8 dígitos.');
      return;
    }
    if (!celular.trim()) {
      setErrorMsg('Por favor, ingresa el celular del colaborador.');
      return;
    }
    if (!numeroCuenta.trim()) {
      setErrorMsg('Por favor, ingresa el número de cuenta bancaria.');
      return;
    }

    const existingAs = editingId ? asistentes.find(as => as.id === editingId) : null;
    const compiledAsistente: Asistente = {
      id: editingId || Math.random().toString(36).substring(2, 11),
      nombreCompleto: nombreCompleto.trim(),
      dni: dni.trim(),
      celular: celular.trim(),
      correo: correo.trim(),
      banco,
      tipoCuenta,
      numeroCuenta: numeroCuenta.trim(),
      cci: cci.trim(),
      fechaIngreso: fechaIngreso || new Date().toISOString().split('T')[0],
      cargo,
      sueldoBasico: Number(sueldoBasico),
      activo,
      llamadasMensuales: existingAs?.llamadasMensuales || {}
    };

    onSaveAsistente(compiledAsistente);
    setSuccessMsg(editingId ? 'Datos del colaborador actualizados.' : 'Nuevo colaborador registrado con éxito.');
    resetForm();

    setTimeout(() => {
      setSuccessMsg('');
    }, 4000);
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

    onSaveAsistente(updatedAsistente);
    setSuccessMsg(`Llamadas mensuales registradas con éxito para ${targetAsistente.nombreCompleto} (${selectedMonth}): ${cantidadLlamadas} llamadas.`);
    setCantidadLlamadas('');
    
    // Auto scroll to the table list or alerts if they want to verify
    setTimeout(() => {
      setSuccessMsg('');
    }, 5000);
  };

  const handleDelete = (id: string) => {
    onDeleteAsistente(id);
    setDeleteConfirmId(null);
    setSuccessMsg('Colaborador eliminado correctamente.');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  // Filter assistants based on search
  const filteredAsistentes = asistentes.filter(as => 
    as.nombreCompleto.toLowerCase().includes(searchTerm.toLowerCase()) ||
    as.dni.includes(searchTerm) ||
    as.cargo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    as.banco.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6" id="asistentes_manager_root">
      
      {/* Alert panels */}
      {errorMsg && (
        <div className="p-4 bg-red-50 border border-brand-red/20 rounded-md flex items-start gap-2 text-brand-red animate-fade-in" id="error_alert_hr">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <div className="text-xs font-semibold">{errorMsg}</div>
        </div>
      )}
      
      {successMsg && (
        <div className="p-4 bg-blue-50 border border-primary/20 rounded-md flex items-start gap-2 text-primary animate-fade-in" id="success_alert_hr">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-primary" />
          <div className="text-xs font-semibold">{successMsg}</div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left column: Add/Edit Form & Monthly Calls Input */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Add/Edit Form */}
          {userRole === 'admin' && (
            <div className="bg-white rounded-md border border-slate-200 shadow-sm overflow-hidden h-fit" id="asistente_form_container">
              <div className="p-4 bg-navy border-b border-navy/20 flex justify-between items-center text-white">
                <h3 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-blue-400" />
                  {editingId ? 'Editar Datos del Colaborador' : 'Registrar Colaborador (RRHH)'}
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
                
                {/* Full Name */}
                <div>
                  <label htmlFor="input_nombre" className="block text-[10px] uppercase font-bold text-slate-700 tracking-wider mb-1.5">
                    Nombre Completo *
                  </label>
                  <input
                    type="text"
                    id="input_nombre"
                    placeholder="Ej. María Fernanda Morales"
                    value={nombreCompleto}
                    onChange={(e) => setNombreCompleto(capitalizeWords(e.target.value))}
                    className="block w-full py-2 px-3 text-sm bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-slate-900 font-medium"
                  />
                </div>

                {/* DNI & Phone */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="input_dni" className="block text-[10px] uppercase font-bold text-slate-700 tracking-wider mb-1.5">
                      DNI (8 dígitos) *
                    </label>
                    <input
                      type="text"
                      id="input_dni"
                      maxLength={8}
                      placeholder="45678912"
                      value={dni}
                      onChange={(e) => setDni(e.target.value.replace(/\D/g, ''))}
                      className="block w-full py-2 px-3 text-sm bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-slate-900 font-mono"
                    />
                  </div>
                  <div>
                    <label htmlFor="input_celular" className="block text-[10px] uppercase font-bold text-slate-700 tracking-wider mb-1.5">
                      Celular *
                    </label>
                    <input
                      type="tel"
                      id="input_celular"
                      placeholder="987654321"
                      value={celular}
                      onChange={(e) => setCelular(e.target.value)}
                      className="block w-full py-2 px-3 text-sm bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-slate-900 font-mono"
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="input_correo" className="block text-[10px] uppercase font-bold text-slate-700 tracking-wider mb-1.5">
                    Correo Electrónico
                  </label>
                  <input
                    type="email"
                    id="input_correo"
                    placeholder="asistente@remaxpower.pe"
                    value={correo}
                    onChange={(e) => setCorreo(e.target.value)}
                    className="block w-full py-2 px-3 text-sm bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-slate-900"
                  />
                </div>

                {/* Cargo / Rol */}
                <div>
                  <label htmlFor="input_cargo" className="block text-[10px] uppercase font-bold text-slate-700 tracking-wider mb-1.5">
                    Cargo / Rol
                  </label>
                  <input
                    type="text"
                    id="input_cargo"
                    placeholder="Ej. Asistente de Captaciones"
                    value={cargo}
                    onChange={(e) => setCargo(capitalizeWords(e.target.value))}
                    className="block w-full py-2 px-3 text-sm bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-slate-900"
                  />
                </div>

                {/* Sueldo Fijo Mensual & Fecha Ingreso */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="input_sueldo" className="block text-[10px] uppercase font-bold text-slate-700 tracking-wider mb-1.5">
                      Sueldo Fijo (RMV) S/.
                    </label>
                    <input
                      type="number"
                      id="input_sueldo"
                      min={0}
                      step="any"
                      value={sueldoBasico || ''}
                      onChange={(e) => setSueldoBasico(e.target.value === '' ? 0 : Number(e.target.value))}
                      className="block w-full py-2 px-3 text-sm bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-slate-900 font-mono font-bold text-primary"
                    />
                    <p className="text-[9px] text-slate-400 mt-0.5">RMV vigente configurado: {formatPEN(config.rmvVigente)}.</p>
                  </div>

                  <div>
                    <label htmlFor="input_fecha_ingreso" className="block text-[10px] uppercase font-bold text-slate-700 tracking-wider mb-1.5">
                      Fecha de Ingreso
                    </label>
                    <input
                      type="date"
                      id="input_fecha_ingreso"
                      value={fechaIngreso}
                      onChange={(e) => setFechaIngreso(e.target.value)}
                      className="block w-full py-2 px-3 text-sm bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-slate-900"
                    />
                  </div>
                </div>

                {/* Bank Details */}
                <div className="bg-slate-50 p-3 rounded-md border border-slate-200 space-y-3">
                  <div className="text-[10px] font-bold uppercase text-slate-600 tracking-wider flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-primary" />
                    Información Bancaria para Pago
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label htmlFor="select_banco" className="block text-[9px] uppercase font-bold text-slate-600 tracking-wider mb-1">
                        Banco
                      </label>
                      <select
                        id="select_banco"
                        value={banco}
                        onChange={(e) => setBanco(e.target.value)}
                        className="block w-full py-1.5 px-2 text-xs bg-white border border-slate-200 rounded-md focus:outline-none text-slate-900"
                      >
                        <option value="BCP">BCP</option>
                        <option value="Interbank">Interbank</option>
                        <option value="BBVA">BBVA</option>
                        <option value="Scotiabank">Scotiabank</option>
                        <option value="Banco de la Nación">Banco de la Nación</option>
                        <option value="Otro">Otro</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="input_tipo_cuenta" className="block text-[9px] uppercase font-bold text-slate-600 tracking-wider mb-1">
                        Tipo Cuenta
                      </label>
                      <input
                        type="text"
                        id="input_tipo_cuenta"
                        placeholder="Sueldo, Ahorros..."
                        value={tipoCuenta}
                        onChange={(e) => setTipoCuenta(capitalizeWords(e.target.value))}
                        className="block w-full py-1.5 px-2 text-xs bg-white border border-slate-200 rounded-md focus:outline-none text-slate-900"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="input_cuenta" className="block text-[9px] uppercase font-bold text-slate-600 tracking-wider mb-1">
                      Número de Cuenta *
                    </label>
                    <input
                      type="text"
                      id="input_cuenta"
                      placeholder="191-xxxxxx-x-xx"
                      value={numeroCuenta}
                      onChange={(e) => setNumeroCuenta(e.target.value)}
                      className="block w-full py-1.5 px-2 text-xs bg-white border border-slate-200 rounded-md focus:outline-none text-slate-900 font-mono"
                    />
                  </div>

                  <div>
                    <label htmlFor="input_cci" className="block text-[9px] uppercase font-bold text-slate-600 tracking-wider mb-1">
                      CCI (Interbancario)
                    </label>
                    <input
                      type="text"
                      id="input_cci"
                      placeholder="002-xxxxxxxxxxxxxx"
                      value={cci}
                      onChange={(e) => setCci(e.target.value)}
                      className="block w-full py-1.5 px-2 text-xs bg-white border border-slate-200 rounded-md focus:outline-none text-slate-900 font-mono"
                    />
                  </div>
                </div>

                {/* Active Switch */}
                <div className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-md">
                  <span className="text-xs font-semibold text-slate-700">Estado laboral</span>
                  <button
                    type="button"
                    onClick={() => setActivo(!activo)}
                    className={`px-3 py-1 text-[10px] font-bold uppercase rounded cursor-pointer transition-all ${
                      activo 
                        ? 'bg-emerald-500 text-white' 
                        : 'bg-slate-300 text-slate-600'
                    }`}
                  >
                    {activo ? 'Activo' : 'Inactivo'}
                  </button>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/95 text-white py-2.5 px-4 rounded-md font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer shadow-sm"
                  id="submit_asistente_btn"
                >
                  <Users className="w-4 h-4" />
                  {editingId ? 'Guardar Cambios' : 'Registrar Colaborador'}
                </button>

              </form>
            </div>
          )}

        </div>

      {/* Right column: Interactive Table List */}
        <div className="lg:col-span-2 space-y-4">
          
          {/* Quick Search */}
          <div className="bg-white p-4 rounded-md border border-slate-200 shadow-sm" id="search_panel_hr">
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                placeholder="Buscar colaborador por nombre, DNI, cargo o banco..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-3 py-2 w-full text-xs bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary placeholder-slate-400 text-slate-800 font-medium"
              />
            </div>
            
            <div className="flex items-center justify-between mt-3 text-[11px] text-slate-500 font-semibold font-mono">
              <span>Colaboradores registrados: <strong className="text-primary">{asistentes.length}</strong></span>
              <span>•</span>
              <span>Activos: <strong className="text-emerald-600">{asistentes.filter(a => a.activo).length}</strong></span>
            </div>
          </div>

          {/* Table list */}
          <div className="bg-white rounded-md border border-slate-200 shadow-sm overflow-hidden" id="asistentes_table_wrapper">
            {filteredAsistentes.length === 0 ? (
              <div className="p-10 text-center space-y-2">
                <Info className="w-8 h-8 text-slate-300 mx-auto" />
                <h4 className="text-sm font-bold text-slate-700">No se encontraron colaboradores</h4>
                <p className="text-xs text-slate-500">
                  {searchTerm ? 'Prueba refinando tu criterio de búsqueda.' : 'Aún no se han registrado colaboradores en este panel de RRHH.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-navy border-b border-navy/20 text-white text-[10px] font-bold uppercase tracking-wider">
                      <th className="py-3 px-4">Colaborador</th>
                      <th className="py-3 px-4">Contacto</th>
                      {userRole === 'admin' && <th className="py-3 px-4">Banco y Cuenta</th>}
                      {userRole === 'admin' && <th className="py-3 px-4">Sueldo Base</th>}
                      <th className="py-3 px-4">Estado</th>
                      {userRole === 'admin' && <th className="py-3 px-4 text-right">Acciones</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                    {filteredAsistentes.map((as) => (
                      <tr key={as.id} className="hover:bg-slate-50 transition-colors" id={`colab_row_${as.id}`}>
                        {/* Name and DNI */}
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900 block">{as.nombreCompleto}</div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {userRole === 'admin' && `DNI: ${as.dni} • `}Cargo: {as.cargo}
                          </div>
                          {(() => {
                            const assistantCitas = citas.filter(c => c.asistenteId === as.id && !!c.fechaLlamada);
                            const callsByMonth: { [month: string]: number } = {};
                            assistantCitas.forEach(c => {
                              if (c.fechaLlamada) {
                                const m = c.fechaLlamada.substring(0, 7); // YYYY-MM
                                callsByMonth[m] = (callsByMonth[m] || 0) + 1;
                              }
                            });
                            const entries = Object.entries(callsByMonth);
                            if (entries.length === 0) return null;
                            return (
                              <div className="mt-1 flex flex-wrap gap-1">
                                {entries
                                  .sort((a, b) => b[0].localeCompare(a[0])) // latest months first
                                  .slice(0, 3) // show last 3 months
                                  .map(([mes, count]) => (
                                    <span key={mes} className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-slate-100 text-slate-600 text-[9px] font-mono font-bold rounded border border-slate-200" title={`Llamadas en ${formatToDDMMYYYY(mes)}`}>
                                      <Phone className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                                      {formatToDDMMYYYY(mes)}: {count} llam.
                                    </span>
                                  ))}
                              </div>
                            );
                          })()}
                        </td>

                        {/* Contact details */}
                        <td className="py-3.5 px-4 font-mono">
                          <div className="flex items-center gap-1 text-slate-800">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{as.celular}</span>
                          </div>
                          {as.correo && (
                            <div className="flex items-center gap-1 text-[10px] text-slate-500">
                              <Mail className="w-3 h-3 text-slate-400" />
                              <span className="truncate max-w-[130px]">{as.correo}</span>
                            </div>
                          )}
                        </td>

                        {/* Bank particulars */}
                        {userRole === 'admin' && (
                          <td className="py-3.5 px-4 font-mono text-[11px]">
                            <div className="font-bold text-slate-800">{as.banco} ({as.tipoCuenta})</div>
                            <div className="text-[10px] text-slate-500">N° {as.numeroCuenta}</div>
                            {as.cci && <div className="text-[9px] text-slate-400">CCI: {as.cci}</div>}
                          </td>
                        )}

                        {/* Basic Fixed Payout */}
                        {userRole === 'admin' && (
                          <td className="py-3.5 px-4 font-mono font-bold text-primary">
                            {formatPEN(as.sueldoBasico)}
                          </td>
                        )}

                        {/* Active status indicator badge */}
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${
                            as.activo 
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                              : 'bg-slate-100 text-slate-500 border border-slate-200'
                          }`}>
                            {as.activo ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>

                        {/* Action columns */}
                        {userRole === 'admin' && (
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleEdit(as)}
                                className="p-1 px-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-primary rounded-md transition-colors cursor-pointer"
                                title="Editar colaborador"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              
                              {deleteConfirmId === as.id ? (
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => handleDelete(as.id)}
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
                                    onClick={() => setDeleteConfirmId(as.id)}
                                    className="p-1 px-1.5 bg-slate-50 hover:bg-red-50 border border-slate-200 hover:border-brand-red/25 text-slate-400 hover:text-brand-red rounded-md transition-colors cursor-pointer"
                                    title="Eliminar colaborador"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Guidelines info card */}
          <div className="p-4 bg-slate-100 border border-slate-200 rounded-md flex gap-3 text-xs text-slate-600">
            <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-slate-800">Compensación Híbrida del Personal de Captación:</p>
              <p className="mt-0.5">
                La legislación y políticas vigentes de Oscar Russo dictan que la asistente goza de un <strong>Sueldo Fijo Mensual equivalente a la Remuneración Mínima Vital (RMV)</strong> permanente de {formatPEN(config.rmvVigente)}, complementada directamente por bonos variables devengados tras los cierres efectivos de alquileres o ventas logrados a partir de sus citas agendadas.
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
