import { errores } from '../errors/index.js';

// Verifica el JWT del encabezado Authorization y adjunta el usuario a `req.usuario`.
export function crearAutenticar({ authService, usuariosRepo }) {
  return (req, _res, next) => {
    const encabezado = req.get('Authorization') ?? '';
    const [esquema, token] = encabezado.split(' ');
    if (esquema !== 'Bearer' || !token) return next(errores.noAutenticado());

    const payload = authService.verificarToken(token);
    const usuario = usuariosRepo.porId(payload.sub);
    if (!usuario) return next(errores.noAutenticado());

    req.usuario = usuario;
    next();
  };
}
