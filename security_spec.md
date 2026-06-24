# Security Specification: RE/MAX Power Expo Compensation Portal

## 1. Data Invariants

Our application stores resources related to assistant management, appointments, compensation configurations, and payment liquidations. The following security invariants must always hold:

1.  **Identity Bond**: Any newly registered assistant (`asistentes`), appointment (`citas`), configuration (`config_general`), or payment payroll (`liquidaciones`) must possess a creator identifier (`ownerId`) that strictly matches the authenticated Firebase User ID (`request.auth.uid`).
2.  **Resource Ownership**: Read, write, and delete operations on all collections are strictly restricted to the authenticated user who created them (the `ownerId`).
3.  **Positive Financial values**: The `sueldoBasico` in `asistentes` and `liquidaciones`, the `montoBono` in `citas` and the configuration variables (`rmvVigente`, `bonoVentaPredeterminado`, `bonoAlquilerPredeterminado`) in `config_general` must be non-negative values.
4.  **Operational boundaries**: The `tipoOperacion` in `citas` must strictly be either "VENTA" or "ALQUILER".
5.  **Cita Execution states**: The `estadoCita` in `citas` must be one of "AGENDADA", "REALIZADA", or "CANCELADA".
6.  **Cierre states**: The `estadoCierre` in `citas` must be one of "PENDIENTE", "EN_SEGUIMIENTO", "DESCARTADO", "CERRADO", or "LIQUIDADO".
7.  **Format Constraints**: Text keys must remain within safe size limitations to defend against "Denial of Wallet" resource exhaustion attacks (e.g. document IDs <= 128 characters, notes <= 2000 characters).

---

## 2. The "Dirty Dozen" Security Violations (Vulnerability Payloads)

Our deployed security rules mathematically prevent all of the following:

### Payload 1: Identity Spoofing (Attacker tries to register an Assistant with a fake ownerId)
- Path: `/asistentes/malicious_asistente_1`
- Payload: `{"id": "malicious_asistente_1", "nombreCompleto": "Carlos Ruiz", "dni": "70258149", "celular": "984512365", "correo": "carlos@remax.pe", "banco": "BCP", "tipoCuenta": "Soles", "numeroCuenta": "191-23423", "cci": "002-34234", "fechaIngreso": "2026-01-01", "cargo": "Asistente", "sueldoBasico": 1130, "activo": true, "ownerId": "attacker_fake_uid"}`
- Expectation: `PERMISSION_DENIED` since `ownerId` must equal `request.auth.uid`.

### Payload 2: Massive Notes Injection on Citas (Resource exhaustion attempt)
- Path: `/citas/malicious_cita_2`
- Payload: `{"id": "malicious_cita_2", "asistenteId": "as-1", "asistenteNombre": "Maria", "fechaCita": "2026-06-24", "horaCita": "10:00", "clienteNombre": "A", "clienteCelular": "999", "direccionPropiedad": "Calle A", "tipoPropiedad": "Casa", "tipoOperacion": "VENTA", "estadoCita": "AGENDADA", "estadoCierre": "PENDIENTE", "montoBono": 150, "ownerId": "real_user_uid", "notas": "A".repeat(5000)}`
- Expectation: `PERMISSION_DENIED` due to notes exceeding 2000 characters.

### Payload 3: Invalid Operation Type Enum Bypass
- Path: `/citas/malicious_cita_3`
- Payload: `{"id": "malicious_cita_3", ..., "tipoOperacion": "SUBLEASE", "ownerId": "real_user_uid"}`
- Expectation: `PERMISSION_DENIED` since operation type must be either `"VENTA"` or `"ALQUILER"`.

### Payload 4: Invalid Appointment Status Enum Transition
- Path: `/citas/malicious_cita_4`
- Payload: `{"id": "malicious_cita_4", ..., "estadoCita": "FINISHED", "ownerId": "real_user_uid"}`
- Expectation: `PERMISSION_DENIED` since status must be `"AGENDADA"`, `"REALIZADA"`, or `"CANCELADA"`.

### Payload 5: Negative Compensation Configurations
- Path: `/config_general/global`
- Payload: `{"rmvVigente": -50, "bonoVentaPredeterminado": 150, "bonoAlquilerPredeterminado": 80, "ownerId": "real_user_uid"}`
- Expectation: `PERMISSION_DENIED` because compensation values must be non-negative.

### Payload 6: Anonymous Write Attempt
- Context: Client is not authenticated.
- Expectation: `PERMISSION_DENIED` since standard write actions require `isSignedIn()`.

### Payload 7: Cross-User Resource Deletion
- Context: Authenticated user A tries to delete user B's records in `/citas` or `/asistentes`.
- Expectation: `PERMISSION_DENIED` because delete actions verify ownership (`existing().ownerId == request.auth.uid`).

### Payload 8: Ghost Field Injection ("Shadow Update Test")
- Context: User attempts to inject metadata variables or fields not mapped inside `firebase-blueprint.json` (e.g. `isAdminPrivilege: true`).
- Expectation: `PERMISSION_DENIED` because of strict key size and structure validations.

### Payload 9: Invalid Cierre Status Enum Bypass
- Path: `/citas/malicious_cita_9`
- Payload: `{"id": "malicious_cita_9", ..., "estadoCierre": "WAITING_PAYMENT", "ownerId": "real_user_uid"}`
- Expectation: `PERMISSION_DENIED` since closure status must be valid.

### Payload 10: Modifying Immutable Creator Fields (Immortality check)
- Context: User tries to change `ownerId` on an existing record.
- Expectation: `PERMISSION_DENIED`.

### Payload 11: Invalid List/Array Types on Liquidaciones
- Path: `/liquidaciones/malicious_liq_11`
- Payload: `{"id": "malicious_liq_11", ..., "citasLiquidadasIds": [123, 456], "ownerId": "real_user_uid"}`
- Expectation: `PERMISSION_DENIED` because list contents must be strings.

### Payload 12: Missing Required Field on Creation
- Context: User attempts to register an assistant without account details (`numeroCuenta`).
- Expectation: `PERMISSION_DENIED`.
