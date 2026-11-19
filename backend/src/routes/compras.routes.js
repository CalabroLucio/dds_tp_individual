import { Router } from 'express';
import { validar } from '../middleware/validar.js';
import { compraIdParams, nuevaCompraSchema, nuevoPagoSchema } from '../schemas/compra.schema.js';
import { crearComprasController } from '../controllers/compras.controller.js';

export function crearRutasCompras({ services, middleware }) {
  const router = Router();
  const controller = crearComprasController({ comprasService: services.compras });
  const { autenticar } = middleware;

  // El rol se valida en el servicio para poder explicar el caso "organizador sobre su propio evento".
  router.post('/', autenticar, validar({ body: nuevaCompraSchema }), controller.crear);
  router.post(
    '/:compraId/pagos',
    autenticar,
    validar({ params: compraIdParams, body: nuevoPagoSchema }),
    controller.pagar,
  );

  return router;
}

export function crearRutasMediosPago({ services, middleware }) {
  const router = Router();
  const controller = crearComprasController({ comprasService: services.compras });
  router.get('/', middleware.autenticar, controller.mediosPago);
  return router;
}
