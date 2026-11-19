import { serializarUsuario } from '../services/auth.service.js';

// Los controllers solo traducen HTTP ↔ servicios: sin reglas de negocio (constitution I).
export function crearAuthController({ authService }) {
  return {
    login: async (req, res) => {
      res.json(await authService.login(req.datos.body));
    },
    me: (req, res) => {
      res.json(serializarUsuario(req.usuario));
    },
  };
}
