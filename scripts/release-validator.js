const fs = require('node:fs');
const path = require('node:path');

const CATEGORY_AUDIO_DIRS = {
  'Saludos y Cortesía': 'Basico/Saludos', Animales: 'Basico/animales',
  Colores: 'Basico/colores', 'Material Escolar': 'Basico/material escolar',
  'Números': 'Basico/numeros', 'Objetos y entorno': 'Basico/objetos entorno',
  'Partes del cuerpo': 'Basico/partes del cuerpo', 'Pronombres personales': 'Basico/pronombres',
  'Vocabulario General': 'Basico/vocabulario general',
  'Conectores y expresiones': 'Intermedio/conectores', 'Comida y familia': 'Intermedio/familia',
  Familia: 'Intermedio/familia', 'Verbos comunes': 'Intermedio/verbos comunes',
  'Tiempos verbales': 'Intermedio/tiempos verbales', 'Vida cotidiana': 'Intermedio/vida cotidiana',
  'Naturaleza de la Sierra': 'Intermedio/naturaleza', 'Plantas de la Sierra': 'Intermedio/plantas de la sierra',
  'Conceptos abstractos y culturales': 'Avanzado/conceptos',
  'Expresiones avanzadas': 'Avanzado/expresiones avanzadas',
  'Elementos naturales y cosmogonía': 'Avanzado/elemntos naturales',
  'Tiempos y celebraciones': 'Avanzado/tiempos y celebraciones',
};

const AUDIO_PATH_OVERRIDES = {
  'tiempos_verbales.json:tetahmej': 'Avanzado/tiempos y celebraciones/tetahmej.mp3',
};

function readJson(root, file, errors) {
  try { return JSON.parse(fs.readFileSync(path.join(root, file), 'utf8')); }
  catch (error) { errors.push(`JSON inválido en ${file}: ${error.message}`); return null; }
}

function validateProject(root = process.cwd()) {
  const errors = [];
  const required = ['package.json','package-lock.json','app.json','eas.json','tsconfig.json','app/services/audioService.ts'];
  for (const file of required) if (!fs.existsSync(path.join(root,file))) errors.push(`Falta el archivo requerido: ${file}`);
  const pkg=readJson(root,'package.json',errors), lock=readJson(root,'package-lock.json',errors);
  const app=readJson(root,'app.json',errors), eas=readJson(root,'eas.json',errors);
  if(pkg&&lock&&(pkg.name!==lock.name||pkg.version!==lock.version)) errors.push('package.json y package-lock.json deben coincidir en nombre y versión.');
  for(const script of ['typecheck','lint','check','test','prepare:release','test:release']) if(!pkg?.scripts?.[script]) errors.push(`Falta el script npm: ${script}`);
  if(!app?.expo?.android?.package) errors.push('Falta expo.android.package en app.json.');
  if(!app?.expo?.plugins?.includes('expo-audio')) errors.push('expo-audio debe estar registrado en app.json.');
  if(!eas?.build?.production||!eas?.build?.preview) errors.push('Faltan perfiles preview y production en eas.json.');

  const registeredAudio=new Set(), audioFile=path.join(root,'app/services/audioService.ts');
  if(fs.existsSync(audioFile)){
    const source=fs.readFileSync(audioFile,'utf8'), pattern=/require\((["'])(.*?)\1\)/g; let match;
    while((match=pattern.exec(source))!==null){
      const absolute=path.resolve(path.dirname(audioFile),match[1]);
      if(!fs.existsSync(absolute)) errors.push(`Recurso de audio inexistente: ${match[1]}`);
      registeredAudio.add(path.relative(path.join(root,'assets/audio'),absolute).split(path.sep).join('/').toLowerCase());
    }
    if(!registeredAudio.size) errors.push('No se encontraron recursos MP3 registrados.');
  }
  const vocabularyDir=path.join(root,'data/vocabulario'); let vocabularyFiles=0,audioReferences=0;
  if(fs.existsSync(vocabularyDir)){
    const files=fs.readdirSync(vocabularyDir).filter(file=>file.endsWith('.json')); vocabularyFiles=files.length;
    for(const file of files){
      const data=readJson(root,path.join('data/vocabulario',file),errors);
      if(!data||!Array.isArray(data.palabras)){errors.push(`La estructura de ${file} debe contener un arreglo "palabras".`);continue;}
      const directory=CATEGORY_AUDIO_DIRS[data.categoria];
      if(!directory) errors.push(`Categoría sin directorio de audio: ${data.categoria} (${file}).`);
      for(const [index,word] of data.palabras.entries()){
        if(!word.nahuatl||!word.espanol||typeof word.audio!=='string'){errors.push(`Registro incompleto en ${file}, palabra ${index+1}.`);continue;}
        if(word.audio.trim()){
          audioReferences++;
          const override=AUDIO_PATH_OVERRIDES[`${file}:${word.nahuatl}`];
          const key=(override||`${directory}/${word.audio}`).toLowerCase();
          if(directory&&!registeredAudio.has(key)) errors.push(`Audio no registrado para "${word.nahuatl}" en ${file}: ${key}`);
        }
      }
    }
  }
  return {errors,registeredAudio:registeredAudio.size,vocabularyFiles,audioReferences};
}
module.exports={CATEGORY_AUDIO_DIRS,validateProject};
