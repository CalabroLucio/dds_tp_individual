// Reseñas en memoria (data-model.md · Resenia.compraId: una por compra).
export function crearReseniasRepository(store) {
  return {
    guardar(resenia) {
      store.resenias.set(resenia.id, resenia);
      return resenia;
    },

    porCompra(compraId) {
      for (const resenia of store.resenias.values()) {
        if (resenia.compraId === compraId) return resenia;
      }
      return null;
    },

    listarPorEventos(eventoIds) {
      const ids = new Set(eventoIds);
      return [...store.resenias.values()]
        .filter((r) => ids.has(r.eventoId))
        .sort((a, b) => b.creadaEn - a.creadaEn);
    },
  };
}
