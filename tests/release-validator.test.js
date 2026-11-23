const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { validateProject } = require('../scripts/release-validator');

function fixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'tinehnemi-'));
  const write = (file, value) => {
    const target = path.join(root, file);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, value);
  };
  const pkg = {
    name: 'fixture', version: '1.0.0',
    scripts: { typecheck: 'tsc', lint: 'eslint', check: 'npm run typecheck', test: 'node --test', 'prepare:release': 'expo-doctor', 'test:release': 'node scripts/validate-release.js' },
  };
  write('package.json', JSON.stringify(pkg));
  write('package-lock.json', JSON.stringify({ name: pkg.name, version: pkg.version }));
  write('app.json', JSON.stringify({ expo: { android: { package: 'com.example.app' }, plugins: ['expo-audio'] } }));
  write('eas.json', JSON.stringify({ build: { preview: {}, production: {} } }));
  write('tsconfig.json', '{}');
  write('assets/audio/Basico/Saludos/hello.mp3', 'fixture');
  write('app/services/audioService.ts', "const audio = require('../../assets/audio/Basico/Saludos/hello.mp3');");
  write('data/vocabulario/saludos.json', JSON.stringify({
    categoria: 'Saludos y Cortesía',
    palabras: [{ nahuatl: 'niltze', espanol: 'hola', audio: 'hello.mp3' }],
  }));
  return root;
}

test('acepta configuración y audio válidos', () => {
  const root = fixture();
  try {
    const result = validateProject(root);
    assert.deepEqual(result.errors, []);
    assert.equal(result.vocabularyFiles, 1);
    assert.equal(result.audioReferences, 1);
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});

test('detecta una referencia de audio no registrada', () => {
  const root = fixture();
  try {
    const file = path.join(root, 'data/vocabulario/saludos.json');
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    data.palabras[0].audio = 'missing.mp3';
    fs.writeFileSync(file, JSON.stringify(data));
    assert.ok(validateProject(root).errors.some(error => error.includes('Audio no registrado')));
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});

test('detecta categorías sin carpeta de audio', () => {
  const root = fixture();
  try {
    const file = path.join(root, 'data/vocabulario/saludos.json');
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    data.categoria = 'Categoría desconocida';
    fs.writeFileSync(file, JSON.stringify(data));
    assert.ok(validateProject(root).errors.some(error => error.includes('Categoría sin directorio')));
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});

test('detecta recursos MP3 declarados que no existen', () => {
  const root = fixture();
  try {
    fs.rmSync(path.join(root, 'assets/audio/Basico/Saludos/hello.mp3'));
    assert.ok(validateProject(root).errors.some(error => error.includes('Recurso de audio inexistente')));
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});


test('acepta nombres de audio con apóstrofo y rutas de categoría específicas', () => {
  const root = fixture();
  try {
    const write = (file, value) => {
      const target = path.join(root, file);
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.writeFileSync(target, value);
    };
    write("assets/audio/Intermedio/naturaleza/tlal'li.mp3", 'fixture');
    write('assets/audio/Avanzado/tiempos y celebraciones/tetahmej.mp3', 'fixture');
    const service = path.join(root, 'app/services/audioService.ts');
    fs.appendFileSync(service, '\nconst extra = require("../../assets/audio/Intermedio/naturaleza/tlal\'li.mp3");');
    fs.appendFileSync(service, '\nconst ancestors = require("../../assets/audio/Avanzado/tiempos y celebraciones/tetahmej.mp3");');
    write('data/vocabulario/naturaleza_sierra.json', JSON.stringify({
      categoria: 'Naturaleza de la Sierra',
      palabras: [{ nahuatl: 'Tlal-li', espanol: 'Tierra', audio: "tlal'li.mp3" }],
    }));
    write('data/vocabulario/tiempos_verbales.json', JSON.stringify({
      categoria: 'Tiempos verbales',
      palabras: [{ nahuatl: 'tetahmej', espanol: 'ancestros', audio: 'tetahmej.mp3' }],
    }));
    const result = validateProject(root);
    assert.deepEqual(result.errors, []);
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});
