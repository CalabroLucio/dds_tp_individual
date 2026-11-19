// Compras en memoria. La reserva atómica de cupo se agrega en la Historia 3.
export function crearComprasRepository(store) {
  return {
    porId(id) {
      return store.compras.get(id) ?? null;
    },

    listarPorEvento(eventoId) {
      return [...store.compras.values()].filter((c) => c.eventoId === eventoId);
    },

    listarPorComprador(compradorId) {
      return [...store.compras.values()].filter((c) => c.compradorId === compradorId);
    },

    listar() {
      return [...store.compras.values()];
    },
  };
}
