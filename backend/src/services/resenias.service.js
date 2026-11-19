import { randomUUID } from 'node:crypto';
import { errores } from '../errors/index.js';

// FR-026: una reseña por compra, solo del comprador y solo con la compra UTILIZADA.
export function crearReseniasService({ repos, reloj, presentacion }) {
  return {
    crear(usuario, compraId, { puntaje, comentario }) {
      const compra = repos.compras.porId(compraId);
      if (!compra) throw errores.noEncontrado('La compra');
      if (compra.compradorId !== usuario.id)
        throw errores.noAutorizado('Solo podés reseñar tus propias compras');
      if (compra.estado !== 'UTILIZADA') {
        throw errores.estadoInvalido('Solo podés reseñar una compra utilizada, después de asistir al evento');
      }
      if (repos.resenias.porCompra(compra.id)) throw errores.yaReseniada();

      const resenia = repos.resenias.guardar({
        id: randomUUID(),
        compraId: compra.id,
        compradorId: usuario.id,
        eventoId: compra.eventoId,
        puntaje,
        comentario,
        creadaEn: reloj.ahora(),
      });
      return presentacion.resenia(resenia);
    },
  };
}
