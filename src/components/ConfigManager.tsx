/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Coins, 
  TrendingUp, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Info,
  Sliders,
  DollarSign,
  Lock,
  KeyRound,
  Trash2,
  Plus,
  Users,
  ShieldAlert
} from 'lucide-react';
import { ConfigGeneral, AccesoUsuario } from '../types';
import { formatPEN } from '../utils/currency';
import { capitalizeWords } from '../utils/string';

interface ConfigManagerProps {
  config: ConfigGeneral;
  onSaveConfig: (newConfig: ConfigGeneral) => void;
  isSyncing: boolean;
}

export default function ConfigManager({
  config,
  onSaveConfig,
  isSyncing
}: ConfigManagerProps) {
  const [rmvVigente, setRmvVigente] = useState(config.rmvVigente);
  const [bonoVenta, setBonoVenta] = useState(config.bonoVentaPredeterminado);
  const [bonoAlquiler, setBonoAlquiler] = useState(config.bonoAlquilerPredeterminado);
  const [claveAdmin, setClaveAdmin] = useState(config.claveAdmin || 'admin123');
  const [claveAsistente, setClaveAsistente] = useState(config.claveAsistente || 'asistente123');
  const [successMsg, setSuccessMsg] = useState('');

  // Allowed Accesses Profiles list
  const [accesos, setAccesos] = useState<AccesoUsuario[]>(() => {
    return config.accesosPermitidos || [
      { id: 'acc-1', nombre: 'Oscar Russo', usuario: 'oscar', rol: 'admin', clave: 'admin123' },
      { id: 'acc-2', nombre: 'Asistente Principal', usuario: 'asistente', rol: 'asistente', clave: 'asistente123' }
    ];
  });

  // State for adding new access
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevoUsuario, setNuevoUsuario] = useState('');
  const [nuevoRol, setNuevoRol] = useState<'admin' | 'asistente'>('asistente');
  const [nuevaClave, setNuevaClave] = useState('');
  const [errorAcceso, setErrorAcceso] = useState('');

  // Keep local state in sync when cloud config loads
  useEffect(() => {
    setRmvVigente(config.rmvVigente);
    setBonoVenta(config.bonoVentaPredeterminado);
    setBonoAlquiler(config.bonoAlquilerPredeterminado);
    setClaveAdmin(config.claveAdmin || 'admin123');
    setClaveAsistente(config.claveAsistente || 'asistente123');
    if (config.accesosPermitidos) {
      setAccesos(config.accesosPermitidos);
    }
  }, [config]);

  const handleAddAcceso = () => {
    setErrorAcceso('');
    if (!nuevoNombre.trim() || !nuevoUsuario.trim() || !nuevaClave.trim()) {
      setErrorAcceso('Por favor complete todos los campos para registrar el acceso.');
      return;
    }

    const usuarioLower = nuevoUsuario.trim().toLowerCase();

    // Check if username already exists
    if (accesos.some(acc => acc.usuario.toLowerCase() === usuarioLower)) {
      setErrorAcceso('El nombre de usuario ya existe en el sistema.');
      return;
    }

    const nuevoAcceso: AccesoUsuario = {
      id: 'acc-' + Date.now(),
      nombre: nuevoNombre.trim(),
      usuario: usuarioLower,
      rol: nuevoRol,
      clave: nuevaClave.trim()
    };

    setAccesos([...accesos, nuevoAcceso]);
    
    // Clear inputs
    setNuevoNombre('');
    setNuevoUsuario('');
    setNuevoRol('asistente');
    setNuevaClave('');
  };

  const handleDeleteAcceso = (id: string) => {
    const target = accesos.find(a => a.id === id);
    if (!target) return;

    if (target.usuario === 'oscar') {
      setErrorAcceso('Por medidas de seguridad, el usuario principal "oscar" no se puede eliminar.');
      return;
    }

    const adminsCount = accesos.filter(a => a.rol === 'admin').length;
    if (target.rol === 'admin' && adminsCount <= 1) {
      setErrorAcceso('Debe mantener al menos un usuario con el rol de Administrador.');
      return;
    }

    setAccesos(accesos.filter(a => a.id !== id));
  };

  const handlePasswordChange = (id: string, newPassword: string) => {
    setAccesos(prev => prev.map(acc => {
      if (acc.id === id) {
        return { ...acc, clave: newPassword };
      }
      return acc;
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg('');

    // Sincronizar claves globales heredadas con los perfiles del listado para evitar inconsistencias
    const oscarProfile = accesos.find(a => a.usuario === 'oscar');
    const assistantProfile = accesos.find(a => a.rol === 'asistente');
    const finalClaveAdmin = oscarProfile ? oscarProfile.clave : claveAdmin;
    const finalClaveAsistente = assistantProfile ? assistantProfile.clave : claveAsistente;

    onSaveConfig({
      rmvVigente: Number(rmvVigente),
      bonoVentaPredeterminado: Number(bonoVenta),
      bonoAlquilerPredeterminado: Number(bonoAlquiler),
      claveAdmin: finalClaveAdmin,
      claveAsistente: finalClaveAsistente,
      accesosPermitidos: accesos
    });

    setSuccessMsg('Configuración global y accesos permitidos actualizados correctamente.');
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const resetToPeruDefaults = () => {
    setRmvVigente(1130);
    setBonoVenta(150);
    setBonoAlquiler(80);
    setClaveAdmin('admin123');
    setClaveAsistente('asistente123');
    const defaultAccesos: AccesoUsuario[] = [
      { id: 'acc-1', nombre: 'Oscar Russo', usuario: 'oscar', rol: 'admin', clave: 'admin123' },
      { id: 'acc-2', nombre: 'Asistente Principal', usuario: 'asistente', rol: 'asistente', clave: 'asistente123' }
    ];
    setAccesos(defaultAccesos);
    
    onSaveConfig({
      rmvVigente: 1130,
      bonoVentaPredeterminado: 150,
      bonoAlquilerPredeterminado: 80,
      claveAdmin: 'admin123',
      claveAsistente: 'asistente123',
      accesosPermitidos: defaultAccesos
    });

    setSuccessMsg('Valores estándar de ley restaurados con éxito.');
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  return (
    <div className="w-full space-y-6 animate-fade-in" id="config_manager_root">
      
      {/* Alert banner */}
      {successMsg && (
        <div className="p-4 bg-[#111A2E] border border-blue-500/30 rounded-md flex items-start gap-2 text-blue-300 animate-fade-in" id="config_success">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-blue-400" />
          <div className="text-xs font-semibold">{successMsg}</div>
        </div>
      )}

      {/* Main Form container */}
      <div className="bg-[#111A2E] rounded-md border border-[#1E2D4A] shadow-sm overflow-hidden">
        <div className="p-4 bg-[#0B1120] border-b border-[#1E2D4A] text-white flex justify-between items-center">
          <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
            <Settings className="w-4 h-4 text-blue-400" />
            Configuración Global de Compensación y Ley
          </span>
          <button
            type="button"
            onClick={resetToPeruDefaults}
            className="text-[10px] bg-[#1E2D4A] hover:bg-slate-700 text-slate-200 font-bold uppercase px-2.5 py-1 rounded cursor-pointer transition-colors flex items-center gap-1"
          >
            <RefreshCw className="w-3 h-3" />
            Restaurar Valores Ley
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-4">
            
            {/* 1. RMV Vigente */}
            <div className="p-4 bg-[#0B1120] border border-[#1E2D4A] rounded-md grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
              <div className="md:col-span-2 space-y-1">
                <h4 className="text-xs font-bold text-slate-200 uppercase flex items-center gap-1.5">
                  <Coins className="w-4 h-4 text-blue-400" />
                  Sueldo Mínimo Vital (RMV) Vigente *
                </h4>
                <p className="text-[11px] text-slate-400">
                  Establece el sueldo básico mensual permanente a pagar a la asistente de captación. En Perú, la Remuneración Mínima Vital vigente de ley es de S/ 1,130. Si el gobierno actualiza este valor, modifícalo aquí para actualizar de forma inmediata todas las planillas.
                </p>
              </div>

              <div>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none font-mono text-xs font-bold text-slate-400">
                    S/
                  </span>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    value={rmvVigente || ''}
                    onChange={(e) => setRmvVigente(e.target.value === '' ? 0 : Number(e.target.value))}
                    className="block w-full pl-8 pr-3 py-2 text-sm bg-[#111A2E] border border-[#1E2D4A] rounded-md focus:outline-none focus:border-amber-500 text-amber-400 font-mono font-bold text-right"
                  />
                </div>
              </div>
            </div>

            {/* 2. Bono Venta Predeterminado */}
            <div className="p-4 bg-[#0B1120] border border-[#1E2D4A] rounded-md grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
              <div className="md:col-span-2 space-y-1">
                <h4 className="text-xs font-bold text-slate-200 uppercase flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-blue-400" />
                  Bono Predeterminado de Venta *
                </h4>
                <p className="text-[11px] text-slate-400">
                  Indica el monto estándar en soles a pagar de incentivo/comisión variable al asistente cuando una cita de captación agendada resulta en un cierre efectivo de venta de propiedad.
                </p>
              </div>

              <div>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none font-mono text-xs font-bold text-slate-400">
                    S/
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={bonoVenta || ''}
                    onChange={(e) => setBonoVenta(e.target.value === '' ? 0 : Number(e.target.value))}
                    className="block w-full pl-8 pr-3 py-2 text-sm bg-[#111A2E] border border-[#1E2D4A] rounded-md focus:outline-none focus:border-amber-500 text-amber-400 font-mono font-bold text-right"
                  />
                </div>
              </div>
            </div>

            {/* 3. Bono Alquiler Predeterminado */}
            <div className="p-4 bg-[#0B1120] border border-[#1E2D4A] rounded-md grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
              <div className="md:col-span-2 space-y-1">
                <h4 className="text-xs font-bold text-slate-200 uppercase flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-blue-400" />
                  Bono Predeterminado de Alquiler *
                </h4>
                <p className="text-[11px] text-slate-400">
                  Indica el monto estándar en soles a pagar de incentivo/comisión variable al asistente cuando una cita de captación agendada resulta en un cierre efectivo de alquiler.
                </p>
              </div>

              <div>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none font-mono text-xs font-bold text-slate-400">
                    S/
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={bonoAlquiler || ''}
                    onChange={(e) => setBonoAlquiler(e.target.value === '' ? 0 : Number(e.target.value))}
                    className="block w-full pl-8 pr-3 py-2 text-sm bg-[#111A2E] border border-[#1E2D4A] rounded-md focus:outline-none focus:border-amber-500 text-amber-400 font-mono font-bold text-right"
                  />
                </div>
              </div>
            </div>

            {/* 4. Gestión de Accesos Permitidos */}
            <div className="pt-6 border-t border-[#1E2D4A] mt-6 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-blue-400" />
                Gestión de Accesos Permitidos (Perfiles Autorizados)
              </h3>
              <p className="text-[11px] text-slate-400">
                Registre o elimine perfiles de colaboradores para permitirles ingresar al sistema bajo su propio nombre y rol. Cada usuario ingresará seleccionando su perfil o ingresando su nombre de usuario y contraseña definida desde esta pestaña.
              </p>

              {errorAcceso && (
                <div className="p-3 bg-red-950/60 border border-red-800/60 rounded-md text-red-300 text-xs font-semibold animate-fade-in flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorAcceso}</span>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Form to add access */}
                <div className="lg:col-span-1 bg-[#0B1120] p-4 border border-[#1E2D4A] rounded-md space-y-3">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5 border-b border-[#1E2D4A] pb-2">
                    <Plus className="w-3.5 h-3.5 text-blue-400" />
                    Registrar Nuevo Acceso
                  </h4>
                  
                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase">Nombre Completo</label>
                    <input 
                      type="text"
                      value={nuevoNombre}
                      onChange={(e) => setNuevoNombre(capitalizeWords(e.target.value))}
                      placeholder="Ej. María Morales"
                      className="block w-full px-2.5 py-1.5 text-xs bg-[#111A2E] border border-[#1E2D4A] rounded focus:outline-none focus:border-amber-500 text-slate-100 capitalize"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase">Nombre de Usuario (Login)</label>
                    <input 
                      type="text"
                      value={nuevoUsuario}
                      onChange={(e) => setNuevoUsuario(e.target.value)}
                      placeholder="Ej. maria"
                      className="block w-full px-2.5 py-1.5 text-xs bg-[#111A2E] border border-[#1E2D4A] rounded focus:outline-none focus:border-amber-500 text-slate-100 font-mono font-bold lowercase"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase">Rol de Acceso</label>
                    <select 
                      value={nuevoRol}
                      onChange={(e) => setNuevoRol(e.target.value as 'admin' | 'asistente')}
                      className="block w-full px-2.5 py-1.5 text-xs bg-[#111A2E] border border-[#1E2D4A] rounded focus:outline-none focus:border-amber-500 text-slate-100 font-semibold"
                    >
                      <option value="asistente">Asistente de Captaciones</option>
                      <option value="admin">Administrador (Acceso Total)</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase">Clave / PIN de Entrada</label>
                    <input 
                      type="text"
                      value={nuevaClave}
                      onChange={(e) => setNuevaClave(e.target.value)}
                      placeholder="Ej. maria123"
                      className="block w-full px-2.5 py-1.5 text-xs bg-[#111A2E] border border-[#1E2D4A] rounded focus:outline-none focus:border-amber-500 text-slate-100 font-mono"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleAddAcceso}
                    className="w-full mt-2 py-1.5 bg-[#1E2D4A] hover:bg-slate-700 text-white font-bold text-[10px] uppercase tracking-wider rounded transition-colors flex items-center justify-center gap-1 cursor-pointer shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Habilitar Acceso
                  </button>
                </div>

                {/* Table list of registered accesses */}
                <div className="lg:col-span-2 border border-[#1E2D4A] rounded-md overflow-hidden bg-[#0B1120]">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-300">
                      <thead className="bg-[#111A2E] uppercase text-[10px] text-slate-400 font-bold border-b border-[#1E2D4A]">
                        <tr>
                          <th className="px-4 py-2.5">Nombre</th>
                          <th className="px-4 py-2.5">Usuario</th>
                          <th className="px-4 py-2.5 text-center">Rol</th>
                          <th className="px-4 py-2.5">Contraseña</th>
                          <th className="px-4 py-2.5 text-center">Operación</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#1E2D4A]">
                        {accesos.map((acc) => (
                          <tr key={acc.id} className="hover:bg-[#1E2D4A]/30">
                            <td className="px-4 py-3 font-semibold text-slate-100">
                              {acc.nombre}
                            </td>
                            <td className="px-4 py-3 font-mono text-slate-400 font-bold lowercase">
                              {acc.usuario}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-bold font-mono uppercase border ${
                                acc.rol === 'admin' 
                                  ? 'bg-blue-950/60 text-blue-300 border-blue-800/60' 
                                  : 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60'
                              }`}>
                                {acc.rol === 'admin' ? 'Admin' : 'Asistente'}
                              </span>
                            </td>
                            <td className="px-4 py-2 font-mono">
                              <input
                                type="text"
                                value={acc.clave}
                                onChange={(e) => handlePasswordChange(acc.id, e.target.value)}
                                className="w-full max-w-[130px] px-2 py-1 text-xs bg-[#111A2E] border border-[#1E2D4A] focus:border-amber-500 rounded font-mono font-bold text-slate-100 focus:outline-none transition-colors"
                                placeholder="Definir clave"
                                required
                              />
                            </td>
                            <td className="px-4 py-3 text-center">
                              {acc.usuario === 'oscar' ? (
                                <span className="text-[9px] uppercase font-mono font-bold text-slate-400 bg-[#111A2E] px-2 py-0.5 rounded border border-[#1E2D4A]">
                                  Principal
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteAcceso(acc.id)}
                                  className="p-1 hover:bg-red-950/50 text-slate-400 hover:text-red-400 rounded transition-colors cursor-pointer"
                                  title="Revocar acceso"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            </div>

          </div>

          <div className="flex gap-3 justify-end pt-3">
            <button
              type="submit"
              className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-md font-bold text-xs uppercase tracking-wider cursor-pointer shadow-sm transition-colors"
              id="save_config_btn"
            >
              Guardar Configuración
            </button>
          </div>
        </form>
      </div>

      {/* Strategy and compliance guidance */}
      <div className="p-4 bg-[#111A2E] border border-[#1E2D4A] rounded-md flex gap-3 text-xs text-slate-300">
        <Info className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold text-slate-100">Marco Legal Peruano y Directrices Corporativas:</p>
          <p className="mt-1 text-slate-400">
            Cualquier ajuste realizado en este panel de configuración impactará de manera general a los cálculos futuros de planilla y el agendamiento de nuevas citas. Los bonos de las citas ya registradas conservarán el valor asignado al momento de su registro a menos que se editen individualmente, asegurando coherencia histórica de las comisiones devengadas por la asistente.
          </p>
        </div>
      </div>

    </div>
  );
}
