import { z } from 'zod';

// Esquemas de las respuestas de la API (contracts/openapi.yaml). Se validan al recibirlas.
export const rolSchema = z.enum(['COMPRADOR', 'ORGANIZADOR']);

export const usuarioSchema = z.object({
  id: z.string(),
  nombre: z.string(),
  apellido: z.string(),
  email: z.string(),
  rol: rolSchema,
});

export const loginRespuestaSchema = z.object({
  token: z.string(),
  usuario: usuarioSchema,
});
