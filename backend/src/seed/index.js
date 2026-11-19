import { cargarSeedBase } from './seed.js';

// Punto de entrada del seed al arrancar el servidor. Los eventos de demostración se agregan en T098.
export function cargarSeed(contexto) {
  const base = cargarSeedBase(contexto);
  return `${Object.keys(base.categorias).length} categorías, ${Object.keys(base.usuarios).length} usuarios`;
}
