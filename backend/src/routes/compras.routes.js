import { Router } from 'express';
import { validar } from '../middleware/validar.js';
import { compraIdParams, nuevaCompraSchema, nuevoPagoSchema } from '../schemas/compra.schema.js';
import { crearComprasController } from '../controllers/compras.controller.js';
import { crearMensajesController } from '../controllers/mensajes.controller.js';
import { mensajesQuerySchema, nuevoMensajeSchema } from '../schemas/mensaje.schema.js';
import { nuevaReseniaSchema } from '../schemas/resenia.schema.js';
import { crearReseniasController } from '../controllers/resenias.controller.js';

export function crearRutasCompras({ services, middleware }) {
  const router = Router();
  const controller = crearComprasController({ comprasService: services.compras });
  const { autenticar, requerirRol } = middleware;

  // El rol se valida en el servicio para poder explicar el caso "organizador sobre su propio evento".
  router.get('/', autenticar, requerirRol('COMPRADOR'), controller.listarMias);
  router.post('/', autenticar, validar({ body: nuevaCompraSchema }), controller.crear);
  router.get('/:compraId', autenticar, validar({ params: compraIdParams }), controller.detalle);
  router.post(
    '/:compraId/pagos',
    autenticar,
    validar({ params: compraIdParams, body: nuevoPagoSchema }),
    controller.pagar,
  );

  router.post('/:compraId/cancelacion', autenticar, validar({ params: compraIdParams }), controller.cancelar);
  const mensajes = crearMensajesController({ mensajesService: services.mensajes });
  router.get(
    '/:compraId/mensajes',
    autenticar,
    validar({ params: compraIdParams, query: mensajesQuerySchema }),
    mensajes.listar,
  );
  router.post(
    '/:compraId/mensajes',
    autenticar,
    validar({ params: compraIdParams, body: nuevoMensajeSchema }),
    mensajes.enviar,
  );
  const resenias = crearReseniasController({ reseniasService: services.resenias });
  router.post(
    '/:compraId/resenia',
    autenticar,
    validar({ params: compraIdParams, body: nuevaReseniaSchema }),
    resenias.crear,
  );
  router.post('/:compraId/uso', autenticar, validar({ params: compraIdParams }), controller.marcarUtilizada);

  return router;
}

export function crearRutasMediosPago({ services, middleware }) {
  const router = Router();
  const controller = crearComprasController({ comprasService: services.compras });
  router.get('/', middleware.autenticar, controller.mediosPago);
  return router;
}
