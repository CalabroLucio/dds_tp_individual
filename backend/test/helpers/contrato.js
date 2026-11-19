import SwaggerParser from '@apidevtools/swagger-parser';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import { RUTA_CONTRATO } from '../../src/config/env.js';

// Verifica respuestas reales contra contracts/openapi.yaml (constitution IV, R7).
let documento;
const ajv = new Ajv2020({ allErrors: true, strict: false });
addFormats(ajv);
const validadores = new Map();

async function cargarDocumento() {
  documento ??= await SwaggerParser.dereference(RUTA_CONTRATO);
  return documento;
}

/**
 * @param {string} ruta plantilla del contrato, por ejemplo '/eventos/{eventoId}'
 * @param {string} metodo 'get' | 'post' | 'put' | 'delete'
 * @param {{ status: number, body: unknown }} respuesta respuesta de supertest u objeto equivalente
 */
export async function validarRespuesta(ruta, metodo, respuesta) {
  const doc = await cargarDocumento();
  const operacion = doc.paths[ruta]?.[metodo];
  if (!operacion) throw new Error(`El contrato no define ${metodo.toUpperCase()} ${ruta}`);

  const status = String(respuesta.status);
  const definicion = operacion.responses[status];
  if (!definicion) {
    throw new Error(`El contrato no documenta el status ${status} para ${metodo.toUpperCase()} ${ruta}`);
  }

  const schema = definicion.content?.['application/json']?.schema;
  const cuerpo = respuesta.body;
  const vacio =
    cuerpo === undefined ||
    cuerpo === '' ||
    (typeof cuerpo === 'object' && cuerpo !== null && Object.keys(cuerpo).length === 0);
  if (!schema) {
    if (!vacio)
      throw new Error(`La respuesta ${status} de ${metodo.toUpperCase()} ${ruta} debe tener cuerpo vacío`);
    return true;
  }

  const clave = `${metodo} ${ruta} ${status}`;
  if (!validadores.has(clave)) validadores.set(clave, ajv.compile(schema));
  const validar = validadores.get(clave);
  if (!validar(cuerpo)) {
    const problemas = validar.errors.map((e) => `${e.instancePath || '(raíz)'} ${e.message}`).join('; ');
    throw new Error(
      `Respuesta ${status} de ${metodo.toUpperCase()} ${ruta} no cumple el contrato: ${problemas}`,
    );
  }
  return true;
}
