export function crearComprasController({ comprasService }) {
  return {
    crear: (req, res) => {
      res.status(201).json(comprasService.crearCompra(req.usuario, req.datos.body));
    },
    pagar: (req, res) => {
      res.json(comprasService.pagar(req.usuario, req.datos.params.compraId, req.datos.body.medioPago));
    },
    mediosPago: (_req, res) => {
      res.json(comprasService.mediosPago());
    },
  };
}
