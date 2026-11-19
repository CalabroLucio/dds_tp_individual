import { z } from 'zod';
import { fileURLToPath } from 'node:url';

export const SECRETO_DESARROLLO = 'secreto-solo-para-desarrollo-local';

const esquemaEntorno = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  HOST: z.string().default('0.0.0.0'),
  JWT_SECRET: z.string().min(1).default(SECRETO_DESARROLLO),
  JWT_EXPIRACION: z.string().default('8h'),
  BCRYPT_COSTO: z.coerce.number().int().min(4).max(14).default(10),
  TZ: z.string().default('America/Argentina/Buenos_Aires'),
});

export function cargarEntorno(env = process.env) {
  const resultado = esquemaEntorno.safeParse(env);
  if (!resultado.success) {
    const problemas = resultado.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
    throw new Error(`Configuración de entorno inválida: ${problemas}`);
  }
  return Object.freeze(resultado.data);
}

// Contrato OpenAPI: fuente de verdad servida en /api-docs y usada por los tests de contrato.
export const RUTA_CONTRATO = fileURLToPath(
  new URL('../../../specs/001-ai-ticket-it/contracts/openapi.yaml', import.meta.url),
);
