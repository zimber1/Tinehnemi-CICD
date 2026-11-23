const fs = require('node:fs');
const path = require('node:path');

const root = process.cwd();
const errors = [];
const requiredFiles = [
  'package.json',
  'package-lock.json',
  'app.json',
  'eas.json',
  'tsconfig.json',
  'app/services/audioService.ts',
];

for (const file of requiredFiles) {
  if (!fs.existsSync(path.join(root, file))) errors.push(`Falta el archivo requerido: ${file}`);
}

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
  } catch (error) {
    errors.push(`JSON inválido en ${file}: ${error.message}`);
    return null;
  }
}

const pkg = readJson('package.json');
const lock = readJson('package-lock.json');
const app = readJson('app.json');
const eas = readJson('eas.json');

if (pkg && lock && pkg.name !== lock.name) errors.push('package.json y package-lock.json tienen nombres distintos.');
if (pkg && lock && pkg.version !== lock.version) errors.push('package.json y package-lock.json tienen versiones distintas.');
if (pkg && (!pkg.scripts?.typecheck || !pkg.scripts?.lint || !pkg.scripts?.check)) {
  errors.push('Faltan scripts de validación en package.json.');
}
if (!app?.expo?.android?.package) errors.push('Falta expo.android.package en app.json.');
if (!app?.expo?.plugins?.includes('expo-audio')) errors.push('expo-audio debe estar registrado en app.json.');
if (!eas?.build?.production || !eas?.build?.preview) errors.push('Faltan los perfiles preview y production en eas.json.');

const audioFile = path.join(root, 'app/services/audioService.ts');
if (fs.existsSync(audioFile)) {
  const source = fs.readFileSync(audioFile, 'utf8');
  const requirePattern = /require\(['"]([^'"]+\.mp3)['"]\)/g;
  let match;
  let checked = 0;
  while ((match = requirePattern.exec(source)) !== null) {
    checked += 1;
    const assetPath = path.resolve(path.dirname(audioFile), match[1]);
    if (!fs.existsSync(assetPath)) errors.push(`Recurso de audio inexistente: ${match[1]}`);
  }
  if (checked === 0) errors.push('No se encontraron recursos de audio registrados en audioService.ts.');
  console.log(`Recursos de audio revisados: ${checked}`);
}

const vocabularyDir = path.join(root, 'data/vocabulario');
if (fs.existsSync(vocabularyDir)) {
  const files = fs.readdirSync(vocabularyDir).filter(file => file.endsWith('.json'));
  for (const file of files) {
    const data = readJson(path.join('data/vocabulario', file));
    if (!data || !Array.isArray(data.palabras)) {
      errors.push(`La estructura de ${file} debe contener un arreglo "palabras".`);
    } else {
      for (const [index, word] of data.palabras.entries()) {
        if (!word.nahuatl || !word.espanol || !word.audio) {
          errors.push(`Registro incompleto en ${file}, palabra ${index + 1}.`);
        }
      }
    }
  }
  console.log(`Archivos de vocabulario revisados: ${files.length}`);
}

if (errors.length) {
  console.error('\nFallaron las verificaciones de configuración:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Configuración de release válida.');
