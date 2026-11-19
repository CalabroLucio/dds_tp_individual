import { z } from 'zod';
import { api } from './cliente';
import { categoriaSchema, eventoCreadoSchema, eventoDetalleSchema, eventoResumenSchema } from './schemas';

// Arma el query string sin depender de URLSearchParams (soporte parcial en React Native).
export function consulta(parametros = {}) {
  const partes = Object.entries(parametros)
    .filter(([, valor]) => valor !== undefined && valor !== null && valor !== '')
    .map(([clave, valor]) => `${encodeURIComponent(clave)}=${encodeURIComponent(valor)}`);
  return partes.length > 0 ? `?${partes.join('&')}` : '';
}

export const eventosApi = {
  buscar: (criterios) => api.get(`/eventos${consulta(criterios)}`, { schema: z.array(eventoResumenSchema) }),
  categorias: () => api.get('/categorias', { schema: z.array(categoriaSchema) }),
  misEventos: () => api.get('/eventos/mios', { schema: z.array(eventoResumenSchema) }),
  detalle: (id) => api.get(`/eventos/${id}`, { schema: eventoDetalleSchema }),
  crear: (evento) => api.post('/eventos', { body: evento, schema: eventoCreadoSchema }),
};
