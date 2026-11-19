import { z, uuid } from './zod.js';

const precio = z.coerce
  .number({ message: 'Debe ser un número' })
  .min(0, { message: 'No puede ser negativo' });

// Parámetros de GET /eventos (contracts/openapi.yaml).
export const busquedaSchema = z
  .object({
    q: z.string().trim().max(100).optional(),
    categoriaId: uuid.optional(),
    precioMin: precio.optional(),
    precioMax: precio.optional(),
    orden: z.enum(['precio', 'fecha', 'puntaje']).default('fecha'),
    direccion: z.enum(['asc', 'desc']).optional(),
  })
  .refine((c) => c.precioMin === undefined || c.precioMax === undefined || c.precioMin <= c.precioMax, {
    path: ['precioMax'],
    message: 'El precio máximo debe ser mayor o igual al mínimo',
  });
