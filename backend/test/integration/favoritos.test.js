import { crearEntorno } from '../helpers/fabricas.js';
import { validarRespuesta } from '../helpers/contrato.js';
import { enDias, publicarEvento } from '../helpers/datos.js';

describe('Historia 10 — favoritos', () => {
  let entorno;
  let ana;
  let rock;
  let jazz;

  beforeEach(async () => {
    entorno = await crearEntorno();
    ana = await entorno.como('ana@tickets.test');
    rock = publicarEvento(entorno, 'martina@tickets.test', { nombre: 'Rock', fecha: enDias(entorno, 5) });
    jazz = publicarEvento(entorno, 'joaquin@tickets.test', { nombre: 'Jazz', fecha: enDias(entorno, 2) });
  });

  const marcar = (cliente, evento) => cliente.put(`/favoritos/${evento.id}`);
  const quitar = (cliente, evento) => cliente.delete(`/favoritos/${evento.id}`);

  it('escenarios 1 y 3: marca favoritos sin duplicar y los lista; esFavorito se refleja en catálogo y detalle', async () => {
    const res = await marcar(ana, rock);
    expect(res.status).toBe(204);
    await validarRespuesta('/favoritos/{eventoId}', 'put', res);
    await marcar(ana, rock);
    await marcar(ana, jazz);

    const lista = await ana.get('/favoritos');
    expect(lista.status).toBe(200);
    await validarRespuesta('/favoritos', 'get', lista);
    expect(lista.body.map((e) => e.nombre)).toEqual(['Jazz', 'Rock']);
    expect(lista.body.every((e) => e.esFavorito)).toBe(true);

    const catalogo = await ana.get('/eventos');
    expect(Object.fromEntries(catalogo.body.map((e) => [e.nombre, e.esFavorito]))).toEqual({
      Jazz: true,
      Rock: true,
    });
    expect((await ana.get(`/eventos/${rock.id}`)).body.esFavorito).toBe(true);
  });

  it('escenario 2: desmarcar lo quita de la lista (y es idempotente)', async () => {
    await marcar(ana, rock);
    const res = await quitar(ana, rock);
    expect(res.status).toBe(204);
    await validarRespuesta('/favoritos/{eventoId}', 'delete', res);
    expect((await quitar(ana, rock)).status).toBe(204);
    expect((await ana.get('/favoritos')).body).toEqual([]);
  });

  it('escenario 4: cada comprador ve solo los suyos', async () => {
    const bruno = await entorno.como('bruno@tickets.test');
    await marcar(ana, rock);
    await marcar(bruno, jazz);
    expect((await ana.get('/favoritos')).body.map((e) => e.nombre)).toEqual(['Rock']);
    expect((await bruno.get('/favoritos')).body.map((e) => e.nombre)).toEqual(['Jazz']);
    expect((await bruno.get(`/eventos/${rock.id}`)).body.esFavorito).toBe(false);
  });

  it('un organizador no tiene favoritos y un evento inexistente da 404', async () => {
    const martina = await entorno.como('martina@tickets.test');
    const org = await marcar(martina, rock);
    expect(org.status).toBe(403);
    await validarRespuesta('/favoritos/{eventoId}', 'put', org);
    expect((await martina.get('/favoritos')).status).toBe(403);

    const inexistente = await ana.put('/favoritos/00000000-0000-4000-8000-000000000000');
    expect(inexistente.status).toBe(404);
    await validarRespuesta('/favoritos/{eventoId}', 'put', inexistente);
    expect((await ana.put('/favoritos/no-uuid')).status).toBe(400);
  });
});
