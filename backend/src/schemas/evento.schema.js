import { z, uuid } from './zod.js';

const tieneHastaDosDecimales = (n) => Math.abs(n * 100 - Math.round(n * 100)) < 1e-9;

// data-model.md · TipoEntrada.nombre, TipoEntrada.descripcion, TipoEntrada.precio y TipoEntrada.cupo.
const nuevoTipoEntrada = z.object({
  nombre: z.string().trim().min(1, { message: 'Ingresá el nombre del tipo de entrada' }).max(60),
  descripcion: z.string().trim().max(300),
  precio: z
    .number({ message: 'El precio debe ser un número' })
    .min(0, { message: 'El precio no puede ser negativo' })
    .refine(tieneHastaDosDecimales, { message: 'El precio admite hasta dos decimales' }),
  cupo: z
    .number({ message: 'El cupo debe ser un número' })
    .int({ message: 'El cupo debe ser un número entero' })
    .min(1, { message: 'El cupo debe ser mayor a 0' }),
});

// data-model.md · Evento.nombre, Evento.descripcion, Evento.categoriaId, Evento.fecha, Evento.multimedia y
// Evento.tiposEntrada. Que la fecha sea futura y que la categoría exista se valida en el servicio.
export const nuevoEventoSchema = z
  .object({
    nombre: z.string().trim().min(1, { message: 'Ingresá el nombre del evento' }).max(120),
    descripcion: z.string().trim().min(1, { message: 'Ingresá una descripción' }).max(2000),
    categoriaId: uuid,
    fecha: z.iso
      .datetime({ offset: true, message: 'Ingresá una fecha y hora válidas' })
      .transform((s) => new Date(s)),
    multimedia: z
      .array(z.url({ protocol: /^https?$/, message: 'Debe ser un enlace http o https' }))
      .default([]),
    tiposEntrada: z
      .array(nuevoTipoEntrada)
      .min(1, { message: 'El evento necesita al menos un tipo de entrada' }),
  })
  .superRefine((evento, ctx) => {
    const vistos = new Set();
    evento.tiposEntrada.forEach((tipo, indice) => {
      const clave = tipo.nombre.toLowerCase();
      if (vistos.has(clave)) {
        ctx.addIssue({
          code: 'custom',
          path: ['tiposEntrada', indice, 'nombre'],
          message: 'Ya hay otro tipo de entrada con ese nombre',
        });
      }
      vistos.add(clave);
    });
  });

export const eventoIdParams = z.object({ eventoId: uuid });
