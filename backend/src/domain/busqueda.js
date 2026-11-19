import { contiene } from '../utils/texto.js';
import { precioDesde } from './evento.js';

const DIRECCION_POR_DEFECTO = { precio: 'asc', fecha: 'asc', puntaje: 'desc' };

const coincideTexto = (evento, q, categoriaPorId) =>
  [evento.nombre, evento.descripcion, categoriaPorId(evento.categoriaId)?.nombre].some((campo) =>
    contiene(campo ?? '', q),
  );

const tienePrecioEnRango = (evento, min, max) =>
  evento.tiposEntrada.some(
    (t) => (min === undefined || t.precio >= min) && (max === undefined || t.precio <= max),
  );

// Búsqueda del catálogo (FR-007 a FR-010). Función pura: recibe los eventos y cómo resolver categoría y puntaje.
export function buscarEventos(eventos, criterios, { ahora, categoriaPorId, puntajeDe }) {
  const { q, categoriaId, precioMin, precioMax, orden = 'fecha' } = criterios;
  const direccion = criterios.direccion ?? DIRECCION_POR_DEFECTO[orden];
  const signo = direccion === 'desc' ? -1 : 1;

  const filtrados = eventos.filter(
    (e) =>
      e.fecha.getTime() > ahora.getTime() &&
      (!q || coincideTexto(e, q, categoriaPorId)) &&
      (!categoriaId || e.categoriaId === categoriaId) &&
      tienePrecioEnRango(e, precioMin, precioMax),
  );

  const porFecha = (a, b) => a.fecha - b.fecha;
  const comparadores = {
    fecha: (a, b) => signo * porFecha(a, b),
    precio: (a, b) => signo * (precioDesde(a) - precioDesde(b)) || porFecha(a, b),
    puntaje: (a, b) => {
      const pa = puntajeDe(a.organizadorId);
      const pb = puntajeDe(b.organizadorId);
      // Los organizadores sin reseñas quedan siempre al final, sin importar la dirección.
      if (pa === null && pb === null) return porFecha(a, b);
      if (pa === null) return 1;
      if (pb === null) return -1;
      return signo * (pa - pb) || porFecha(a, b);
    },
  };

  return filtrados.sort(comparadores[orden]);
}
