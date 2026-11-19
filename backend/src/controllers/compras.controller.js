export function crearComprasController({ comprasService }) {
  return {
    crear: (req, res) => {
      res.status(201).json(comprasService.crearCompra(req.usuario, req.datos.body));
    },
    listarMias: (req, res) => {
      res.json(comprasService.listarMias(req.usuario));
    },
    detalle: (req, res) => {
      res.json(comprasService.detalle(req.usuario, req.datos.params.compraId));
    },
    pagar: (req, res) => {
      res.json(comprasService.pagar(req.usuario, req.datos.params.compraId, req.datos.body.medioPago));
    },
    cancelar: (req, res) => {
      res.json(comprasService.cancelar(req.usuario, req.datos.params.compraId));
    },
    marcarUtilizada: (req, res) => {
      res.json(comprasService.marcarUtilizada(req.usuario, req.datos.params.compraId));
    },
    mediosPago: (_req, res) => {
      res.json(comprasService.mediosPago());
    },
  };
}
