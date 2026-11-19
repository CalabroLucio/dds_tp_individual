import { z } from 'zod';
import { api } from './cliente';
import { categoriaSchema, eventoCreadoSchema, eventoDetalleSchema, eventoResumenSchema } from './schemas';

export const eventosApi = {
  categorias: () => api.get('/categorias', { schema: z.array(categoriaSchema) }),
  misEventos: () => api.get('/eventos/mios', { schema: z.array(eventoResumenSchema) }),
  detalle: (id) => api.get(`/eventos/${id}`, { schema: eventoDetalleSchema }),
  crear: (evento) => api.post('/eventos', { body: evento, schema: eventoCreadoSchema }),
};
