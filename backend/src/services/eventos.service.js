import { randomUUID } from 'node:crypto';
import { validarFechaFutura } from '../domain/evento.js';
import { buscarEventos } from '../domain/busqueda.js';
import { errores } from '../errors/index.js';

export function crearEventosService({ repos, reloj, presentacion }) {
  function obtener(eventoId) {
    const evento = repos.eventos.porId(eventoId);
    if (!evento) throw errores.noEncontrado('El evento');
    return evento;
  }

  return {
    obtener,

    crear(organizador, datos) {
      const ahora = reloj.ahora();
      const detalles = [];
      if (!validarFechaFutura(datos.fecha, ahora)) {
        detalles.push({ campo: 'fecha', mensaje: 'La fecha del evento debe ser futura' });
      }
      if (!repos.categorias.porId(datos.categoriaId)) {
        detalles.push({ campo: 'categoriaId', mensaje: 'La categoría elegida no existe' });
      }
      if (detalles.length > 0) throw errores.validacion(detalles);

      const evento = repos.eventos.guardar({
        id: randomUUID(),
        nombre: datos.nombre,
        descripcion: datos.descripcion,
        categoriaId: datos.categoriaId,
        fecha: datos.fecha,
        multimedia: datos.multimedia,
        organizadorId: organizador.id,
        tiposEntrada: datos.tiposEntrada.map((t) => ({ id: randomUUID(), ...t })),
        creadoEn: ahora,
      });
      return presentacion.eventoDetalle(evento, organizador);
    },

    misEventos(organizador) {
      return repos.eventos
        .listarPorOrganizador(organizador.id)
        .sort((a, b) => b.fecha - a.fecha)
        .map((e) => presentacion.eventoResumen(e, organizador));
    },

    listar(criterios, usuario) {
      const puntajes = new Map();
      const puntajeDe = (organizadorId) => {
        if (!puntajes.has(organizadorId)) {
          puntajes.set(organizadorId, presentacion.organizadorResumen(organizadorId).puntaje);
        }
        return puntajes.get(organizadorId);
      };
      return buscarEventos(repos.eventos.listar(), criterios, {
        ahora: reloj.ahora(),
        categoriaPorId: repos.categorias.porId,
        puntajeDe,
      }).map((e) => presentacion.eventoResumen(e, usuario));
    },

    detalle(eventoId, usuario) {
      return presentacion.eventoDetalle(obtener(eventoId), usuario);
    },
  };
}
