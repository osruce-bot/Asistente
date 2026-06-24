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
  User, 
  Users, 
  AlertCircle, 
  Cloud,
  CheckCircle2
} from 'lucide-react';
import { ConfigGeneral } from '../types';

interface LockScreenProps {
  config: ConfigGeneral;
  onUnlock: (role: 'admin' | 'asistente') => void;
  user: any; // User | null
  onGoogleLogin: () => void;
  isSyncing: boolean;
}

export default function LockScreen({
  config,
  onUnlock,
  user,
  onGoogleLogin,
  isSyncing
}: LockScreenProps) {
  const [selectedRole, setSelectedRole] = useState<'admin' | 'asistente' | null>(null);
  const [passwordInput, setPasswordInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Fallback defaults if not set in config yet
  const requiredAdminPass = config.claveAdmin || 'admin123';
  const requiredAsistentePass = config.claveAsistente || 'asistente123';

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!selectedRole) return;

    const correctPassword = selectedRole === 'admin' ? requiredAdminPass : requiredAsistentePass;

    if (passwordInput === correctPassword) {
      onUnlock(selectedRole);
    } else {
      setErrorMsg('Contraseña incorrecta. Por favor, intente de nuevo.');
      setPasswordInput('');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-6 md:p-8" id="lock_screen_root">
      <div className="max-w-md w-full bg-white rounded-lg border border-slate-200 shadow-xl overflow-hidden animate-fade-in">
        
        {/* Banner header */}
        <div className="p-6 bg-navy text-white text-center space-y-3 relative">
          <div className="mx-auto w-12 h-12 bg-primary rounded-md flex items-center justify-center shadow-lg">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <div className="space-y-1">
            <h1 className="text-base font-bold tracking-tight uppercase">
              OSCAR RUSSO <span className="text-blue-400">| RRHH & Citas</span>
            </h1>
            <p className="text-[10px] text-slate-300 font-semibold tracking-wider uppercase">
              Portal de Acceso de Seguridad
            </p>
          </div>
        </div>

        {/* Google Sync Info for Administrator */}
        <div className="bg-slate-100/80 px-5 py-3 border-b border-slate-200 flex items-center justify-between gap-3 text-xs">
          {user ? (
            <div className="flex items-center gap-2 text-slate-700">
              <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
              <span className="font-semibold text-[10px] truncate max-w-[180px]">
                Nube activa: {user.displayName || user.email}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-slate-500 text-[10px]">
              <Cloud className="w-3.5 h-3.5" />
              <span>Trabajando localmente</span>
            </div>
          )}

          {!user && (
            <button
              onClick={onGoogleLogin}
              disabled={isSyncing}
              className="text-[9px] font-bold text-primary uppercase hover:underline disabled:opacity-50"
            >
              {isSyncing ? 'Conectando...' : 'Acceder con Google'}
            </button>
          )}
        </div>

        <div className="p-6 space-y-6">
          
          {errorMsg && (
            <div className="p-3.5 bg-red-50 border border-brand-red/10 rounded-md text-brand-red flex items-start gap-2.5 text-xs font-semibold animate-fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {!selectedRole ? (
            // Step 1: Select Role
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider text-center">
                Seleccione su Perfil de Acceso
              </h3>

              <div className="grid grid-cols-1 gap-3">
                {/* Admin button option */}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedRole('admin');
                    setErrorMsg('');
                  }}
                  className="flex items-center gap-4 p-4 rounded-md border border-slate-200 hover:border-primary/40 hover:bg-slate-50/50 transition-all text-left group cursor-pointer"
                >
                  <div className="w-10 h-10 rounded bg-blue-50 border border-primary/10 flex items-center justify-center text-primary group-hover:scale-105 transition-transform">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                      Administrador (Oscar Russo)
                    </h4>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      Acceso total a planillas, sueldos fijos, liquidaciones y configuración.
                    </p>
                  </div>
                </button>

                {/* Assistant button option */}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedRole('asistente');
                    setErrorMsg('');
                  }}
                  className="flex items-center gap-4 p-4 rounded-md border border-slate-200 hover:border-emerald-500/40 hover:bg-slate-50/50 transition-all text-left group cursor-pointer"
                >
                  <div className="w-10 h-10 rounded bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 group-hover:scale-105 transition-transform">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                      Asistente de Captaciones
                    </h4>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      Registro de llamadas de prospección y agendamiento de citas logradas.
                    </p>
                  </div>
                </button>
              </div>
            </div>
          ) : (
            // Step 2: Enter password/PIN
            <form onSubmit={handleVerify} className="space-y-4">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedRole(null);
                    setPasswordInput('');
                    setErrorMsg('');
                  }}
                  className="text-[10px] font-bold text-slate-500 hover:text-slate-900 uppercase"
                >
                  ← Volver a roles
                </button>
                <span className="text-[10px] uppercase font-bold text-slate-400">
                  {selectedRole === 'admin' ? 'Acceso Admin' : 'Acceso Asistente'}
                </span>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-md space-y-3">
                <div className="flex items-center gap-2">
                  {selectedRole === 'admin' ? (
                    <Shield className="w-4 h-4 text-primary" />
                  ) : (
                    <Users className="w-4 h-4 text-emerald-600" />
                  )}
                  <label className="text-xs font-bold text-slate-700 uppercase">
                    Ingrese clave de {selectedRole === 'admin' ? 'Administrador' : 'Asistente'}
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
                    placeholder="Contraseña de acceso"
                    required
                    autoFocus
                    className="block w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-slate-900 font-mono font-bold"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-primary hover:bg-primary/95 text-white rounded-md font-bold text-xs uppercase tracking-wider shadow transition-colors cursor-pointer"
              >
                Ingresar al Portal
              </button>

              <p className="text-[9px] text-center text-slate-400 leading-relaxed pt-2">
                * Las claves predeterminadas son <code className="bg-slate-100 px-1 py-0.5 rounded font-bold font-mono">admin123</code> para Administrador y <code className="bg-slate-100 px-1 py-0.5 rounded font-bold font-mono">asistente123</code> para la Asistente. Pueden personalizarse en la pestaña Configuración.
              </p>
            </form>
          )}

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
