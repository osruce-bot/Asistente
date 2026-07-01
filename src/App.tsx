/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  LayoutDashboard, 
  PlusCircle, 
  Calendar, 
  FileText, 
  Settings, 
  Coins, 
  RefreshCw, 
  Cloud, 
  Users, 
  LogOut,
  Sliders,
  Award,
  Lock
} from 'lucide-react';
import { Asistente, Cita, EstadoCita, EstadoCierre, TipoOperacionCita, ConfigGeneral, LiquidacionMensual, AuditLog, AccesoUsuario } from './types';
import Dashboard from './components/Dashboard';
import AsistentesManager from './components/AsistentesManager';
import CitasManager from './components/CitasManager';
import ReportesLiquidacion from './components/ReportesLiquidacion';
import ConfigManager from './components/ConfigManager';
import LockScreen from './components/LockScreen';

// Firebase Integrations
import { 
  auth, 
  db, 
  getGoogleProvider, 
  handleFirestoreError, 
  OperationType,
  testConnection
} from './lib/firebase';
import { 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  signInAnonymously
} from 'firebase/auth';
import type { User } from 'firebase/auth';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  setDoc, 
  deleteDoc, 
  writeBatch,
  getDoc
} from 'firebase/firestore';

// Shared workspace identifier for RE/MAX Power Expo team synchronization
export const WORKSPACE_ID = 'remax_expo';


// Standard Premium Preset Data for seed
const PRESET_ASISTENTES: Asistente[] = [
  {
    id: 'as-1',
    nombreCompleto: 'María Fernanda Morales',
    dni: '70258149',
    celular: '984512365',
    correo: 'm.morales@remaxpower.pe',
    banco: 'BCP',
    tipoCuenta: 'Ahorros Sueldo',
    numeroCuenta: '191-9458214-0-45',
    cci: '002-19100945821404551',
    fechaIngreso: '2026-01-15',
    cargo: 'Asistente de Captaciones',
    sueldoBasico: 1130,
    activo: true
  },
  {
    id: 'as-2',
    nombreCompleto: 'Carlos Ruiz Segura',
    dni: '45812973',
    celular: '991254367',
    correo: 'c.ruiz@remaxpower.pe',
    banco: 'BBVA',
    tipoCuenta: 'Ahorros Soles',
    numeroCuenta: '0011-0185-0200384912',
    cci: '001-1185020038491244',
    fechaIngreso: '2026-03-01',
    cargo: 'Coordinador de Campo',
    sueldoBasico: 1130,
    activo: true
  }
];

// Presets representing appointments
const getPresetCitas = (): Cita[] => {
  const d = new Date();
  const currentMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  
  // Calculate previous month
  let prevYear = d.getFullYear();
  let prevMonthNum = d.getMonth(); // 0-indexed, so it's previous month's number
  if (prevMonthNum === 0) {
    prevMonthNum = 12;
    prevYear -= 1;
  }
  const prevMonth = `${prevYear}-${String(prevMonthNum).padStart(2, '0')}`;

  return [
    {
      id: 'cita-1',
      asistenteId: 'as-1',
      asistenteNombre: 'María Fernanda Morales',
      fechaCita: `${currentMonth}-10`,
      horaCita: '10:30',
      clienteNombre: 'Alejandro Toledo Rivas',
      clienteCelular: '945123687',
      direccionPropiedad: 'Av. El Polo 405, Santiago de Surco',
      tipoPropiedad: 'Departamento',
      tipoOperacion: TipoOperacionCita.VENTA,
      estadoCita: EstadoCita.REALIZADA,
      estadoCierre: EstadoCierre.CERRADO,
      fechaCierre: `${currentMonth}-15`,
      montoBono: 150,
      notas: 'Cita muy productiva. El propietario firmó la exclusividad de venta por 6 meses.',
      fechaLlamada: `${currentMonth}-08`,
      distritoPropiedad: 'Santiago de Surco'
    },
    {
      id: 'cita-2',
      asistenteId: 'as-2',
      asistenteNombre: 'Carlos Ruiz Segura',
      fechaCita: `${currentMonth}-12`,
      horaCita: '15:00',
      clienteNombre: 'Juana de Arco Alva',
      clienteCelular: '992147586',
      direccionPropiedad: 'Calle Cantuarias 248, Miraflores',
      tipoPropiedad: 'Oficina',
      tipoOperacion: TipoOperacionCita.ALQUILER,
      estadoCita: EstadoCita.REALIZADA,
      estadoCierre: EstadoCierre.CERRADO,
      fechaCierre: `${currentMonth}-18`,
      montoBono: 80,
      notas: 'Oficina comercial. Se logró cerrar el contrato de alquiler por 2 años.',
      fechaLlamada: `${currentMonth}-10`,
      distritoPropiedad: 'Miraflores'
    },
    {
      id: 'cita-3',
      asistenteId: 'as-1',
      asistenteNombre: 'María Fernanda Morales',
      fechaCita: `${currentMonth}-20`,
      horaCita: '11:00',
      clienteNombre: 'Humberto Martínez',
      clienteCelular: '984512369',
      direccionPropiedad: 'Av. Primavera 1250, Dpto 501, Surco',
      tipoPropiedad: 'Departamento',
      tipoOperacion: TipoOperacionCita.VENTA,
      estadoCita: EstadoCita.AGENDADA,
      estadoCierre: EstadoCierre.PENDIENTE,
      montoBono: 150,
      notas: 'Reunión confirmada para coordinar la toma de fotos profesionales.',
      fechaLlamada: `${currentMonth}-18`,
      distritoPropiedad: 'Santiago de Surco'
    },
    {
      id: 'cita-4',
      asistenteId: 'as-2',
      asistenteNombre: 'Carlos Ruiz Segura',
      fechaCita: `${prevMonth}-05`,
      horaCita: '16:30',
      clienteNombre: 'Beatriz Ortiz',
      clienteCelular: '965412879',
      direccionPropiedad: 'Av. Manuel Olguín 325, Surco',
      tipoPropiedad: 'Departamento',
      tipoOperacion: TipoOperacionCita.VENTA,
      estadoCita: EstadoCita.REALIZADA,
      estadoCierre: EstadoCierre.LIQUIDADO,
      fechaCierre: `${prevMonth}-12`,
      montoBono: 150,
      notas: 'Ya liquidado en la planilla del mes anterior de forma satisfactoria.',
      fechaLlamada: `${prevMonth}-02`,
      distritoPropiedad: 'Santiago de Surco'
    },
    {
      id: 'cita-5',
      asistenteId: 'as-1',
      asistenteNombre: 'María Fernanda Morales',
      fechaCita: `${currentMonth}-02`,
      horaCita: '09:00',
      clienteNombre: 'Roberto Gómez Bolaños',
      clienteCelular: '912543876',
      direccionPropiedad: 'Jr. Carabaya 541, Cercado de Lima',
      tipoPropiedad: 'Local Comercial',
      tipoOperacion: TipoOperacionCita.VENTA,
      estadoCita: EstadoCita.CANCELADA,
      estadoCierre: EstadoCierre.DESCARTADO,
      montoBono: 150,
      notas: 'El propietario desistió de vender el local comercial por motivos personales.',
      fechaLlamada: `${currentMonth}-01`,
      distritoPropiedad: 'Lima (Cercado)'
    }
  ];
};

