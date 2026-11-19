import { Router } from 'express';
import { validar } from '../middleware/validar.js';
import { eventoIdParams, nuevoEventoSchema } from '../schemas/evento.schema.js';
import { crearEventosController } from '../controllers/eventos.controller.js';

export function crearRutasEventos({ services, middleware }) {
  const router = Router();
  const controller = crearEventosController({ eventosService: services.eventos });
  const { autenticar, requerirRol } = middleware;
  const soloOrganizador = [autenticar, requerirRol('ORGANIZADOR')];

  router.post('/', soloOrganizador, validar({ body: nuevoEventoSchema }), controller.crear);
  // '/mios' va antes de '/:eventoId' para que no se interprete como un id.
  router.get('/mios', soloOrganizador, controller.misEventos);
  router.get('/:eventoId', autenticar, validar({ params: eventoIdParams }), controller.detalle);

  return router;
}
