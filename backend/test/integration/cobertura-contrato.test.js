import { readFileSync } from 'node:fs';
import request from 'supertest';
import YAML from 'yaml';
import { RUTA_CONTRATO } from '../../src/config/env.js';
import { crearEntorno } from '../helpers/fabricas.js';

// Toda operación del contrato tiene una ruta implementada (constitution IV): ninguna responde "ruta inexistente".
const contrato = YAML.parse(readFileSync(RUTA_CONTRATO, 'utf8'));
const UUID = '00000000-0000-4000-8000-000000000000';
const operaciones = Object.entries(contrato.paths).flatMap(([ruta, metodos]) =>
  Object.keys(metodos)
    .filter((m) => ['get', 'post', 'put', 'delete'].includes(m))
    .map((metodo) => [metodo.toUpperCase(), ruta]),
);

describe('cobertura del contrato OpenAPI', () => {
  let entorno;
  beforeAll(async () => {
    entorno = await crearEntorno();
  });

  it('el contrato define 21 operaciones', () => {
    expect(operaciones).toHaveLength(21);
  });

  it.each(operaciones)('%s %s está implementada', async (metodo, ruta) => {
    const url = ruta.replace(/\{[^}]+\}/g, UUID);
    const res = await request(entorno.app)[metodo.toLowerCase()](url).send({});
    expect(res.body?.error?.codigo).not.toBe('RUTA_INEXISTENTE');
    expect(res.status).not.toBe(500);
  });
});
