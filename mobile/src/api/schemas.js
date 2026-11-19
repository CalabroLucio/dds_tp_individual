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

export const categoriaSchema = z.object({ id: z.string(), nombre: z.string(), descripcion: z.string() });

export const personaSchema = z.object({ id: z.string(), nombre: z.string(), apellido: z.string() });

export const reseniaSchema = z.object({
  id: z.string(),
  compraId: z.string(),
  comprador: personaSchema,
  evento: z.object({ id: z.string(), nombre: z.string() }),
  puntaje: z.number().int(),
  comentario: z.string(),
  creadaEn: z.string(),
});

export const organizadorResumenSchema = personaSchema.extend({
  puntaje: z.number().nullable(),
  cantidadResenias: z.number().int(),
});

export const eventoResumenSchema = z.object({
  id: z.string(),
  nombre: z.string(),
  categoria: categoriaSchema,
  fecha: z.string(),
  imagenPrincipal: z.string().nullable().optional(),
  precioDesde: z.number(),
  organizador: organizadorResumenSchema,
  esFavorito: z.boolean(),
});

export const tipoEntradaSchema = z.object({
  id: z.string(),
  nombre: z.string(),
  descripcion: z.string(),
  precio: z.number(),
  cupoTotal: z.number().int(),
  cupoDisponible: z.number().int(),
  agotado: z.boolean(),
});

export const eventoDetalleSchema = z.object({
  id: z.string(),
  nombre: z.string(),
  descripcion: z.string(),
  categoria: categoriaSchema,
  fecha: z.string(),
  multimedia: z.array(z.string()),
  tiposEntrada: z.array(tipoEntradaSchema),
  organizador: organizadorResumenSchema.extend({ resenias: z.array(reseniaSchema) }),
  esFavorito: z.boolean(),
  compraAbierta: z.boolean(),
  avisoNoCancelable: z.boolean(),
  maxEntradasPorCompra: z.number().int(),
});

// Al crear solo se usa el id para navegar; el resto del detalle se pide de nuevo.
export const eventoCreadoSchema = z.looseObject({ id: z.string() });
