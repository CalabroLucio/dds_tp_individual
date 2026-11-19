export function crearFavoritosController({ favoritosService }) {
  return {
    listar: (req, res) => {
      res.json(favoritosService.listar(req.usuario));
    },
    agregar: (req, res) => {
      favoritosService.agregar(req.usuario, req.datos.params.eventoId);
      res.status(204).end();
    },
    quitar: (req, res) => {
      favoritosService.quitar(req.usuario, req.datos.params.eventoId);
      res.status(204).end();
    },
  };
}
