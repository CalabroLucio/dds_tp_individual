import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { errores } from '../errors/index.js';

export const serializarUsuario = (u) => ({
  id: u.id,
  nombre: u.nombre,
  apellido: u.apellido,
  email: u.email,
  rol: u.rol,
});

export function crearAuthService({ usuariosRepo, entorno }) {
  return {
    async login({ email, password }) {
      const usuario = usuariosRepo.buscarPorEmail(email);
      // Mismo error para email inexistente y contraseña incorrecta: no se revela cuál falló.
      const valido = usuario ? await bcrypt.compare(password, usuario.passwordHash) : false;
      if (!valido) throw errores.credencialesInvalidas();

      const token = jwt.sign({ sub: usuario.id, rol: usuario.rol }, entorno.JWT_SECRET, {
        expiresIn: entorno.JWT_EXPIRACION,
      });
      return { token, usuario: serializarUsuario(usuario) };
    },

    verificarToken(token) {
      try {
        return jwt.verify(token, entorno.JWT_SECRET);
      } catch {
        throw errores.noAutenticado('Tu sesión venció o no es válida. Iniciá sesión de nuevo');
      }
    },

    hashearPassword(password) {
      return bcrypt.hashSync(password, entorno.BCRYPT_COSTO);
    },
  };
}
