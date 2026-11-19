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

export const estadoCompraSchema = z.enum([
  'PENDIENTE',
  'CONFIRMADA',
  'UTILIZADA',
  'CANCELADA',
  'REEMBOLSADA',
]);

export const medioPagoSchema = z.object({ id: z.string(), nombre: z.string() });

export const compraSchema = z.object({
  id: z.string(),
  evento: z.object({ id: z.string(), nombre: z.string(), fecha: z.string() }),
  tipoEntrada: z.object({ id: z.string(), nombre: z.string(), precio: z.number() }),
  comprador: personaSchema,
  cantidad: z.number().int(),
  total: z.number(),
  estado: estadoCompraSchema,
  creadaEn: z.string(),
  expiraEn: z.string().nullable(),
  diasParaEvento: z.number().int().nullable(),
  eventoRealizado: z.boolean(),
  acciones: z.object({
    puedePagar: z.boolean(),
    puedeCancelar: z.boolean(),
    puedeMarcarUtilizada: z.boolean(),
    puedeResenar: z.boolean(),
  }),
});

export const compraDetalleSchema = compraSchema.extend({
  historial: z.array(
    z.object({
      estado: estadoCompraSchema,
      quien: z.object({ tipo: z.string(), id: z.string().nullable(), nombre: z.string().nullable() }),
      fechaHora: z.string(),
    }),
  ),
  resenia: reseniaSchema.nullable(),
});

export const mensajeSchema = z.object({
  id: z.string(),
  autor: personaSchema.extend({ rol: rolSchema }),
  texto: z.string(),
  enviadoEn: z.string(),
});
