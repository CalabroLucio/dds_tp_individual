// FR-028: cada comprador marca y desmarca eventos favoritos (sin duplicados) y consulta los suyos.
export function crearFavoritosService({ repos, eventosService, presentacion }) {
  return {
    listar(usuario) {
      return [...usuario.favoritos]
        .map((id) => repos.eventos.porId(id))
        .filter(Boolean)
        .sort((a, b) => a.fecha - b.fecha)
        .map((e) => presentacion.eventoResumen(e, usuario));
    },
    agregar(usuario, eventoId) {
      eventosService.obtener(eventoId);
      repos.usuarios.agregarFavorito(usuario.id, eventoId);
    },
    quitar(usuario, eventoId) {
      eventosService.obtener(eventoId);
      repos.usuarios.quitarFavorito(usuario.id, eventoId);
    },
  };
}
