import { z } from 'zod';
import { api } from './cliente';
import { compraDetalleSchema, compraSchema, medioPagoSchema } from './schemas';

export const comprasApi = {
  mias: () => api.get('/compras', { schema: z.array(compraSchema) }),
  mediosPago: () => api.get('/medios-pago', { schema: z.array(medioPagoSchema) }),
  crear: ({ eventoId, tipoEntradaId, cantidad }) =>
    api.post('/compras', { body: { eventoId, tipoEntradaId, cantidad }, schema: compraSchema }),
  detalle: (id) => api.get(`/compras/${id}`, { schema: compraDetalleSchema }),
  cancelar: (id) => api.post(`/compras/${id}/cancelacion`, { schema: compraSchema }),
  pagar: (id, medioPago) => api.post(`/compras/${id}/pagos`, { body: { medioPago }, schema: compraSchema }),
};
