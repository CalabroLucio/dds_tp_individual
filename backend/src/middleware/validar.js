import { errores } from '../errors/index.js';

// Valida body, query y params con Zod (constitution I) y deja los datos ya parseados en `req.datos`.
// En Express 5 `req.query` es de solo lectura, por eso no se sobrescribe.
export function validar({ body, query, params } = {}) {
  return (req, _res, next) => {
    const detalles = [];
    const datos = { body: req.body, query: req.query, params: req.params };

    for (const [origen, esquema] of Object.entries({ body, query, params })) {
      if (!esquema) continue;
      const resultado = esquema.safeParse(req[origen] ?? {});
      if (resultado.success) {
        datos[origen] = resultado.data;
      } else {
        for (const issue of resultado.error.issues) {
          detalles.push({ campo: issue.path.join('.') || origen, mensaje: issue.message });
        }
      }
    }

    if (detalles.length > 0) return next(errores.validacion(detalles));
    req.datos = datos;
    next();
  };
}
