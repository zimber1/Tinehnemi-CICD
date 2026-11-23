# Tinehnemi CI/CD

Aplicación educativa móvil desarrollada con React Native y Expo.

Este repositorio contiene el código fuente, validaciones automatizadas y flujos de CI/CD mediante GitHub Actions. La liberación Android se realiza con Expo Application Services (EAS).

## Requisitos

- Node.js 20.x
- npm
- Git
- Cuenta de Expo con acceso al proyecto EAS

## Validación local

```bash
npm ci
npm run check
npm run prepare:release
npm run test:release
```

## CI/CD

- `CI - Tinehnemi`: validaciones automáticas en Pull Requests y pushes a `main`/`develop`.
- `CD - Liberación Android Tinehnemi`: construcción Android mediante EAS. Requiere `EXPO_TOKEN` en GitHub Actions.

No guardar tokens ni credenciales dentro del repositorio.