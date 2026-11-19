import { z } from './zod.js';

// data-model.md · Usuario.email: formato email, comparado en minúsculas.
export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(z.email({ message: 'Ingresá un email válido' })),
  password: z.string().min(1, { message: 'Ingresá tu contraseña' }),
});
