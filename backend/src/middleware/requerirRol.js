import { errores } from '../errors/index.js';

// data-model.md · Usuario.rol: COMPRADOR | ORGANIZADOR, fijo. Usar siempre después de `autenticar`.
export function requerirRol(...roles) {
  return (req, _res, next) => {
    if (!req.usuario) return next(errores.noAutenticado());
    if (!roles.includes(req.usuario.rol)) return next(errores.rolNoPermitido());
    next();
  };
}
