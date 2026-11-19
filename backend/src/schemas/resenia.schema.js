import { z } from './zod.js';

// data-model.md · Resenia.puntaje (entero 1 a 5) y Resenia.comentario (1–500 caracteres). Resenia.compraId sale
// de la ruta y el servicio verifica que la compra esté UTILIZADA y no tenga otra reseña.
export const nuevaReseniaSchema = z.object({
  puntaje: z
    .number({ message: 'Elegí un puntaje' })
    .int({ message: 'El puntaje debe ser un número entero' })
    .min(1, { message: 'El puntaje mínimo es 1' })
    .max(5, { message: 'El puntaje máximo es 5' }),
  comentario: z
    .string({ message: 'Escribí un comentario' })
    .trim()
    .min(1, { message: 'Escribí un comentario' })
    .max(500, { message: 'El comentario admite hasta 500 caracteres' }),
});
