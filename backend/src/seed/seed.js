import { randomUUID } from 'node:crypto';

export const PASSWORD_DEMO = 'demo1234';

// data-model.md · Categoria.nombre (único). Conjunto fijo (FR-006).
const CATEGORIAS = [
  ['Música', 'Recitales, bandas y solistas en vivo'],
  ['Teatro', 'Obras, musicales y espectáculos escénicos'],
  ['Deportes', 'Partidos, carreras y eventos deportivos'],
  ['Festivales', 'Festivales de varios días y grandes eventos al aire libre'],
  ['Conferencias', 'Charlas, congresos y encuentros profesionales'],
  ['Stand-up', 'Comedia en vivo y monólogos'],
];

// data-model.md · Usuario.nombre, Usuario.apellido, Usuario.email (único) y Usuario.rol (fijo).
const USUARIOS = [
  ['martina', 'Martina', 'Ruiz', 'ORGANIZADOR'],
  ['joaquin', 'Joaquín', 'Pérez', 'ORGANIZADOR'],
  ['ana', 'Ana', 'Gómez', 'COMPRADOR'],
  ['bruno', 'Bruno', 'Díaz', 'COMPRADOR'],
  ['carla', 'Carla', 'Fernández', 'COMPRADOR'],
];

// Seed base: categorías y usuarios. Devuelve referencias por clave para armar el resto de los datos.
export function cargarSeedBase(contexto) {
  const { repos, services } = contexto;
  const hash = services.auth.hashearPassword(PASSWORD_DEMO);

  const categorias = {};
  for (const [nombre, descripcion] of CATEGORIAS) {
    categorias[nombre] = repos.categorias.guardar({ id: randomUUID(), nombre, descripcion });
  }

  const usuarios = {};
  for (const [clave, nombre, apellido, rol] of USUARIOS) {
    usuarios[clave] = repos.usuarios.guardar({
      id: randomUUID(),
      nombre,
      apellido,
      email: `${clave}@tickets.test`,
      passwordHash: hash,
      rol,
    });
  }

  return { categorias, usuarios };
}
