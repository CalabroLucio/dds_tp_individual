import { crearContexto } from '../../../src/contexto.js';
import { crearApp } from '../../../src/app.js';
import { cargarReglas } from '../../../src/config/reglas.js';
import { cargarSeedBase, PASSWORD_DEMO } from '../../../src/seed/seed.js';

// Levanta el servidor real en un puerto efímero para los E2E (viajes completos con fetch).
export async function levantarServidor({ reglas = {}, reloj } = {}) {
  const contexto = crearContexto({ reglas: cargarReglas({}, reglas), ...(reloj ? { reloj } : {}) });
  const datos = cargarSeedBase(contexto);
  const app = crearApp(contexto);

  const servidor = await new Promise((resolve) => {
    const s = app.listen(0, '127.0.0.1', () => resolve(s));
  });
  const url = `http://127.0.0.1:${servidor.address().port}`;

  async function api(metodo, ruta, { token, body } = {}) {
    const res = await fetch(`${url}${ruta}`, {
      method: metodo,
      headers: {
        ...(body ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    const texto = await res.text();
    return { status: res.status, body: texto ? JSON.parse(texto) : {} };
  }

  async function login(email) {
    const res = await api('POST', '/auth/login', { body: { email, password: PASSWORD_DEMO } });
    if (res.status !== 200) throw new Error(`Login fallido para ${email}`);
    return res.body.token;
  }

  const cerrar = () => new Promise((resolve) => servidor.close(resolve));
  return { url, contexto, datos, api, login, cerrar };
}
