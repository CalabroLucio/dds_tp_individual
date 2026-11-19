import { api } from './cliente';
import { loginRespuestaSchema, usuarioSchema } from './schemas';

export const authApi = {
  login: (email, password) =>
    api.post('/auth/login', { body: { email, password }, schema: loginRespuestaSchema }),
  me: () => api.get('/auth/me', { schema: usuarioSchema }),
};
