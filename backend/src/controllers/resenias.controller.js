export function crearReseniasController({ reseniasService }) {
  return {
    crear: (req, res) => {
      res.status(201).json(reseniasService.crear(req.usuario, req.datos.params.compraId, req.datos.body));
    },
  };
}
