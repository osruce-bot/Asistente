/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Asistente {
  id: string;
  nombreCompleto: string;
  dni: string;
  celular: string;
  correo: string;
  banco: string;
  tipoCuenta: string; // Ahorros, Corriente, etc.
  numeroCuenta: string;
  cci: string; // Código de Cuenta Interbancaria
  fechaIngreso: string; // YYYY-MM-DD
  cargo: string; // Coordinadora, Asistente, etc.
  sueldoBasico: number; // Sueldo Fijo Mensual (RMV)
  activo: boolean; // Estado del colaborador (Activo/Inactivo)
  llamadasMensuales?: { [mes: string]: number }; // Registro de llamadas por mes (YYYY-MM -> cantidad)
}

export enum EstadoCita {
  AGENDADA = 'AGENDADA',
  REALIZADA = 'REALIZADA',
  CANCELADA = 'CANCELADA',
}

export enum EstadoCierre {
  PENDIENTE = 'PENDIENTE',
  EN_SEGUIMIENTO = 'EN_SEGUIMIENTO',
  DESCARTADO = 'DESCARTADO',
  CERRADO = 'CERRADO',      // Cierre concretado -> genera el bono
  LIQUIDADO = 'LIQUIDADO',  // Bono ya pagado al asistente en planilla
}

export enum TipoOperacionCita {
  VENTA = 'VENTA',
  ALQUILER = 'ALQUILER',
}

export interface Cita {
  id: string;
  asistenteId: string;
  asistenteNombre: string;
  fechaCita: string; // YYYY-MM-DD
  horaCita: string; // HH:MM
  clienteNombre: string;
  clienteCelular: string;
  direccionPropiedad: string;
  tipoPropiedad: string; // Casa, Departamento, Local Comercial, Terreno, Oficina, Otro
  tipoOperacion: TipoOperacionCita;
  estadoCita: EstadoCita;
  estadoCierre: EstadoCierre;
  fechaCierre?: string; // YYYY-MM-DD (fecha del cierre efectivo)
  montoBono: number; // Monto del bono asignado por cierre
  notas?: string;
}

export interface ConfigGeneral {
  rmvVigente: number; // Sueldo mínimo actual en Perú (S/ 1,130 por defecto)
  bonoVentaPredeterminado: number; // S/ 150 por defecto
  bonoAlquilerPredeterminado: number; // S/ 80 por defecto
  claveAdmin?: string; // Clave de acceso del Administrador (defecto: admin123)
  claveAsistente?: string; // Clave de acceso del Asistente (defecto: asistente123)
}

export interface LiquidacionMensual {
  id: string;
  asistenteId: string;
  asistenteNombre: string;
  mes: string; // YYYY-MM
  sueldoBasico: number;
  totalBonos: number;
  montoTotal: number;
  fechaPago: string; // YYYY-MM-DD
  estado: 'PENDIENTE' | 'PAGADO';
  citasLiquidadasIds: string[];
  banco: string;
  numeroCuenta: string;
  cci: string;
  reciboHonorariosEntregado?: boolean;
}

export interface AuditLog {
  id: string;
  action: 'LIQUIDAR_CITAS' | 'ENTREGA_RHE' | 'OTRO';
  timestamp: string; // ISO String
  details: string; // Description of the action taken
  usuario: string; // e.g. "Oscar Russo (Admin)"
  asistenteNombre?: string;
  mes?: string;
  monto?: number;
}
