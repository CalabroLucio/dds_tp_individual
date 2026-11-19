import { Router } from 'express';

export function crearRutasCategorias({ services, middleware }) {
  const router = Router();
  router.get('/', middleware.autenticar, (_req, res) => res.json(services.categorias.listar()));
  return router;
}
