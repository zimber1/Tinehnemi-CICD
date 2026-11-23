# Tinehnemi CI/CD

Aplicación educativa móvil para el aprendizaje del náhuatl, desarrollada con React Native y Expo SDK 53.

## Requisitos

- Node.js 20.x
- npm 10 o superior
- Git
- Cuenta de Expo para generar compilaciones Android con EAS

## Instalación

```bash
npm ci
```

## Validación local

Ejecuta las verificaciones en este orden:

```bash
npm run typecheck
npm run lint
npx expo-doctor
npm run test:release
```

También puedes ejecutar las verificaciones de código juntas:

```bash
npm run check
npm run prepare:release
npm run test:release
```

## Desarrollo

```bash
npm start
npm run android
npm run ios
npm run web
```

## CI – GitHub Actions

El flujo **CI - Tinehnemi** se ejecuta en cada Pull Request hacia `main` o `develop`, y en los pushes a ambas ramas. Instala dependencias con `npm ci` y ejecuta TypeScript, ESLint, Expo Doctor, las verificaciones de release y la exportación Android.

## CD – Android con EAS

El flujo **CD - Liberación Android Tinehnemi** se ejecuta manualmente desde Actions o al publicar una etiqueta `v*`.

Configura el secreto `EXPO_TOKEN` en:

**GitHub → Settings → Secrets and variables → Actions → New repository secret**

El flujo usa el perfil `production` de `eas.json` y genera una compilación Android con EAS Build.

## Ramas y Pull Requests

- `main`: rama estable.
- `develop`: integración de cambios.
- Usa ramas descriptivas para cada corrección o funcionalidad.
- Abre Pull Requests hacia `develop` o `main` según el flujo del equipo.
- No incluyas tokens, contraseñas ni archivos `.env` en Git.

## Versiones y compilación

La configuración de Expo se encuentra en `app.json` y los perfiles de compilación en `eas.json`. Las dependencias deben instalarse desde el `package-lock.json` mediante `npm ci`.
