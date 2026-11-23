# Tinehnemi CI/CD

Aplicación educativa móvil para el aprendizaje del náhuatl, desarrollada con React Native y Expo SDK 53.

## Requisitos

- Node.js 20.x
- npm 10 o superior
- Git
- Cuenta de Expo para compilaciones Android con EAS

## Instalación

```bash
npm ci
```

## Validación y pruebas

```bash
npm run typecheck
npm run lint
npm test
npm run test:release
npx expo-doctor
npx expo export --platform android
```

El comando `npm run check` ejecuta TypeScript, ESLint y las pruebas unitarias. El comando `npm run test:release` valida la configuración Expo/EAS, la estructura de los archivos de vocabulario y la correspondencia de los recursos de audio.

## Desarrollo

```bash
npm start
npm run android
npm run ios
npm run web
```

## Integración continua

El workflow **CI - Tinehnemi** se ejecuta en Pull Requests y pushes a `main` y `develop`. Incluye instalación reproducible con `npm ci`, TypeScript, ESLint, pruebas unitarias, Expo Doctor, validación de release y exportación Android.

## Seguridad y dependencias

- Dependabot revisa semanalmente dependencias npm y mensualmente GitHub Actions.
- El workflow **Security audit** genera un reporte de vulnerabilidades de npm en cada Pull Request y semanalmente. El reporte queda disponible como artefacto de Actions.
- No se deben guardar tokens, contraseñas ni archivos `.env` en el repositorio.

## Liberación Android con EAS

El workflow **CD - Liberación Android Tinehnemi** se ejecuta manualmente desde GitHub Actions o al publicar una etiqueta `v*`.

Configura el secreto:

**GitHub → Settings → Secrets and variables → Actions → New repository secret**

- Nombre: `EXPO_TOKEN`
- Valor: token de acceso de Expo de la cuenta propietaria del proyecto.

Perfiles disponibles:

```bash
npx eas build --platform android --profile preview
npx eas build --platform android --profile production
```

## Ramas y Pull Requests

- `main`: rama estable.
- `develop`: integración del equipo.
- Usa ramas descriptivas para cada corrección o funcionalidad.
- Abre Pull Requests y espera a que los workflows requeridos terminen correctamente.
- Revisa los cambios de dependencias y el reporte de seguridad antes de integrar.

## Pruebas automatizadas

Las pruebas unitarias usan `node:test` y se ejecutan con `npm test`. La validación de release también comprueba que cada referencia de audio del vocabulario exista en el catálogo de recursos estáticos.
