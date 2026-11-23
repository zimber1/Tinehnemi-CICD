const { validateProject } = require('./release-validator');

const result = validateProject(process.cwd());
console.log(`Recursos MP3 registrados: ${result.registeredAudio}`);
console.log(`Archivos de vocabulario revisados: ${result.vocabularyFiles}`);
console.log(`Referencias de audio revisadas: ${result.audioReferences}`);

if (result.errors.length) {
  console.error('\nFallaron las verificaciones de release:');
  for (const error of result.errors) console.error(`- ${error}`);
  process.exit(1);
}
console.log('Configuración y recursos de release válidos.');
