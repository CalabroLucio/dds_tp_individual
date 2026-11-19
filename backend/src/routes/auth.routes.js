import { Router } from 'express';
import { validar } from '../middleware/validar.js';
import { loginSchema } from '../schemas/auth.schema.js';
import { crearAuthController } from '../controllers/auth.controller.js';

export function crearRutasAuth({ services, middleware }) {
  const router = Router();
  const controller = crearAuthController({ authService: services.auth });

  router.post('/login', validar({ body: loginSchema }), controller.login);
  router.get('/me', middleware.autenticar, controller.me);

  return router;
}
