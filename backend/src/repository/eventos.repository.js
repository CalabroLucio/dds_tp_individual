export function crearEventosRepository(store) {
  return {
    guardar(evento) {
      store.eventos.set(evento.id, evento);
      return evento;
    },

    porId(id) {
      return store.eventos.get(id) ?? null;
    },

    listar() {
      return [...store.eventos.values()];
    },

    listarPorOrganizador(organizadorId) {
      return [...store.eventos.values()].filter((e) => e.organizadorId === organizadorId);
    },

    buscarTipoEntrada(eventoId, tipoEntradaId) {
      return store.eventos.get(eventoId)?.tiposEntrada.find((t) => t.id === tipoEntradaId) ?? null;
    },
  };
}
