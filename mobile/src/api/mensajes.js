import { z } from 'zod';
import { api } from './cliente';
import { mensajeSchema } from './schemas';

export const mensajesApi = {
  listar: (compraId) => api.get(`/compras/${compraId}/mensajes`, { schema: z.array(mensajeSchema) }),
  enviar: (compraId, texto) =>
    api.post(`/compras/${compraId}/mensajes`, { body: { texto }, schema: mensajeSchema }),
};
