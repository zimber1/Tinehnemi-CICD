# Entrega: flujo de liberación y despliegue continuo de Tinehnemi

**Proyecto:** Tinehnemi – aplicación móvil para el aprendizaje del náhuatl  
**Repositorio:** https://github.com/zimber1/Tinehnemi-CICD  
**Rama de entrega:** `main`  
**Versión de la aplicación:** 1.0.0  
**Stack:** Expo SDK 53, React Native 0.79, React 19 y TypeScript 5.8  
**Fecha de elaboración:** 23 de noviembre de 2026

## 1. Caso de estudio

Tinehnemi es una aplicación móvil educativa orientada al aprendizaje del náhuatl. Integra contenidos de vocabulario organizados por categorías y recursos de audio para apoyar la pronunciación y el aprendizaje autónomo. La aplicación utiliza Expo y React Native, con Expo Router para la navegación y almacenamiento local mediante AsyncStorage.

El reto operativo consiste en entregar cambios de forma controlada, detectar errores antes de integrar código a la rama estable y generar una compilación Android reproducible. Para ello se configuró un flujo CI/CD en GitHub Actions, con Expo Application Services (EAS) como plataforma de compilación Android.

## 2. Justificación del flujo de trabajo (pipeline)

Se eligió GitHub Actions porque el código fuente ya está alojado en GitHub y los workflows pueden ejecutarse ante eventos del repositorio sin incorporar otro servidor de integración. EAS Build se utiliza para compilar la aplicación Android en infraestructura administrada por Expo, evitando depender de un entorno Android local para la compilación de entrega.

El pipeline se divide en tres responsabilidades:

1. **Integración continua (CI):** se activa en Pull Requests y pushes a `main` y `develop`. Instala dependencias desde el lockfile y ejecuta TypeScript, ESLint, pruebas unitarias, Expo Doctor, validaciones específicas de liberación y exportación Android. Su propósito es detectar defectos antes de integrar.
2. **Auditoría de seguridad:** se activa en Pull Requests, semanalmente y manualmente. Genera un reporte de `npm audit` y lo conserva como artefacto de GitHub Actions durante 14 días.
3. **Entrega/compilación continua (CD):** se activa manualmente desde Actions o al publicar una etiqueta `v*`. Verifica el secreto `EXPO_TOKEN`, prepara EAS, vuelve a validar el proyecto y solicita una compilación Android con el perfil `production`.

Este diseño separa la validación frecuente del código de la generación explícita de una versión de producción. Reduce el riesgo de publicar código que no haya pasado las comprobaciones y mantiene las credenciales fuera del repositorio.

### 2.1 Flujo de CI

```text
Push / Pull Request (main o develop)
                 |
           Checkout del código
                 |
          Configurar Node.js 20
                 |
               npm ci
                 |
       TypeScript -> ESLint -> Tests
                 |
             Expo Doctor
                 |
         Validación de release
                 |
        Exportación Android (Expo)
                 |
          Resultado de GitHub Actions
```

### 2.2 Flujo de CD Android

```text
Ejecución manual o etiqueta v*
                 |
           Checkout del código
                 |
          Configurar Node.js 20
                 |
               npm ci
                 |
        Verificar EXPO_TOKEN
                 |
       Configurar Expo y EAS CLI
                 |
   check + test:release + Expo Doctor
                 |
     EAS Build Android (production)
                 |
        Resultado/enlace de EAS Build
```

La configuración actual genera una compilación Android de producción en EAS. La publicación en Google Play no está automatizada por el workflow actual: el archivo `eas.json` contiene un bloque `submit.production` vacío y el workflow termina en `eas build`.

## 3. Entorno requerido para liberación y despliegue continuo

### 3.1 Entorno de desarrollo

- Git para control de versiones.
- Node.js 20.x.
- npm 10 o superior.
- Dependencias instaladas con `npm ci`.
- Editor compatible con TypeScript.
- Cuenta de GitHub con acceso al repositorio.

### 3.2 Entorno de CI

- Runner hospedado `ubuntu-latest` de GitHub Actions.
- Node.js 20 configurado mediante `actions/setup-node@v5`.
- Caché de npm habilitada.
- Instalación reproducible mediante `npm ci`.
- Permiso mínimo declarado: `contents: read`.
- Workflows ubicados en `.github/workflows/`.

### 3.3 Entorno de compilación Android

- Cuenta y proyecto de Expo vinculados a EAS.
- EAS CLI versión compatible con `>=16.17.4`.
- Secreto de repositorio `EXPO_TOKEN` configurado en GitHub Actions.
- Identificador Android: `com.j3vm.Tinehnemi`.
- Proyecto EAS: `e78d1a29-2d50-498f-9da0-a0da184c2b51`.
- Perfil `production` de EAS con incremento automático de versión.

El secreto se configura en **GitHub → Settings → Secrets and variables → Actions → New repository secret**. Su valor es el token de acceso de Expo; nunca debe incluirse en archivos versionados ni en logs.

