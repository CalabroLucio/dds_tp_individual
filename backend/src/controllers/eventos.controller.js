export function crearEventosController({ eventosService }) {
  return {
    crear: (req, res) => {
      res.status(201).json(eventosService.crear(req.usuario, req.datos.body));
    },
    listar: (req, res) => {
      res.json(eventosService.listar(req.datos.query, req.usuario));
    },
    misEventos: (req, res) => {
      res.json(eventosService.misEventos(req.usuario));
    },
    detalle: (req, res) => {
      res.json(eventosService.detalle(req.datos.params.eventoId, req.usuario));
    },
  };
}
