import { entradasOcupadas } from '../domain/evento.js';

// Compras en memoria. El cupo no se guarda como contador: se deriva de las compras activas
// (PENDIENTE, CONFIRMADA, UTILIZADA). Por eso "liberar cupo" es simplemente cambiar el estado.
export function crearComprasRepository(store) {
  const listarPorEvento = (eventoId) => [...store.compras.values()].filter((c) => c.eventoId === eventoId);

  return {
    porId(id) {
      return store.compras.get(id) ?? null;
    },

    listarPorEvento,

    listarPorComprador(compradorId) {
      return [...store.compras.values()].filter((c) => c.compradorId === compradorId);
    },

    listar() {
      return [...store.compras.values()];
    },

    /**
     * SECCIÓN CRÍTICA (constitution III, R9). Es síncrona a propósito: entre el chequeo de disponibilidad y
     * el guardado no hay ningún `await`, así que Node (un solo hilo) no puede intercalar otra solicitud.
     * Con una base de datos real esto sería un UPDATE condicional o una transacción.
     * data-model.md · TipoEntrada.cupo (cupo total) y Compra.cantidad.
     */
    crearCompraReservandoCupo({ compra, tipoEntrada }) {
      const disponible =
        tipoEntrada.cupo - entradasOcupadas(tipoEntrada.id, listarPorEvento(compra.eventoId));
      if (compra.cantidad > disponible) return { ok: false, disponible: Math.max(0, disponible) };
      store.compras.set(compra.id, compra);
      return { ok: true, compra };
    },
  };
}
