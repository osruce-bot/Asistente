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
  LockOpen,
  Cloud,
  LogOut
} from 'lucide-react';
import { ConfigGeneral, AccesoUsuario } from '../types';

interface LockScreenProps {
  config: ConfigGeneral;
  onUnlock: (role: 'admin' | 'asistente', profileName?: string) => void;
  user: any; // User | null
  isSyncing: boolean;
  cloudSyncError?: string | null;
  onGoogleLogin: () => void;
  onGoogleLogout: () => void;
}

export default function LockScreen({
  config,
  onUnlock,
  user,
  isSyncing,
  cloudSyncError,
  onGoogleLogin,
  onGoogleLogout
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
    <div className="min-h-screen bg-[#0B1120] flex items-center justify-center p-4 sm:p-6 md:p-8" id="lock_screen_root">
      <div className="max-w-md w-full bg-[#111A2E] rounded-2xl border border-[#1E2D4A] shadow-2xl overflow-hidden animate-fade-in">
        
        {/* Banner header */}
        <div className="p-6 bg-[#0B1120] text-white text-center space-y-3 relative border-b border-[#1E2D4A]">
          <div className="mx-auto w-12 h-12 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <div className="space-y-1">
            <h1 className="text-base font-bold tracking-tight uppercase">
              REMAX POWER EXPO <span className="text-cyan-400">| RRHH & CITAS</span>
            </h1>
            <p className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase">
              Portal de Acceso Autorizado
            </p>
          </div>
        </div>

        {/* Sync Status Banner */}
        {cloudSyncError ? (
          <div className="bg-amber-950/30 px-5 py-3 border-b border-amber-500/20 flex flex-col gap-1 text-[10px] text-amber-300 animate-fade-in">
            <div className="flex items-center gap-1.5 font-bold uppercase">
              <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse shrink-0" />
              <span>Sincronización Limitada (Local)</span>
            </div>
            <p className="text-slate-300 leading-normal font-medium">
              {cloudSyncError}
            </p>
          </div>
        ) : (
          <div className="bg-[#0B1120]/60 px-5 py-2.5 border-b border-[#1E2D4A] flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-1.5 text-[10px]">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              <span className="font-semibold text-slate-300">Base de datos en la nube activa (Firestore)</span>
            </div>
            {isSyncing && (
              <span className="text-[9px] font-bold text-cyan-400 animate-pulse uppercase">Sincronizando...</span>
            )}
          </div>
        )}

        <div className="p-6 space-y-6">
          
          {errorMsg && (
            <div className="p-3.5 bg-rose-950/40 border border-rose-500/30 rounded-lg text-rose-300 flex items-start gap-2.5 text-xs font-semibold animate-fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleVerify} className="space-y-4">
            
            <div className="p-3 bg-cyan-950/30 border border-cyan-500/20 rounded-xl flex items-start gap-2.5 text-[10px] text-slate-300 font-medium">
              <Shield className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <p className="leading-snug">
                <strong className="font-bold text-white">Seguridad de Sesión Activa:</strong> Por protección de datos confidenciales de RE/MAX Power Expo, al cerrar la página o navegador la sesión se bloqueará automáticamente y se requerirá ingresar clave nuevamente.
              </p>
            </div>

            {/* Account select field */}
            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
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
                  className="block w-full px-3 py-2.5 bg-[#0B1120] border border-[#2A3B5C] rounded-lg text-white text-xs font-semibold focus:outline-none focus:border-cyan-400 cursor-pointer"
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
            <div className="p-4 bg-[#0B1120]/80 border border-[#1E2D4A] rounded-xl space-y-3">
              <div className="flex items-center gap-2">
                {activeProfile && activeProfile.rol === 'admin' ? (
                  <Shield className="w-4 h-4 text-cyan-400" />
                ) : (
                  <Users className="w-4 h-4 text-emerald-400" />
                )}
                <label className="text-xs font-bold text-slate-200 uppercase">
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
                  className="block w-full pl-9 pr-3 py-2 text-sm bg-[#111A2E] border border-[#2A3B5C] rounded-lg focus:outline-none focus:border-cyan-400 text-white font-mono font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={!selectedProfileId}
              className="w-full py-2.5 bg-primary hover:bg-primary/90 text-white rounded-lg font-bold text-xs uppercase tracking-wider shadow-lg shadow-blue-500/20 transition-colors cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <LockOpen className="w-4 h-4" />
              Ingresar al Sistema
            </button>

            <p className="text-[9px] text-center text-slate-400 leading-relaxed pt-2">
              * Los accesos y contraseñas de seguridad de los perfiles son gestionados por el Administrador desde la pestaña Configuración.
            </p>
          </form>

          {/* Google Cloud Backup Sync Option */}
          <div className="pt-4 border-t border-[#1E2D4A] mt-4 space-y-3">
            {user && !user.isAnonymous ? (
              <div className="p-3 bg-[#0B1120] border border-[#1E2D4A] rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Cloud className="w-4 h-4 text-cyan-400 animate-pulse shrink-0" />
                  <div className="text-left">
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider leading-none">Copia de Seguridad Activa</p>
                    <p className="text-xs font-bold text-white truncate max-w-[170px] mt-0.5">{user.email}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onGoogleLogout}
                  className="flex items-center gap-1 text-[9px] text-slate-400 hover:text-rose-400 font-bold uppercase tracking-wider bg-[#1E2D4A] hover:bg-rose-950/40 px-2 py-1 rounded transition-colors"
                >
                  <LogOut className="w-3 h-3" />
                  Desvincular
                </button>
              </div>
            ) : (
              <div className="p-3 bg-amber-950/20 border border-amber-500/20 rounded-xl space-y-2">
                <div className="flex items-start gap-2 text-[10px] text-amber-300 leading-relaxed">
                  <Cloud className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>
                    <strong className="font-bold text-amber-200">¿Deseas acceder desde Incógnito o evitar pérdida de datos?</strong> Inicia sesión con tu cuenta de Google para sincronizar tus contraseñas y citas guardadas en la nube.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={onGoogleLogin}
                  className="w-full py-1.5 bg-[#1E2D4A] hover:bg-[#2A3B5C] text-white font-bold text-[10px] uppercase tracking-wider rounded-lg border border-[#2A3B5C] transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Cloud className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                  <span>Iniciar Sesión con Google</span>
                </button>
              </div>
            )}
          </div>

        </div>

        <div className="bg-[#0B1120] p-4 text-center border-t border-[#1E2D4A]">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
            REMAX POWER EXPO • LIMA, PERÚ
          </p>
        </div>

      </div>
    </div>
  );
}
