import request from 'supertest';
import { crearContexto } from '../../src/contexto.js';
import { crearApp } from '../../src/app.js';
import { cargarReglas } from '../../src/config/reglas.js';
import { cargarSeedBase, PASSWORD_DEMO } from '../../src/seed/seed.js';
import { crearRelojDePrueba } from './relojDePrueba.js';

export const PASSWORD_SEED = PASSWORD_DEMO;
export const AHORA_POR_DEFECTO = new Date('2026-12-01T15:00:00-03:00');

// Entorno aislado por test: store limpio, reloj controlable, seed base (categorías y 5 usuarios).
export async function crearEntorno({ ahora = AHORA_POR_DEFECTO, reglas = {} } = {}) {
  const reloj = crearRelojDePrueba(ahora);
  const contexto = crearContexto({ reloj, reglas: cargarReglas({}, reglas) });
  const datos = cargarSeedBase(contexto);
  const app = crearApp(contexto);

  const tokens = new Map();
  async function loginComo(email) {
    if (tokens.has(email)) return tokens.get(email);
    const res = await request(app).post('/auth/login').send({ email, password: PASSWORD_SEED });
    if (res.status !== 200) throw new Error(`No se pudo iniciar sesión como ${email}: ${res.status}`);
    tokens.set(email, res.body.token);
    return res.body.token;
  }

  // Atajo: un agente supertest con el token de ese usuario ya puesto.
  async function como(email) {
    const token = await loginComo(email);
    const conToken = (metodo) => (ruta) => request(app)[metodo](ruta).set('Authorization', `Bearer ${token}`);
    return {
      get: conToken('get'),
      post: conToken('post'),
      put: conToken('put'),
      delete: conToken('delete'),
    };
  }

  return { app, contexto, reloj, datos, loginComo, como };
}
