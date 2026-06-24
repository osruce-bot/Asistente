/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Building2, 
  Lock, 
  KeyRound, 
  Shield, 
  Users, 
  AlertCircle,
  LockOpen
} from 'lucide-react';
import { ConfigGeneral, AccesoUsuario } from '../types';

interface LockScreenProps {
  config: ConfigGeneral;
  onUnlock: (role: 'admin' | 'asistente', profileName?: string) => void;
  user: any; // User | null
  isSyncing: boolean;
}

export default function LockScreen({
  config,
  onUnlock,
  user,
  isSyncing
}: LockScreenProps) {
  const [selectedProfileId, setSelectedProfileId] = useState<string>('');
  const [passwordInput, setPasswordInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Fallback defaults if not set in config yet
  const defaultProfiles: AccesoUsuario[] = [
    { id: 'acc-1', nombre: 'Oscar Russo', usuario: 'oscar', rol: 'admin', clave: config.claveAdmin || 'admin123' },
    { id: 'acc-2', nombre: 'Asistente Principal', usuario: 'asistente', rol: 'asistente', clave: config.claveAsistente || 'asistente123' }
  ];

  const profiles = config.accesosPermitidos && config.accesosPermitidos.length > 0 
    ? config.accesosPermitidos 
    : defaultProfiles;

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!selectedProfileId) {
      setErrorMsg('Por favor, seleccione su cuenta de usuario para ingresar.');
      return;
    }

    const selectedProfile = profiles.find(p => p.id === selectedProfileId);
    if (!selectedProfile) {
      setErrorMsg('Perfil seleccionado no válido.');
      return;
    }

    if (passwordInput === selectedProfile.clave) {
      onUnlock(selectedProfile.rol, selectedProfile.nombre);
    } else {
      setErrorMsg('Contraseña de seguridad incorrecta. Intente de nuevo.');
      setPasswordInput('');
    }
  };

  const activeProfile = profiles.find(p => p.id === selectedProfileId);

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 sm:p-6 md:p-8" id="lock_screen_root">
      <div className="max-w-md w-full bg-white rounded-lg border border-slate-200 shadow-xl overflow-hidden animate-fade-in">
        
        {/* Banner header */}
        <div className="p-6 bg-navy text-white text-center space-y-3 relative">
          <div className="mx-auto w-12 h-12 bg-primary rounded-md flex items-center justify-center shadow-lg">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <div className="space-y-1">
            <h1 className="text-base font-bold tracking-tight uppercase">
              REMAX POWER EXPO <span className="text-blue-400">| RRHH & CITAS</span>
            </h1>
            <p className="text-[10px] text-slate-300 font-semibold tracking-wider uppercase">
              Portal de Acceso Autorizado
            </p>
          </div>
        </div>

        {/* Sync Status Banner */}
        <div className="bg-slate-50 px-5 py-2.5 border-b border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5 text-[10px]">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="font-semibold text-slate-600">Base de datos en la nube activa (Firestore)</span>
          </div>
          {isSyncing && (
            <span className="text-[9px] font-bold text-primary animate-pulse uppercase">Sincronizando...</span>
          )}
        </div>

        <div className="p-6 space-y-6">
          
          {errorMsg && (
            <div className="p-3.5 bg-red-50 border border-brand-red/10 rounded-md text-brand-red flex items-start gap-2.5 text-xs font-semibold animate-fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleVerify} className="space-y-4">
            
            {/* Account select field */}
            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Seleccione su Usuario / Perfil
              </label>
              <div className="relative">
                <select
                  value={selectedProfileId}
                  onChange={(e) => {
                    setSelectedProfileId(e.target.value);
                    setErrorMsg('');
                    setPasswordInput('');
                  }}
                  required
                  className="block w-full px-3 py-2.5 bg-white border border-slate-200 rounded-md text-slate-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary cursor-pointer"
                >
                  <option value="">-- Elija su cuenta autorizada --</option>
                  {profiles.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nombre} ({p.rol === 'admin' ? 'Administrador' : 'Asistente de Captaciones'})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Password input box */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-md space-y-3">
              <div className="flex items-center gap-2">
                {activeProfile && activeProfile.rol === 'admin' ? (
                  <Shield className="w-4 h-4 text-blue-600" />
                ) : (
                  <Users className="w-4 h-4 text-emerald-600" />
                )}
                <label className="text-xs font-bold text-slate-700 uppercase">
                  Contraseña de Seguridad
                </label>
              </div>

              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type="password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="Ingrese contraseña asignada"
                  disabled={!selectedProfileId}
                  required
                  className="block w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-slate-900 font-mono font-bold disabled:bg-slate-100 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={!selectedProfileId}
              className="w-full py-2.5 bg-primary hover:bg-primary/95 text-white rounded-md font-bold text-xs uppercase tracking-wider shadow transition-colors cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <LockOpen className="w-4 h-4" />
              Ingresar al Sistema
            </button>

            <p className="text-[9px] text-center text-slate-400 leading-relaxed pt-2">
              * Los accesos y contraseñas de seguridad de los perfiles son gestionados por el Administrador desde la pestaña Configuración.
            </p>
          </form>

        </div>

        <div className="bg-slate-50 p-4 text-center border-t border-slate-100">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
            REMAX POWER EXPO • LIMA, PERÚ
          </p>
        </div>

      </div>
    </div>
  );
}