## 4. Niveles de servicio acordados (SLO propuestos)

No se encontró un acuerdo operativo formal previo con métricas históricas. Para esta entrega se proponen los siguientes objetivos académicos iniciales, que deberán aprobarse con el responsable del proyecto antes de considerarse compromisos de producción.

| Indicador | Objetivo propuesto | Ventana / medición |
|---|---:|---|
| Disponibilidad de la aplicación | ≥ 99.5% mensual | Sondeo de disponibilidad o telemetría de sesiones |
| Éxito de inicio de la aplicación | ≥ 99% | Sesiones iniciadas sin cierre inesperado |
| Tasa de sesiones sin fallos | ≥ 99% | Sesiones sin crash / sesiones totales |
| Tiempo de respuesta de navegación local | p95 ≤ 2 s | Medición en dispositivos de referencia |
| Duración de pipeline CI | ≤ 10 min en p90 | GitHub Actions |
| Tiempo de compilación Android EAS | ≤ 30 min en p90 | Historial de EAS Build |
| Atención de incidente crítico | ≤ 1 h para iniciar diagnóstico | Registro de incidencias |
| Recuperación de incidente crítico | ≤ 8 h como objetivo inicial | Registro de incidencias |

Los objetivos de disponibilidad y rendimiento de la aplicación requieren instrumentación en la aplicación y pruebas sobre dispositivos reales. GitHub Actions y EAS proporcionan métricas del proceso de entrega, pero no miden por sí solos la experiencia de uso en producción.

## 5. Métricas para monitoreo de la aplicación y del pipeline

### 5.1 Aplicación móvil

| Métrica | Definición | Uso |
|---|---|---|
| Tasa de fallos (crash-free sessions) | Sesiones sin crash / sesiones totales × 100 | Estabilidad |
| Tasa de errores no fatales | Errores no fatales por cada 1,000 sesiones | Detectar fallos funcionales |
| Tiempo de inicio | Tiempo desde apertura hasta pantalla utilizable | Rendimiento percibido |
| Tiempo de navegación | Duración de transición entre pantallas | Experiencia de usuario |
| Errores de audio | Reproducciones fallidas / intentos de reproducción | Calidad del contenido multimedia |
| Uso offline | Sesiones o acciones realizadas sin conectividad | Validar disponibilidad local |
| Uso de memoria | Memoria consumida durante escenarios de uso | Detectar degradación o cierres |

La versión actual del repositorio no declara una plataforma de observabilidad de producción. Estas métricas son una propuesta de instrumentación; no deben reportarse como mediciones ya disponibles.

### 5.2 Pipeline y liberaciones

- Duración total de cada workflow y duración por job.
- Porcentaje de ejecuciones exitosas y fallidas.
- Frecuencia de despliegues/compilaciones.
- Tiempo desde merge hasta artefacto Android disponible.
- Tasa de fallos de compilación.
- Vulnerabilidades reportadas por `npm audit`, clasificadas por severidad.
- Número de pruebas ejecutadas, aprobadas y fallidas.

Fuentes actuales: pestaña **Actions** del repositorio, artefacto `npm-security-audit` y panel de compilaciones de EAS.

## 6. Parámetros de configuración de las herramientas

| Herramienta | Parámetro | Configuración |
|---|---|---|
| GitHub Actions | Runner CI/CD | `ubuntu-latest` |
| GitHub Actions | Eventos CI | `pull_request` y `push` en `main`, `develop` |
| GitHub Actions | Concurrencia CI | Grupo por workflow y ref; cancela ejecución anterior |
| actions/checkout | Versión | `v5` |
| actions/setup-node | Versión | `v5` |
| Node.js | Versión CI/CD | `20` |
| npm | Instalación | `npm ci` |
| Expo | SDK | `~53.0.27` |
| React Native | Versión | `0.79.6` |
| React | Versión | `19.0.0` |
| TypeScript | Versión | `~5.8.3` |
| EAS CLI | Versión mínima | `>=16.17.4` |
| EAS | Fuente de versión | `remote` |
| EAS preview | Distribución | `internal` |
| EAS production | Incremento | `autoIncrement: true` |
| Android | Application ID | `com.j3vm.Tinehnemi` |
| Expo | Plugin de audio | `expo-audio` |
| Security audit | Frecuencia | Lunes, 08:30 UTC; PR y ejecución manual |
| Security audit | Retención | 14 días |

### 6.1 Scripts npm

| Script | Función |
|---|---|
| `npm run typecheck` | Ejecuta TypeScript sin emitir archivos |
| `npm run lint` | Ejecuta ESLint mediante Expo |
| `npm test` | Ejecuta pruebas con `node --test` |
| `npm run check` | Ejecuta typecheck, lint y pruebas unitarias |
| `npm run prepare:release` | Ejecuta Expo Doctor |
| `npm run test:release` | Ejecuta el validador de configuración, vocabulario y audio |
| `npm run eas:build:preview` | Compila Android con perfil preview |
| `npm run eas:build:production` | Compila Android con perfil production |