const DEFAULT_CONFIG: ConfigGeneral = {
  rmvVigente: 1130,
  bonoVentaPredeterminado: 150,
  bonoAlquilerPredeterminado: 80,
  claveAdmin: 'admin123',
  claveAsistente: 'asistente123',
  accesosPermitidos: [
    {
      id: 'acc-1',
      nombre: 'Oscar Russo',
      usuario: 'oscar',
      rol: 'admin',
      clave: 'admin123'
    },
    {
      id: 'acc-2',
      nombre: 'Asistente Principal',
      usuario: 'asistente',
      rol: 'asistente',
      clave: 'asistente123'
    }
  ]
};

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [userRole, setUserRole] = useState<'admin' | 'asistente' | null>(() => {
    return sessionStorage.getItem('remax_user_role') as 'admin' | 'asistente' | null;
  });
  const [asistentes, setAsistentes] = useState<Asistente[]>([]);
  const [citas, setCitas] = useState<Cita[]>([]);
  const [config, setConfig] = useState<ConfigGeneral>(DEFAULT_CONFIG);
  const [liquidaciones, setLiquidaciones] = useState<LiquidacionMensual[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // Sync state & Auth
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [logoutModalOpen, setLogoutModalOpen] = useState<boolean>(false);
  const [unlockedProfileName, setUnlockedProfileName] = useState<string>(() => {
    return sessionStorage.getItem('remax_profile_name') || '';
  });

  // Clean up any potential leftover dark class
  useEffect(() => {
    document.documentElement.classList.remove('dark');
    testConnection();
  }, []);

  // 1. Initial Local Storage Load fallback
  useEffect(() => {
    const localAsistentes = localStorage.getItem('remax_hr_asistentes');
    if (localAsistentes) {
      try {
        setAsistentes(JSON.parse(localAsistentes));
      } catch {
        setAsistentes(PRESET_ASISTENTES);
      }
    } else {
      setAsistentes(PRESET_ASISTENTES);
      localStorage.setItem('remax_hr_asistentes', JSON.stringify(PRESET_ASISTENTES));
    }

    const localCitas = localStorage.getItem('remax_hr_citas');
    if (localCitas) {
      try {
        setCitas(JSON.parse(localCitas));
      } catch {
        setCitas(getPresetCitas());
      }
    } else {
      const presets = getPresetCitas();
      setCitas(presets);
      localStorage.setItem('remax_hr_citas', JSON.stringify(presets));
    }

    const localConfig = localStorage.getItem('remax_hr_config');
    if (localConfig) {
      try {
        setConfig(JSON.parse(localConfig));
      } catch {
        setConfig(DEFAULT_CONFIG);
      }
    } else {
      setConfig(DEFAULT_CONFIG);
      localStorage.setItem('remax_hr_config', JSON.stringify(DEFAULT_CONFIG));
    }

    const localLiq = localStorage.getItem('remax_hr_liquidaciones');
    if (localLiq) {
      try {
        setLiquidaciones(JSON.parse(localLiq));
      } catch {
        setLiquidaciones([]);
      }
    } else {
      setLiquidaciones([]);
      localStorage.setItem('remax_hr_liquidaciones', JSON.stringify([]));
    }

    const localAuditLogs = localStorage.getItem('remax_hr_audit_logs');
    if (localAuditLogs) {
      try {
        setAuditLogs(JSON.parse(localAuditLogs));
      } catch {
        setAuditLogs([]);
      }
    } else {
      setAuditLogs([]);
      localStorage.setItem('remax_hr_audit_logs', JSON.stringify([]));
    }
  }, []);

  // 2. Auth State Changed and Firestore synchronization
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        setIsAuthLoading(true);
        try {
          await signInAnonymously(auth);
          setSyncError(null);
        } catch (err: any) {
          console.error('Error signing in anonymously:', err);
          setIsAuthLoading(false);
          setSyncError('No se pudo iniciar la sesión de base de datos de forma anónima. Asegúrese de activar el proveedor "Anónimo" en la consola de Firebase Authentication.');
        }
        return;
      }

      setUser(currentUser);
      setIsAuthLoading(false);
      
      if (currentUser) {
        try {
          setIsSyncing(true);
          // Only clear syncError if we successfully logged in and will now try syncing
          setSyncError(null);

          // Sync Global Config
          let configExists = false;
          try {
            const configDocRef = doc(db, 'config_general', WORKSPACE_ID);
            const configSnap = await getDoc(configDocRef);
            if (configSnap.exists()) {
              configExists = true;
              const cloudConfig = configSnap.data() as ConfigGeneral;
              setConfig(cloudConfig);
              try {
                localStorage.setItem('remax_hr_config', JSON.stringify(cloudConfig));
              } catch (e) {
                console.warn('LocalStorage is blocked or full:', e);
              }
            } else {
              // Upload local config
              let localConf = DEFAULT_CONFIG;
              try {
                const localConfigStr = localStorage.getItem('remax_hr_config');
                if (localConfigStr) localConf = JSON.parse(localConfigStr);
              } catch (e) {
                console.warn('LocalStorage error:', e);
              }
              await setDoc(configDocRef, { ...localConf, ownerId: WORKSPACE_ID });
            }
          } catch (err: any) {
            console.error('Error syncing config_general, using fallback:', err);
            let localConf = DEFAULT_CONFIG;
            try {
              const localConfig = localStorage.getItem('remax_hr_config');
              if (localConfig) localConf = JSON.parse(localConfig);
            } catch (e) {
              console.warn('LocalStorage error:', e);
            }
            setConfig(localConf);
            setSyncError(`Error al sincronizar configuración con Firestore: ${err.message || err}. Usando copia local.`);
          }

          // Sync Assistants
          try {
            const qAs = query(collection(db, 'asistentes'), where('ownerId', '==', WORKSPACE_ID));
            const asSnap = await getDocs(qAs);
            const cloudAsList: Asistente[] = [];
            asSnap.forEach((docSnap) => {
              cloudAsList.push(docSnap.data() as Asistente);
            });

            if (cloudAsList.length > 0 || configExists) {
              setAsistentes(cloudAsList);
              try {
                localStorage.setItem('remax_hr_asistentes', JSON.stringify(cloudAsList));
              } catch (e) {
                console.warn('LocalStorage error:', e);
              }
            } else {
              // Seed cloud database
              let localAsList = PRESET_ASISTENTES;
              try {
                const localAsStr = localStorage.getItem('remax_hr_asistentes');
                if (localAsStr) localAsList = JSON.parse(localAsStr);
              } catch (e) {
                console.warn('LocalStorage error:', e);
              }
              const batch = writeBatch(db);
              localAsList.forEach((as: Asistente) => {
                const docRef = doc(db, 'asistentes', as.id);
                batch.set(docRef, { ...as, ownerId: WORKSPACE_ID });
              });
              await batch.commit();
              setAsistentes(localAsList);
              try {
                localStorage.setItem('remax_hr_asistentes', JSON.stringify(localAsList));
              } catch (e) {
                console.warn('LocalStorage error:', e);
              }
            }
          } catch (err) {
            console.error('Error syncing asistentes, using fallback:', err);
            let localAs = PRESET_ASISTENTES;
            try {
              const localAsStr = localStorage.getItem('remax_hr_asistentes');
              if (localAsStr) localAs = JSON.parse(localAsStr);
            } catch (e) {
              console.warn('LocalStorage error:', e);
            }
            setAsistentes(localAs);
          }

          // Sync Appointments (Citas)
          try {
            const qCitas = query(collection(db, 'citas'), where('ownerId', '==', WORKSPACE_ID));
            const citasSnap = await getDocs(qCitas);
            const cloudCitasList: Cita[] = [];
            citasSnap.forEach((docSnap) => {
              cloudCitasList.push(docSnap.data() as Cita);
            });

            if (cloudCitasList.length > 0 || configExists) {
              setCitas(cloudCitasList);
              try {
                localStorage.setItem('remax_hr_citas', JSON.stringify(cloudCitasList));
              } catch (e) {
                console.warn('LocalStorage error:', e);
              }
            } else {
              // Seed cloud database
              let localCitasList = getPresetCitas();
              try {
                const localCitasStr = localStorage.getItem('remax_hr_citas');
                if (localCitasStr) localCitasList = JSON.parse(localCitasStr);
              } catch (e) {
                console.warn('LocalStorage error:', e);
              }
              const batch = writeBatch(db);
              localCitasList.forEach((c: Cita) => {
                const docRef = doc(db, 'citas', c.id);
                batch.set(docRef, { ...c, ownerId: WORKSPACE_ID });
              });
              await batch.commit();
              setCitas(localCitasList);
              try {
                localStorage.setItem('remax_hr_citas', JSON.stringify(localCitasList));
              } catch (e) {
                console.warn('LocalStorage error:', e);
              }
            }
          } catch (err) {
            console.error('Error syncing citas, using fallback:', err);
            let localCitas = getPresetCitas();
            try {
              const localCitasStr = localStorage.getItem('remax_hr_citas');
              if (localCitasStr) localCitas = JSON.parse(localCitasStr);
            } catch (e) {
              console.warn('LocalStorage error:', e);
            }
            setCitas(localCitas);
          }

          // Sync Liquidaciones
          try {
            const qLiq = query(collection(db, 'liquidaciones'), where('ownerId', '==', WORKSPACE_ID));
            const liqSnap = await getDocs(qLiq);
            const cloudLiqList: LiquidacionMensual[] = [];
            liqSnap.forEach((docSnap) => {
              cloudLiqList.push(docSnap.data() as LiquidacionMensual);
            });
            setLiquidaciones(cloudLiqList);
            try {
              localStorage.setItem('remax_hr_liquidaciones', JSON.stringify(cloudLiqList));
            } catch (e) {
              console.warn('LocalStorage error:', e);
            }
          } catch (err) {
            console.error('Error syncing liquidaciones, using fallback:', err);
            let localLiq: LiquidacionMensual[] = [];
            try {
              const localLiqStr = localStorage.getItem('remax_hr_liquidaciones');
              if (localLiqStr) localLiq = JSON.parse(localLiqStr);
            } catch (e) {
              console.warn('LocalStorage error:', e);
            }
            setLiquidaciones(localLiq);
          }

          // Sync Audit Logs
          try {
            const qAudit = query(collection(db, 'audit_logs'), where('ownerId', '==', WORKSPACE_ID));
            const auditSnap = await getDocs(qAudit);
            const cloudAuditList: AuditLog[] = [];
            auditSnap.forEach((docSnap) => {
              cloudAuditList.push(docSnap.data() as AuditLog);
            });
            cloudAuditList.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
            setAuditLogs(cloudAuditList);
            try {
              localStorage.setItem('remax_hr_audit_logs', JSON.stringify(cloudAuditList));
            } catch (e) {
              console.warn('LocalStorage error:', e);
            }
          } catch (err) {
            console.error('Error syncing audit_logs, using fallback:', err);
            let localAudit: AuditLog[] = [];
            try {
              const localAuditStr = localStorage.getItem('remax_hr_audit_logs');
              if (localAuditStr) localAudit = JSON.parse(localAuditStr);
            } catch (e) {
              console.warn('LocalStorage error:', e);
            }
            setAuditLogs(localAudit);
          }
        } finally {
          setIsSyncing(false);
        }
      } else {
        // Fallback local storage
        try {
          const localAs = localStorage.getItem('remax_hr_asistentes');
          if (localAs) setAsistentes(JSON.parse(localAs));
          const localCitas = localStorage.getItem('remax_hr_citas');
          if (localCitas) setCitas(JSON.parse(localCitas));
          const localConfig = localStorage.getItem('remax_hr_config');
          if (localConfig) setConfig(JSON.parse(localConfig));
          const localLiq = localStorage.getItem('remax_hr_liquidaciones');
          if (localLiq) setLiquidaciones(JSON.parse(localLiq));
          const localAudit = localStorage.getItem('remax_hr_audit_logs');
          if (localAudit) setAuditLogs(JSON.parse(localAudit));
        } catch (e) {
          console.warn('LocalStorage fallback error:', e);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Sync state helpers
  const saveAndSyncAsistentes = (newAsistentes: Asistente[]) => {
    setAsistentes(newAsistentes);
    localStorage.setItem('remax_hr_asistentes', JSON.stringify(newAsistentes));
  };

  const saveAndSyncCitas = (newCitas: Cita[]) => {
    setCitas(newCitas);
    localStorage.setItem('remax_hr_citas', JSON.stringify(newCitas));
  };

  const saveAndSyncConfig = (newConfig: ConfigGeneral) => {
    setConfig(newConfig);
    localStorage.setItem('remax_hr_config', JSON.stringify(newConfig));
  };

  const saveAndSyncLiquidaciones = (newLiquidaciones: LiquidacionMensual[]) => {
    setLiquidaciones(newLiquidaciones);
    localStorage.setItem('remax_hr_liquidaciones', JSON.stringify(newLiquidaciones));
  };

  const saveAndSyncAuditLogs = (newAuditLogs: AuditLog[]) => {
    setAuditLogs(newAuditLogs);
    localStorage.setItem('remax_hr_audit_logs', JSON.stringify(newAuditLogs));
  };

  const handleUpdateLiquidacion = async (liq: LiquidacionMensual) => {
    const originalLiq = liquidaciones.find(item => item.id === liq.id);
    const updated = liquidaciones.map(item => item.id === liq.id ? liq : item);
    saveAndSyncLiquidaciones(updated);

    let newAuditRecord: AuditLog | null = null;
    const userDisplay = auth.currentUser?.email || (userRole === 'admin' ? 'Oscar Russo (Admin)' : 'Asistente');

    if (originalLiq) {
      if (originalLiq.reciboHonorariosEntregado !== liq.reciboHonorariosEntregado) {
        const auditId = `audit-${Date.now()}`;
        const actionDesc = liq.reciboHonorariosEntregado ? 'Entregado' : 'Pendiente';
        newAuditRecord = {
          id: auditId,
          action: 'ENTREGA_RHE',
          timestamp: new Date().toISOString(),
          details: `Se cambió estado de RHe Fin de Mes a "${actionDesc}" para ${liq.asistenteNombre} - Periodo ${liq.mes}`,
          usuario: userDisplay,
          asistenteNombre: liq.asistenteNombre,
          mes: liq.mes,
          monto: liq.montoTotal
        };
      } else if (originalLiq.reciboAdelantoEntregado !== liq.reciboAdelantoEntregado) {
        const auditId = `audit-${Date.now()}`;
        const actionDesc = liq.reciboAdelantoEntregado ? 'Entregado' : 'Pendiente';
        newAuditRecord = {
          id: auditId,
          action: 'ENTREGA_RHE',
          timestamp: new Date().toISOString(),
          details: `Se cambió estado de RHe Adelanto Quincena a "${actionDesc}" para ${liq.asistenteNombre} - Periodo ${liq.mes}`,
          usuario: userDisplay,
          asistenteNombre: liq.asistenteNombre,
          mes: liq.mes,
          monto: liq.montoAdelantoQuincena || 0
        };
      }

      if (newAuditRecord) {
        saveAndSyncAuditLogs([newAuditRecord, ...auditLogs]);
      }
    }

    if (auth.currentUser) {
      try {
        setIsSyncing(true);
        const batch = writeBatch(db);
        const docRef = doc(db, 'liquidaciones', liq.id);
        batch.set(docRef, { ...liq, ownerId: WORKSPACE_ID });
        if (newAuditRecord) {
          const auditDocRef = doc(db, 'audit_logs', newAuditRecord.id);
          batch.set(auditDocRef, { ...newAuditRecord, ownerId: WORKSPACE_ID });
        }
        await batch.commit();
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `liquidaciones/${liq.id}`);
      } finally {
        setIsSyncing(false);
      }
    }
  };

  // Google login handler
  const handleGoogleLogin = async () => {
    try {
      setIsSyncing(true);
      await signInWithPopup(auth, getGoogleProvider());
    } catch (err) {
      console.error('Google login failed:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  // Google logout handler (disconnect Google account and return to anonymous)
  const handleGoogleLogout = async () => {
    try {
      setIsSyncing(true);
      await signOut(auth);
    } catch (err) {
      console.error('Google logout failed:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  // Logout handler
  const handleLogout = async () => {
    setLogoutModalOpen(true);
  };

  // --- ACTIONS HANDLERS ---

  // 1. SAVE ASSISTANT
  const handleSaveAsistente = async (as: Asistente) => {
    const exists = asistentes.some(item => item.id === as.id);
    const updated = exists 
      ? asistentes.map(item => item.id === as.id ? as : item)
      : [as, ...asistentes];

    saveAndSyncAsistentes(updated);

    if (auth.currentUser) {
      try {
        setIsSyncing(true);
        const docRef = doc(db, 'asistentes', as.id);
        await setDoc(docRef, { ...as, ownerId: WORKSPACE_ID });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `asistentes/${as.id}`);
      } finally {
        setIsSyncing(false);
      }
    }
  };

  // 2. DELETE ASSISTANT
  const handleDeleteAsistente = async (id: string) => {
    const updated = asistentes.filter(as => as.id !== id);
    saveAndSyncAsistentes(updated);

    if (auth.currentUser) {
      try {
        setIsSyncing(true);
        const docRef = doc(db, 'asistentes', id);
        await deleteDoc(docRef);
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `asistentes/${id}`);
      } finally {
        setIsSyncing(false);
      }
    }
  };

  // 3. SAVE CITA
  const handleSaveCita = async (cita: Cita) => {
    const exists = citas.some(item => item.id === cita.id);
    const updated = exists
      ? citas.map(item => item.id === cita.id ? cita : item)
      : [cita, ...citas];

    saveAndSyncCitas(updated);

    if (auth.currentUser) {
      try {
        setIsSyncing(true);
        const docRef = doc(db, 'citas', cita.id);
        await setDoc(docRef, { ...cita, ownerId: WORKSPACE_ID });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `citas/${cita.id}`);
      } finally {
        setIsSyncing(false);
      }
    }
  };

  // 4. DELETE CITA
  const handleDeleteCita = async (id: string) => {
    const updated = citas.filter(c => c.id !== id);
    saveAndSyncCitas(updated);

    if (auth.currentUser) {
      try {
        setIsSyncing(true);
        const docRef = doc(db, 'citas', id);
        await deleteDoc(docRef);
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `citas/${id}`);
      } finally {
        setIsSyncing(false);
      }
    }
  };

  // 5. SAVE CONFIGURATION
  const handleSaveConfig = async (newConfig: ConfigGeneral) => {
    saveAndSyncConfig(newConfig);

    if (auth.currentUser) {
      try {
        setIsSyncing(true);
        const docRef = doc(db, 'config_general', WORKSPACE_ID);
        await setDoc(docRef, { ...newConfig, ownerId: WORKSPACE_ID });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `config_general/${WORKSPACE_ID}`);
      } finally {
        setIsSyncing(false);
      }
    }
  };

  // 6. LIQUIDATE CITAS (PLANILLA MONTH CLOSE)
  const handleLiquidateCitas = async (
    asistenteId: string,
    mes: string,
    citasIdsToLiquidate: string[],
    sueldo: number,
    bonos: number,
    montoAdelanto?: number,
    reciboAdelantoEntregado?: boolean
  ) => {
    const valAdelanto = montoAdelanto || 0;
    const valReciboAdelanto = !!reciboAdelantoEntregado;

    // 1. Update matching citas statuses locally
    const updatedCitas = citas.map(c => {
      if (citasIdsToLiquidate.includes(c.id)) {
        return {
          ...c,
          estadoCierre: EstadoCierre.LIQUIDADO
        };
      }
      return c;
    });

    saveAndSyncCitas(updatedCitas);

    // 2. Generate liquidation object
    const liqId = `liq-${asistenteId}-${mes}`;
    const targetAsistente = asistentes.find(as => as.id === asistenteId);
    
    const logRecord: LiquidacionMensual = {
      id: liqId,
      asistenteId,
      asistenteNombre: targetAsistente?.nombreCompleto || 'Colaborador',
      mes,
      sueldoBasico: sueldo,
      totalBonos: bonos,
      montoAdelantoQuincena: valAdelanto,
      reciboAdelantoEntregado: valReciboAdelanto,
      montoTotal: sueldo + bonos - valAdelanto,
      fechaPago: new Date().toISOString().split('T')[0],
      estado: 'PAGADO',
      citasLiquidadasIds: citasIdsToLiquidate,
      banco: targetAsistente?.banco || '--',
      numeroCuenta: targetAsistente?.numeroCuenta || '--',
      cci: targetAsistente?.cci || '--',
      reciboHonorariosEntregado: false
    };

    const updatedLiqs = [logRecord, ...liquidaciones.filter(l => l.id !== liqId)];
    saveAndSyncLiquidaciones(updatedLiqs);

    // Create Audit Log record for liquidating appointments
    const auditId = `audit-${Date.now()}`;
    const userDisplay = auth.currentUser?.email || (userRole === 'admin' ? 'Oscar Russo (Admin)' : 'Asistente');
    const newAuditRecord: AuditLog = {
      id: auditId,
      action: 'LIQUIDAR_CITAS',
      timestamp: new Date().toISOString(),
      details: `Se liquidó la planilla de ${targetAsistente?.nombreCompleto || 'Colaborador'} para el periodo ${mes} por un total neto de S/. ${(sueldo + bonos - valAdelanto).toFixed(2)} (RMV: S/. ${sueldo.toFixed(2)}, Bonos: S/. ${bonos.toFixed(2)}, Adelanto: S/. ${valAdelanto.toFixed(2)})`,
      usuario: userDisplay,
      asistenteNombre: targetAsistente?.nombreCompleto || 'Colaborador',
      mes,
      monto: sueldo + bonos - valAdelanto
    };

    const updatedAudits = [newAuditRecord, ...auditLogs];
    saveAndSyncAuditLogs(updatedAudits);

    // 3. Commit updates to Firestore safely
    if (auth.currentUser) {
      try {
        setIsSyncing(true);
        const batch = writeBatch(db);
        
        citasIdsToLiquidate.forEach(id => {
          const matchingCita = updatedCitas.find(c => c.id === id);
          if (matchingCita) {
            const docRef = doc(db, 'citas', id);
            batch.set(docRef, { ...matchingCita, ownerId: WORKSPACE_ID });
          }
        });

        const liqDocRef = doc(db, 'liquidaciones', liqId);
        batch.set(liqDocRef, { ...logRecord, ownerId: WORKSPACE_ID });

        const auditDocRef = doc(db, 'audit_logs', auditId);
        batch.set(auditDocRef, { ...newAuditRecord, ownerId: WORKSPACE_ID });

        await batch.commit();

      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, 'citas/batch-liquidate');
      } finally {
        setIsSyncing(false);
      }
    }
  };

  // Delete Liquidacion record and revert associated citations to CERRADO
  const handleDeleteLiquidacion = async (liqId: string) => {
    const liqToDelete = liquidaciones.find(l => l.id === liqId);
    if (!liqToDelete) return;

    // 1. Revert matching citas to CERRADO (so they aren't locked in LIQUIDADO)
    const updatedCitas = citas.map(c => {
      if (liqToDelete.citasLiquidadasIds.includes(c.id)) {
        return {
          ...c,
          estadoCierre: EstadoCierre.CERRADO
        };
      }
      return c;
    });
    saveAndSyncCitas(updatedCitas);

    // 2. Remove liquidation
    const updatedLiqs = liquidaciones.filter(l => l.id !== liqId);
    saveAndSyncLiquidaciones(updatedLiqs);

    // 3. Create Audit Log for deletion
    const auditId = `audit-${Date.now()}`;
    const userDisplay = auth.currentUser?.email || (userRole === 'admin' ? 'Oscar Russo (Admin)' : 'Asistente');
    const newAuditRecord: AuditLog = {
      id: auditId,
      action: 'ENTREGA_RHE',
      timestamp: new Date().toISOString(),
      details: `Se ELIMINÓ la liquidación de ${liqToDelete.asistenteNombre} del periodo ${liqToDelete.mes} (S/. ${liqToDelete.montoTotal.toFixed(2)}). Citas asociadas reabiertas.`,
      usuario: userDisplay,
      asistenteNombre: liqToDelete.asistenteNombre,
      mes: liqToDelete.mes,
      monto: liqToDelete.montoTotal
    };
    saveAndSyncAuditLogs([newAuditRecord, ...auditLogs]);

    // 4. Update in Firestore
    if (auth.currentUser) {
      try {
        setIsSyncing(true);
        const batch = writeBatch(db);

        // Delete liquidation
        const liqDocRef = doc(db, 'liquidaciones', liqId);
        batch.delete(liqDocRef);

        // Update each reverted cita
        liqToDelete.citasLiquidadasIds.forEach(id => {
          const matchingCita = updatedCitas.find(c => c.id === id);
          if (matchingCita) {
            const docRef = doc(db, 'citas', id);
            batch.set(docRef, { ...matchingCita, ownerId: WORKSPACE_ID });
          }
        });

        // Save audit log
        const auditDocRef = doc(db, 'audit_logs', auditId);
        batch.set(auditDocRef, { ...newAuditRecord, ownerId: WORKSPACE_ID });

        await batch.commit();
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `liquidaciones/${liqId}`);
      } finally {
        setIsSyncing(false);
      }
    }
  };

  const handleLockRole = () => {
    setUserRole(null);
    sessionStorage.removeItem('remax_user_role');
    setActiveTab('dashboard');
  };

  if (!userRole) {
    return (
      <LockScreen 
        config={config}
        onUnlock={(role, profileName) => {
          setUserRole(role);
          sessionStorage.setItem('remax_user_role', role);
          if (profileName) {
            setUnlockedProfileName(profileName);
            sessionStorage.setItem('remax_profile_name', profileName);
          }
          if (role !== 'admin') {
            setActiveTab('dashboard');
          }
        }}
        user={user}
        isSyncing={isSyncing}
        cloudSyncError={syncError}
        onGoogleLogin={handleGoogleLogin}
        onGoogleLogout={handleGoogleLogout}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex flex-col justify-between" id="app_root">
      
      {/* Header & Tabs */}
      <div>
        
        {/* Top Navbar */}
        <header className="bg-navy border-b border-navy/20 shadow-md">
          <div className="w-full max-w-full px-4 sm:px-8 lg:px-12 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-primary rounded-md flex items-center justify-center shadow-md">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h1 className="text-base sm:text-lg font-bold tracking-tight text-white uppercase font-sans">
                    OSCAR RUSSO <span className="text-blue-400">| RRHH & Citas</span>
                  </h1>
                </div>
                <p className="text-[10px] text-slate-300 font-bold uppercase tracking-wider">
                  Control Operativo y Pago de Bonos de la Asistente
                </p>
              </div>
            </div>

            {/* Sync Status / Authentication */}
            {/* Header profile details */}
            <div className="flex items-center gap-3 text-xs text-slate-200">
              
              {/* Active Role status badge & Lock button */}
              <div className="flex items-center gap-2 bg-slate-850/80 border border-slate-750 py-1.5 px-3 rounded-md shadow-sm">
                <div className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center text-[10px] font-bold">
                  {(unlockedProfileName || 'O')[0].toUpperCase()}
                </div>
                <div className="flex flex-col text-left">
                  <span className="font-bold text-[10px] text-white leading-none truncate max-w-[120px]">
                    {unlockedProfileName || (userRole === 'admin' ? "Oscar Russo" : "Asistente")}
                  </span>
                  <span className="text-[8px] font-mono text-blue-400 flex items-center gap-0.5 mt-0.5 font-bold uppercase tracking-wider">
                    <Cloud className="w-2.5 h-2.5 text-emerald-400" />
                    {isSyncing ? "Sincronizando..." : "Nube Activa"}
                  </span>
                </div>
                
                <span className={`ml-2 px-1.5 py-0.5 rounded font-mono text-[8px] uppercase tracking-wide font-bold ${
                  userRole === 'admin' 
                    ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' 
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                }`}>
                  {userRole === 'admin' ? 'Admin' : 'Asistente'}
                </span>

                <button
                  onClick={handleLogout}
                  title="Cerrar sesión de perfil"
                  className="ml-2 text-[9px] font-bold text-slate-300 hover:text-brand-red uppercase bg-slate-700 hover:bg-slate-600 px-2 py-0.5 rounded transition-colors cursor-pointer flex items-center gap-1"
                >
                  <Lock className="w-3 h-3" />
                  <span>Salir</span>
                </button>
              </div>
            </div>

          </div>
        </header>

        {/* Navigation Tabs Bar */}
        <nav className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-40">
          <div className="w-full max-w-full px-4 sm:px-8 lg:px-12">
            <div className="flex justify-between items-center h-14">
              
              {/* Tab selectors */}
              <div className="flex space-x-1 sm:space-x-2 overflow-x-auto select-none no-scrollbar py-2">
                
                {/* 1. Dashboard Tab */}
                <button
                  type="button"
                  onClick={() => setActiveTab('dashboard')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer border ${
                    activeTab === 'dashboard'
                      ? 'bg-primary text-white border-primary shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border-transparent'
                  }`}
                  id="tab_dashboard_btn"
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  Inicio
                </button>

                {/* 2. HR Collaborators Tab */}
                {userRole === 'admin' && (
                  <button
                    type="button"
                    onClick={() => setActiveTab('asistentes')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer border ${
                      activeTab === 'asistentes'
                        ? 'bg-primary text-white border-primary shadow-sm'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border-transparent'
                    }`}
                    id="tab_asistentes_btn"
                  >
                    <Users className="w-3.5 h-3.5" />
                    Recursos Humanos
                  </button>
                )}

                {/* 3. Appointments Manager Tab */}
                <button
                  type="button"
                  onClick={() => setActiveTab('citas')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer border ${
                    activeTab === 'citas'
                      ? 'bg-primary text-white border-primary shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border-transparent'
                  }`}
                  id="tab_citas_btn"
                >
                  <Users className="w-3.5 h-3.5" />
                  Prospectos
                </button>

                {/* 4. Payroll report Tab */}
                {userRole === 'admin' && (
                  <button
                    type="button"
                    onClick={() => setActiveTab('liquidacion')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer border ${
                      activeTab === 'liquidacion'
                        ? 'bg-primary text-white border-primary shadow-sm'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border-transparent'
                    }`}
                    id="tab_reports_btn"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    Cálculo Planilla
                  </button>
                )}

                {/* 5. Config Manager Tab */}
                {userRole === 'admin' && (
                  <button
                    type="button"
                    onClick={() => setActiveTab('config')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer border ${
                      activeTab === 'config'
                        ? 'bg-primary text-white border-primary shadow-sm'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border-transparent'
                    }`}
                    id="tab_config_btn"
                  >
                    <Settings className="w-3.5 h-3.5" />
                    Configuración
                  </button>
                )}

              </div>
            </div>
          </div>
        </nav>

        {/* Main Content Render */}
        <main className="w-full max-w-full px-4 sm:px-8 lg:px-12 py-8">
          {activeTab === 'dashboard' && (
            <Dashboard 
              asistentes={asistentes}
              citas={citas}
              config={config}
              onNavigateToTab={setActiveTab}
              userRole={userRole}
            />
          )}

          {activeTab === 'asistentes' && (
            <AsistentesManager 
              asistentes={asistentes}
              citas={citas}
              config={config}
              onSaveAsistente={handleSaveAsistente}
              onDeleteAsistente={handleDeleteAsistente}
              isSyncing={isSyncing}
              userRole={userRole}
            />
          )}

          {activeTab === 'citas' && (
            <CitasManager 
              citas={citas}
              asistentes={asistentes}
              config={config}
              onSaveCita={handleSaveCita}
              onDeleteCita={handleDeleteCita}
              isSyncing={isSyncing}
              userRole={userRole}
              onSaveAsistente={handleSaveAsistente}
            />
          )}

          {activeTab === 'liquidacion' && userRole === 'admin' && (
            <ReportesLiquidacion 
              asistentes={asistentes}
              citas={citas}
              config={config}
              liquidaciones={liquidaciones}
              auditLogs={auditLogs}
              onLiquidateAppointments={handleLiquidateCitas}
              onUpdateLiquidacion={handleUpdateLiquidacion}
              onDeleteLiquidacion={handleDeleteLiquidacion}
              isSyncing={isSyncing}
            />
          )}

          {activeTab === 'config' && userRole === 'admin' && (
            <ConfigManager 
              config={config}
              onSaveConfig={handleSaveConfig}
              isSyncing={isSyncing}
            />
          )}
        </main>

      </div>

      {/* Corporate Footer */}
      <footer className="bg-navy text-white py-6 mt-12 text-xs border-t border-slate-800">
        <div className="w-full max-w-full px-4 sm:px-8 lg:px-12 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-center md:text-left space-y-1">
            <p className="text-[11px] font-semibold opacity-90">
              <strong>OSCAR RUSSO — Portal de Recursos Humanos y Citas (RUC: 10077932823)</strong> © 2026 • Lima, Perú.
            </p>
            <p className="text-[9px] text-slate-400 font-mono">
              Esquema Híbrido: Sueldo Fijo Mensual RMV (S/ {config.rmvVigente.toFixed(2)}) + Bonos Variables de Cierre (Venta: S/ {config.bonoVentaPredeterminado.toFixed(2)} | Alquiler: S/ {config.bonoAlquilerPredeterminado.toFixed(2)})
            </p>
          </div>
          <p className="text-[10px] tracking-widest uppercase font-mono font-bold opacity-75 text-center md:text-right">
            Soporte Operativo Oscar Russo
          </p>
        </div>
      </footer>

      {/* Logout Confirmation Dialog Modal */}
      {logoutModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-sm w-full border border-slate-200 shadow-xl overflow-hidden animate-fade-in">
            <div className="p-5 space-y-3">
              <div className="w-10 h-10 bg-blue-50 border border-primary/10 rounded-full flex items-center justify-center text-primary">
                <LogOut className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-800 text-sm uppercase tracking-wider">Cerrar Sesión</h4>
                <p className="text-xs text-slate-500 mt-1">
                  ¿Confirmas que deseas salir? Los datos de planilla y citas continuarán seguros en la nube.
                </p>
              </div>
            </div>
            <div className="bg-slate-50 p-4 border-t border-slate-100 flex gap-2 justify-end">
              <button
                onClick={() => setLogoutModalOpen(false)}
                className="px-3.5 py-1.5 text-xs font-bold uppercase text-slate-700 border border-slate-205 bg-white hover:bg-slate-50 rounded cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  setLogoutModalOpen(false);
                  setIsSyncing(true);
                  setTimeout(() => {
                    setUserRole(null);
                    setUnlockedProfileName('');
                    sessionStorage.removeItem('remax_user_role');
                    sessionStorage.removeItem('remax_profile_name');
                    setActiveTab('dashboard');
                    setIsSyncing(false);
                  }, 300);
                }}
                className="px-3.5 py-1.5 text-xs font-bold uppercase text-white bg-primary hover:bg-primary/95 rounded cursor-pointer"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
