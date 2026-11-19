import { randomUUID } from 'node:crypto';
import { validarFechaFutura } from '../domain/evento.js';
import { buscarEventos } from '../domain/busqueda.js';
import { estaVencida, QUIEN_SISTEMA, transicionar } from '../domain/compra.js';
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

    // FR-019: solo el organizador dueño ve las compras de su evento y el cupo disponible por tipo.
    comprasDeEvento(organizador, eventoId) {
      const evento = obtener(eventoId);
      if (evento.organizadorId !== organizador.id) {
        throw errores.noAutorizado('Solo el organizador del evento puede ver sus compras');
      }
      const ahora = reloj.ahora();
      const compras = repos.compras.listarPorEvento(evento.id);
      for (const compra of compras) {
        if (estaVencida(compra, ahora)) transicionar(compra, 'CANCELADA', QUIEN_SISTEMA, ahora);
      }
      return {
        evento: { id: evento.id, nombre: evento.nombre, fecha: evento.fecha.toISOString() },
        tiposEntrada: evento.tiposEntrada.map((t) => presentacion.tipoEntrada(t, compras)),
        compras: compras
          .sort((a, b) => b.creadaEn - a.creadaEn)
          .map((c) => presentacion.compra(c, organizador)),
      };
    },

    detalle(eventoId, usuario) {
      return presentacion.eventoDetalle(obtener(eventoId), usuario);
    },
  };
}
