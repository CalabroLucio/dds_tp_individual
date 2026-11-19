import { z } from 'zod';

// Mensajes de validación en español para todo el backend.
z.config(z.locales.es());

// Id de ruta: todos los ids son UUID (data-model.md). Un id mal formado es 400, no 404 (constitution I).
export const uuid = z.uuid({ message: 'Debe ser un identificador válido' });

export { z };