## 7. Herramienta de liberación continua vinculada al entorno

La herramienta seleccionada es **GitHub Actions**, vinculada al entorno de compilación **Expo EAS Build**. La relación se establece mediante el workflow `.github/workflows/cd-android.yml`, el proyecto EAS indicado en `app.json` y el secreto `EXPO_TOKEN`.

El workflow:
1. Obtiene el código del repositorio.
2. Configura Node.js 20 e instala dependencias.
3. Comprueba que exista `EXPO_TOKEN`.
4. Configura EAS mediante `expo/expo-github-action@v8`.
5. Ejecuta validaciones.
6. Lanza `eas build --platform android --profile production --non-interactive`.

**Estado:** workflow y vinculación de proyecto configurados en código. Para ejecutar la compilación real es indispensable que el administrador agregue `EXPO_TOKEN` en los secretos del repositorio y dispare el workflow o publique una etiqueta `v*`. No se considera realizada una compilación de producción hasta contar con una ejecución EAS exitosa y su artefacto.

## 8. Scripts y archivos entregados en el repositorio

| Requisito de entrega | Archivo / ruta | Propósito |
|---|---|---|
| Scripts del pipeline | `.github/workflows/ci.yml` | Integración continua |
| Scripts del pipeline | `.github/workflows/cd-android.yml` | Compilación Android |
| Scripts del pipeline | `.github/workflows/security-audit.yml` | Auditoría de dependencias |
| Generación/preparación del entorno | `package.json` | Scripts npm y comandos de proyecto |
| Configuración de liberación | `eas.json` | Perfiles development, preview y production |
| Configuración de la aplicación | `app.json` | Identidad Android, plugins y projectId EAS |
| Pruebas de liberación | `scripts/release-validator.js` | Validación reutilizable de estructura y recursos |
| Pruebas de liberación | `scripts/validate-release.js` | Ejecución del validador |
| Pruebas automatizadas | `tests/release-validator.test.js` | Cuatro pruebas automatizadas del validador |
| Dependencias | `package-lock.json` | Instalación reproducible |
| Documentación | `README.md` | Instrucciones de instalación, validación y CD |

## 9. Evidencia de validación y estado real

Se revisó la ejecución de GitHub Actions correspondiente al commit integrado en `main` (`59cc84547c8d5381270976bf10a8484a86dc8443`).

| Comprobación | Resultado observado |
|---|---|
| Instalación `npm ci` | Correcta |
| TypeScript | Correcto |
| ESLint | Correcto |
| Pruebas unitarias | 4 de 4 aprobadas |
| Expo Doctor | 18 de 18 comprobaciones aprobadas |
| Validador de liberación | Falló por 2 referencias de audio |
| Exportación Android en CI | Omitida al fallar el paso anterior |
| Compilación Android de producción en EAS | No acreditada |
| Auditoría de dependencias | Reportó 32 vulnerabilidades: 2 bajas, 14 moderadas, 15 altas y 1 crítica |

Los dos errores concretos del validador son:
- `naturaleza_sierra.json`: referencia `tlal'li.mp3` no registrada para “Tlal-li”.
- `tiempos_verbales.json`: referencia `tetahmej.mp3` no registrada.

La auditoría de seguridad genera un informe; no corrige automáticamente las vulnerabilidades. Deben revisarse y resolverse en cambios controlados.

**Ejecución CI revisada:** https://github.com/zimber1/Tinehnemi-CICD/actions/runs/45118607446  
**Repositorio:** https://github.com/zimber1/Tinehnemi-CICD

## 10. Acciones pendientes para considerar la entrega lista para producción

1. Corregir las dos referencias de audio que hacen fallar `npm run test:release`, verificando los nombres reales de los MP3; si no existe grabación válida, dejar la referencia vacía conforme a la regla de datos del proyecto.
2. Volver a ejecutar `npm run check`, `npm run test:release` y `npx expo export --platform android`.
3. Confirmar que el workflow CI de `main` finalice en verde.
4. Configurar `EXPO_TOKEN` como secreto del repositorio.
5. Ejecutar el workflow CD y conservar el enlace/artefacto de EAS Build.
6. Probar la aplicación compilada en un dispositivo Android y registrar resultados.
7. Revisar el reporte de 32 vulnerabilidades y documentar las acciones de mitigación.
8. Aprobar formalmente los SLO propuestos y añadir instrumentación de monitoreo de la aplicación.

## 11. Conclusión

Tinehnemi cuenta con una estructura CI/CD implementada en GitHub Actions y una ruta de compilación Android definida mediante Expo EAS. El repositorio incluye scripts de validación, pruebas automatizadas, configuración de perfiles y auditoría de dependencias. La evidencia actual demuestra que varias verificaciones técnicas funcionan, pero también identifica un bloqueo real en la validación de recursos de audio y pendientes de seguridad y ejecución de EAS. Por ello, el resultado debe considerarse una entrega de pipeline configurado y parcialmente validado, no una liberación de producción ya completada.
