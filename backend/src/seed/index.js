import { cargarSeedBase } from './seed.js';
import { cargarSeedDemo } from './demo.js';

// Seed al arrancar el servidor: categorías y usuarios, más los datos de demostración del flujo del video.
export function cargarSeed(contexto) {
  const base = cargarSeedBase(contexto);
  const demo = cargarSeedDemo(contexto, base);
  return `${Object.keys(base.categorias).length} categorías, ${Object.keys(base.usuarios).length} usuarios, ${demo.eventos} eventos, ${demo.compras} compras`;
}
