export function crearMensajesController({ mensajesService }) {
  return {
    listar: (req, res) => {
      res.json(mensajesService.listar(req.usuario, req.datos.params.compraId, req.datos.query));
    },
    enviar: (req, res) => {
      res
        .status(201)
        .json(mensajesService.enviar(req.usuario, req.datos.params.compraId, req.datos.body.texto));
    },
  };
}
