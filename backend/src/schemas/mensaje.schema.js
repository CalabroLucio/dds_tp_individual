import { z } from './zod.js';

// data-model.md · Mensaje.texto (1–500 caracteres tras quitar espacios). El autor (Mensaje.autorId) sale de la
// sesión y debe ser el comprador o el organizador del evento (lo valida el servicio).
export const nuevoMensajeSchema = z.object({
  texto: z
    .string({ message: 'Escribí un mensaje' })
    .trim()
    .min(1, { message: 'El mensaje no puede estar vacío' })
    .max(500, { message: 'El mensaje admite hasta 500 caracteres' }),
});

export const mensajesQuerySchema = z.object({
  desde: z.iso
    .datetime({ offset: true, message: 'Debe ser una fecha y hora ISO 8601' })
    .transform((s) => new Date(s))
    .optional(),
});
