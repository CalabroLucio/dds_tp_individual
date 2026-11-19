import { z } from 'zod';
import { api } from './cliente';
import { eventoResumenSchema } from './schemas';

export const favoritosApi = {
  listar: () => api.get('/favoritos', { schema: z.array(eventoResumenSchema) }),
  agregar: (eventoId) => api.put(`/favoritos/${eventoId}`),
  quitar: (eventoId) => api.delete(`/favoritos/${eventoId}`),
};
