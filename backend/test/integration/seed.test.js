import request from 'supertest';
import { crearContexto } from '../../src/contexto.js';
import { crearApp } from '../../src/app.js';
import { cargarReglas } from '../../src/config/reglas.js';
import { cargarSeed } from '../../src/seed/index.js';
import { PASSWORD_DEMO } from '../../src/seed/seed.js';
import { diasCalendario, minutosEntre } from '../../src/utils/fechas.js';
import { crearRelojDePrueba } from '../helpers/relojDePrueba.js';
import { validarRespuesta } from '../helpers/contrato.js';

describe('seed de demostración (FR-029)', () => {
  const ahora = new Date('2026-12-01T18:00:00-03:00');
  let contexto;
  let app;

  beforeEach(() => {
    contexto = crearContexto({ reloj: crearRelojDePrueba(ahora), reglas: cargarReglas({}) });
    cargarSeed(contexto);
    app = crearApp(contexto);
  });

  const login = async (email) =>
    (await request(app).post('/auth/login').send({ email, password: PASSWORD_DEMO })).body.token;
  const eventos = () => contexto.repos.eventos.listar();
  const compras = () => contexto.repos.compras.listar();

  it('tiene al menos 2 organizadores y 3 compradores que pueden iniciar sesión', async () => {
    const usuarios = [...contexto.store.usuarios.values()];
    expect(usuarios.filter((u) => u.rol === 'ORGANIZADOR').length).toBeGreaterThanOrEqual(2);
    expect(usuarios.filter((u) => u.rol === 'COMPRADOR').length).toBeGreaterThanOrEqual(3);
    expect(await login('ana@tickets.test')).toEqual(expect.any(String));
  });

  it('tiene eventos en ~20 minutos, mañana y en 20 días, en varias categorías', () => {
    const futuros = eventos().filter((e) => e.fecha > ahora);
    expect(
      futuros.some((e) => minutosEntre(ahora, e.fecha) >= 15 && minutosEntre(ahora, e.fecha) <= 25),
    ).toBe(true);
    expect(futuros.some((e) => diasCalendario(ahora, e.fecha) === 1)).toBe(true);
    expect(futuros.some((e) => diasCalendario(ahora, e.fecha) === 20)).toBe(true);
    expect(new Set(futuros.map((e) => e.categoriaId)).size).toBeGreaterThanOrEqual(5);
  });

  it('el evento de ~20 minutos tiene compras CONFIRMADAS para demostrar UTILIZADA', () => {
    const pronto = eventos().find((e) => e.fecha > ahora && minutosEntre(ahora, e.fecha) <= 25);
    const confirmadas = compras().filter((c) => c.eventoId === pronto.id && c.estado === 'CONFIRMADA');
    expect(confirmadas.length).toBeGreaterThanOrEqual(1);
  });

  it('tiene eventos pasados con compras UTILIZADAS y reseñas, y puntajes distintos por organizador', async () => {
    const pasados = eventos().filter((e) => e.fecha < ahora);
    expect(pasados.length).toBeGreaterThanOrEqual(2);
    const utilizadas = compras().filter((c) => c.estado === 'UTILIZADA');
    expect(utilizadas.length).toBeGreaterThanOrEqual(2);
    for (const r of contexto.store.resenias.values()) {
      expect(contexto.repos.compras.porId(r.compraId).estado).toBe('UTILIZADA');
    }

    const token = await login('ana@tickets.test');
    const res = await request(app).get('/eventos?orden=puntaje').set('Authorization', `Bearer ${token}`);
    await validarRespuesta('/eventos', 'get', res);
    const puntajes = new Set(res.body.map((e) => e.organizador.puntaje));
    expect(puntajes.size).toBeGreaterThanOrEqual(2);
    expect([...puntajes].every((p) => p !== null)).toBe(true);
  });

  it('cada compra sembrada respeta el cupo y tiene historial coherente con su estado', () => {
    for (const evento of eventos()) {
      for (const tipo of evento.tiposEntrada) {
        const ocupadas = compras()
          .filter(
            (c) => c.tipoEntradaId === tipo.id && ['PENDIENTE', 'CONFIRMADA', 'UTILIZADA'].includes(c.estado),
          )
          .reduce((t, c) => t + c.cantidad, 0);
        expect(ocupadas).toBeLessThanOrEqual(tipo.cupo);
      }
    }
    for (const compra of compras()) expect(compra.historial.at(-1).estado).toBe(compra.estado);
  });

  it('todas las respuestas del seed cumplen el contrato (mis compras de Ana con chat y favoritos)', async () => {
    const token = await login('ana@tickets.test');
    const mias = await request(app).get('/compras').set('Authorization', `Bearer ${token}`);
    await validarRespuesta('/compras', 'get', mias);
    expect(mias.body.length).toBeGreaterThanOrEqual(2);

    const conChat = mias.body.find((c) => contexto.repos.compras.porId(c.id).mensajes.length > 0);
    expect(conChat).toBeDefined();
    const favoritos = await request(app).get('/favoritos').set('Authorization', `Bearer ${token}`);
    expect(favoritos.body.length).toBeGreaterThanOrEqual(1);
  });
});
