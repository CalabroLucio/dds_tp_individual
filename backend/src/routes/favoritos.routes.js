import { Router } from 'express';
import { validar } from '../middleware/validar.js';
import { eventoIdParams } from '../schemas/evento.schema.js';
import { crearFavoritosController } from '../controllers/favoritos.controller.js';

export function crearRutasFavoritos({ services, middleware }) {
  const router = Router();
  const controller = crearFavoritosController({ favoritosService: services.favoritos });
  const soloComprador = [middleware.autenticar, middleware.requerirRol('COMPRADOR')];

  router.get('/', soloComprador, controller.listar);
  router.put('/:eventoId', soloComprador, validar({ params: eventoIdParams }), controller.agregar);
  router.delete('/:eventoId', soloComprador, validar({ params: eventoIdParams }), controller.quitar);
  return router;
}
