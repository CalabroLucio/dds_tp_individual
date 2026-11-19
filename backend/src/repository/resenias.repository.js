// Reseñas en memoria. El alta se agrega en la Historia 9.
export function crearReseniasRepository(store) {
  return {
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
