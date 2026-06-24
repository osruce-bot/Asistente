# REMAX Power Expo - Sistema de Liquidación de Asistentes

Este es el sistema personalizado para **REMAX Power Expo (Lima, Perú)**, desarrollado para la gestión de asistentes inmobiliarios full-time, registro de citas de captación y liquidación automática de remuneraciones bajo el nuevo esquema de compensación híbrido permanente.

## 🚀 Características Clave

- **Dashboard de Rendimiento**: Métricas clave en tiempo real, incluyendo Citas Logradas, Citas Exitosas (anteriormente llamadas Realizadas), y Cajas de Costo Operativo.
- **Gestión de Asistentes**: Registro y control de datos bancarios de las asistentes (BCP, BBVA, Interbank, etc.) y cálculo automatizado del sueldo básico peruano (Remuneración Mínima Vital - S/ 1,130 fijos).
- **Registro de Citas (Captaciones)**: Formulario interactivo para agendar y clasificar las citas de captación de inmuebles (Venta/Alquiler), con control directo sobre el estado de la cita y el estado del cierre.
- **Módulo de Liquidación**: Generación de reportes mensuales de haberes, cálculo automatizado de bonos por captación concretada (Cerrado/Liquidado), y generación de recibos listos para exportar en **PDF** o planilla **Excel**.
- **Base de Datos Firebase**: Integración directa con Firebase (Firestore & Auth) para el almacenamiento duradero y seguro de todos los registros en la nube.

---

## 🛠️ Tecnologías Utilizadas

- **Frontend**: React 19, TypeScript, Vite.
- **Estilos**: Tailwind CSS.
- **Íconos**: Lucide React.
- **Animaciones**: Motion (framer-motion).
- **Base de Datos y Autenticación**: Firebase (Firestore, Firebase Auth con Google Sign-In).
- **Reportes**: `jspdf` (para reportes en PDF), `xlsx` (para planillas Excel).

---

## 📦 Desarrollo Local

Si deseas clonar este repositorio y ejecutarlo en tu computadora de manera local, sigue estos sencillos pasos:

1. **Clonar el repositorio**:
   ```bash
   git clone <url-de-tu-repositorio-de-github>
   cd remax-power-expo
   ```

2. **Instalar dependencias**:
   ```bash
   npm install
   ```

3. **Iniciar el servidor de desarrollo**:
   ```bash
   npm run dev
   ```
   El servidor se abrirá en `http://localhost:3000`.

4. **Compilar para producción**:
   ```bash
   npm run build
   ```
   Esto generará los archivos optimizados dentro de la carpeta `/dist`.

---

## ☁️ Despliegue en la Web Pública (Vercel)

Este proyecto está configurado como una aplicación de tipo SPA pura (Single Page Application). No requiere de un servidor backend personalizado, lo que significa que puedes desplegarlo de forma **gratuita** en Vercel en menos de 2 minutos.

Dado que las credenciales públicas de Firebase están incluidas de manera segura en `firebase-applet-config.json`, el despliegue es **Zero-Config** (no requiere configurar variables de entorno adicionales).

### Pasos para desplegar:
1. Sube el código a tu repositorio de **GitHub**.
2. Regístrate o inicia sesión en [Vercel](https://vercel.com).
3. Haz clic en **"Add New"** > **"Project"**.
4. Importa tu repositorio de GitHub.
5. Vercel detectará automáticamente que es un proyecto **Vite**.
6. Haz clic en **"Deploy"**. ¡Listo! Tu aplicación estará publicada y disponible en todo el mundo.
