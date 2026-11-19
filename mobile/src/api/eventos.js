import { z } from 'zod';
import { api } from './cliente';
import {
  categoriaSchema,
  compraSchema,
  eventoCreadoSchema,
  eventoDetalleSchema,
  eventoResumenSchema,
  tipoEntradaSchema,
} from './schemas';

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
  comprasDeEvento: (id) =>
    api.get(`/eventos/${id}/compras`, {
      schema: z.object({
        evento: z.object({ id: z.string(), nombre: z.string(), fecha: z.string() }),
        tiposEntrada: z.array(tipoEntradaSchema),
        compras: z.array(compraSchema),
      }),
    }),
  crear: (evento) => api.post('/eventos', { body: evento, schema: eventoCreadoSchema }),
};
