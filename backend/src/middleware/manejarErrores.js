import { ErrorApp, errores } from '../errors/index.js';

export function rutaInexistente(_req, _res, next) {
  next(errores.rutaInexistente());
}

// Traduce cualquier error a la forma { error: { codigo, mensaje, detalles? } } del contrato.
export function manejarErrores(error, _req, res, _next) {
  if (error instanceof ErrorApp) {
    return res.status(error.status).json(error.toJSON());
  }
  // JSON mal formado en el cuerpo (lo lanza express.json).
  if (error?.type === 'entity.parse.failed') {
    return res
      .status(400)
      .json(errores.validacion(undefined, 'El cuerpo de la solicitud no es un JSON válido').toJSON());
  }
  if (process.env.NODE_ENV !== 'test') console.error(error);
  return res.status(500).json({ error: { codigo: 'ERROR_INTERNO', mensaje: 'Ocurrió un error inesperado' } });
}
