// Constantes de negocio (data-model.md §Configuración). Se pueden sobrescribir por variable de entorno.
export const REGLAS_POR_DEFECTO = Object.freeze({
  LIMITE_CANCELACION_MIN: 30,
  EXPIRACION_PENDIENTE_MIN: 15,
  AUTO_UTILIZADA_HORAS: 24,
  MAX_ENTRADAS_POR_COMPRA: 10,
  INTERVALO_JOB_SEG: 30,
});

function leerPositivo(env, nombre, porDefecto) {
  const valor = env[nombre];
  if (valor === undefined || valor === '') return porDefecto;
  const numero = Number(valor);
  if (!Number.isFinite(numero) || numero <= 0) {
    throw new Error(`La variable de entorno ${nombre} debe ser un número positivo (recibido: "${valor}")`);
  }
  return numero;
}

export function cargarReglas(env = process.env, sobrescrituras = {}) {
  const reglas = {};
  for (const [nombre, porDefecto] of Object.entries(REGLAS_POR_DEFECTO)) {
    reglas[nombre] = leerPositivo(env, nombre, porDefecto);
  }
  return Object.freeze({ ...reglas, ...sobrescrituras });
}
