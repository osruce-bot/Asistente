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
  KeyRound
} from 'lucide-react';
import { ConfigGeneral } from '../types';
import { formatPEN } from '../utils/currency';

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

  // Keep local state in sync when cloud config loads
  useEffect(() => {
    setRmvVigente(config.rmvVigente);
    setBonoVenta(config.bonoVentaPredeterminado);
    setBonoAlquiler(config.bonoAlquilerPredeterminado);
    setClaveAdmin(config.claveAdmin || 'admin123');
    setClaveAsistente(config.claveAsistente || 'asistente123');
  }, [config]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg('');

    onSaveConfig({
      rmvVigente: Number(rmvVigente),
      bonoVentaPredeterminado: Number(bonoVenta),
      bonoAlquilerPredeterminado: Number(bonoAlquiler),
      claveAdmin,
      claveAsistente
    });

    setSuccessMsg('Configuración global actualizada correctamente.');
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const resetToPeruDefaults = () => {
    if (window.confirm('¿Confirmas que deseas restaurar los valores predeterminados de ley para Perú?')) {
      setRmvVigente(1130);
      setBonoVenta(150);
      setBonoAlquiler(80);
      setClaveAdmin('admin123');
      setClaveAsistente('asistente123');
      
      onSaveConfig({
        rmvVigente: 1130,
        bonoVentaPredeterminado: 150,
        bonoAlquilerPredeterminado: 80,
        claveAdmin: 'admin123',
        claveAsistente: 'asistente123'
      });

      setSuccessMsg('Valores estándar de ley restaurados con éxito.');
      setTimeout(() => setSuccessMsg(''), 4000);
    }
  };

  return (
    <div className="w-full space-y-6 animate-fade-in" id="config_manager_root">
      
      {/* Alert banner */}
      {successMsg && (
        <div className="p-4 bg-blue-50 border border-primary/20 rounded-md flex items-start gap-2 text-primary animate-fade-in" id="config_success">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <div className="text-xs font-semibold">{successMsg}</div>
        </div>
      )}

      {/* Main Form container */}
      <div className="bg-white rounded-md border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 bg-navy border-b border-navy/20 text-white flex justify-between items-center">
          <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
            <Settings className="w-4 h-4 text-blue-400" />
            Configuración Global de Compensación y Ley
          </span>
          <button
            type="button"
            onClick={resetToPeruDefaults}
            className="text-[10px] bg-slate-800 hover:bg-slate-700 font-bold uppercase px-2.5 py-1 rounded cursor-pointer transition-colors flex items-center gap-1"
          >
            <RefreshCw className="w-3 h-3" />
            Restaurar Valores Ley
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-4">
            
            {/* 1. RMV Vigente */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-md grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
              <div className="md:col-span-2 space-y-1">
                <h4 className="text-xs font-bold text-slate-800 uppercase flex items-center gap-1.5">
                  <Coins className="w-4 h-4 text-primary" />
                  Sueldo Mínimo Vital (RMV) Vigente *
                </h4>
                <p className="text-[11px] text-slate-500">
                  Establece el sueldo básico mensual permanente a pagar a la asistente de captación. En Perú, la Remuneración Mínima Vital vigente de ley es de S/ 1,130. Si el gobierno actualiza este valor, modifícalo aquí para actualizar de forma inmediata todas las planillas.
                </p>
              </div>

              <div>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none font-mono text-xs font-bold text-slate-500">
                    S/
                  </span>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    value={rmvVigente || ''}
                    onChange={(e) => setRmvVigente(e.target.value === '' ? 0 : Number(e.target.value))}
                    className="block w-full pl-8 pr-3 py-2 text-sm bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-slate-900 font-mono font-bold text-right"
                  />
                </div>
              </div>
            </div>

            {/* 2. Bono Venta Predeterminado */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-md grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
              <div className="md:col-span-2 space-y-1">
                <h4 className="text-xs font-bold text-slate-800 uppercase flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  Bono Predeterminado de Venta *
                </h4>
                <p className="text-[11px] text-slate-500">
                  Indica el monto estándar en soles a pagar de incentivo/comisión variable al asistente cuando una cita de captación agendada resulta en un cierre efectivo de venta de propiedad.
                </p>
              </div>

              <div>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none font-mono text-xs font-bold text-slate-500">
                    S/
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={bonoVenta || ''}
                    onChange={(e) => setBonoVenta(e.target.value === '' ? 0 : Number(e.target.value))}
                    className="block w-full pl-8 pr-3 py-2 text-sm bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-slate-900 font-mono font-bold text-right"
                  />
                </div>
              </div>
            </div>

            {/* 3. Bono Alquiler Predeterminado */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-md grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
              <div className="md:col-span-2 space-y-1">
                <h4 className="text-xs font-bold text-slate-800 uppercase flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-primary" />
                  Bono Predeterminado de Alquiler *
                </h4>
                <p className="text-[11px] text-slate-500">
                  Indica el monto estándar en soles a pagar de incentivo/comisión variable al asistente cuando una cita de captación agendada resulta en un cierre efectivo de alquiler.
                </p>
              </div>

              <div>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none font-mono text-xs font-bold text-slate-500">
                    S/
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={bonoAlquiler || ''}
                    onChange={(e) => setBonoAlquiler(e.target.value === '' ? 0 : Number(e.target.value))}
                    className="block w-full pl-8 pr-3 py-2 text-sm bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-slate-900 font-mono font-bold text-right"
                  />
                </div>
              </div>
            </div>

            {/* 4. Claves de Acceso de Seguridad */}
            <div className="pt-4 border-t border-slate-200 mt-6 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-primary" />
                Control de Acceso y Claves de Roles
              </h3>
              <p className="text-[11px] text-slate-500">
                Define las contraseñas para restringir el acceso a la aplicación. El Administrador tiene control absoluto de todo, mientras que la Asistente tiene acceso simplificado de registro de llamadas y citas sin visibilidad financiera.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Clave Administrador */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-md space-y-2">
                  <label className="text-xs font-bold text-slate-800 uppercase flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-blue-500" />
                    Clave del Administrador (Oscar Russo) *
                  </label>
                  <p className="text-[10px] text-slate-400">
                    Clave para desbloquear todas las pestañas, planilla, colaboradores y configuraciones.
                  </p>
                  <input
                    type="text"
                    value={claveAdmin}
                    onChange={(e) => setClaveAdmin(e.target.value)}
                    placeholder="Defina clave administrador"
                    required
                    className="block w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-slate-900 font-mono font-bold"
                  />
                </div>

                {/* Clave Asistente */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-md space-y-2">
                  <label className="text-xs font-bold text-slate-800 uppercase flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-emerald-600" />
                    Clave de la Asistente (Acceso Limitado) *
                  </label>
                  <p className="text-[10px] text-slate-400">
                    Clave para habilitar el registro de llamadas de prospección y citas de captación logradas.
                  </p>
                  <input
                    type="text"
                    value={claveAsistente}
                    onChange={(e) => setClaveAsistente(e.target.value)}
                    placeholder="Defina clave asistente"
                    required
                    className="block w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-slate-900 font-mono font-bold"
                  />
                </div>
              </div>
            </div>

          </div>

          <div className="flex gap-3 justify-end pt-3">
            <button
              type="submit"
              className="px-6 py-2.5 bg-primary hover:bg-primary/95 text-white rounded-md font-bold text-xs uppercase tracking-wider cursor-pointer shadow-sm transition-colors"
              id="save_config_btn"
            >
              Guardar Configuración
            </button>
          </div>
        </form>
      </div>

      {/* Strategy and compliance guidance */}
      <div className="p-4 bg-slate-100 border border-slate-200 rounded-md flex gap-3 text-xs text-slate-600">
        <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
        <div>
          <p className="font-bold text-slate-800">Marco Legal Peruano y Directrices Corporativas:</p>
          <p className="mt-1">
            Cualquier ajuste realizado en este panel de configuración impactará de manera general a los cálculos futuros de planilla y el agendamiento de nuevas citas. Los bonos de las citas ya registradas conservarán el valor asignado al momento de su registro a menos que se editen individualmente, asegurando coherencia histórica de las comisiones devengadas por la asistente.
          </p>
        </div>
      </div>

    </div>
  );
}
