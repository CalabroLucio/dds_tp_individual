import request from 'supertest';
import { crearEntorno } from '../helpers/fabricas.js';
import { validarRespuesta } from '../helpers/contrato.js';
import { enDias, publicarEvento } from '../helpers/datos.js';

const enMinutosIso = (entorno, m) => new Date(entorno.reloj.ahora().getTime() + m * 60_000).toISOString();

describe('Historia 3 — comprar entradas', () => {
  let entorno;
  let ana;

  beforeEach(async () => {
    entorno = await crearEntorno();
    ana = await entorno.como('ana@tickets.test');
  });

  const eventoConCupo = (cupo, cambios = {}) =>
    publicarEvento(entorno, 'martina@tickets.test', {
      fecha: enDias(entorno, 7),
      tiposEntrada: [{ nombre: 'General', precio: 1500, cupo }],
      ...cambios,
    });

  const comprar = (cliente, evento, cantidad, tipo = evento.tiposEntrada[0]) =>
    cliente.post('/compras').send({ eventoId: evento.id, tipoEntradaId: tipo.id, cantidad });

  it('escenario 1: crea la compra PENDIENTE por el total y descuenta el cupo', async () => {
    const evento = eventoConCupo(10);
    const res = await comprar(ana, evento, 2);

    expect(res.status).toBe(201);
    await validarRespuesta('/compras', 'post', res);
    expect(res.body).toMatchObject({
      estado: 'PENDIENTE',
      cantidad: 2,
      total: 3000,
      tipoEntrada: { nombre: 'General', precio: 1500 },
      comprador: { nombre: 'Ana' },
      diasParaEvento: null,
      eventoRealizado: false,
      acciones: { puedePagar: true, puedeCancelar: true, puedeMarcarUtilizada: false, puedeResenar: false },
    });
    expect(new Date(res.body.expiraEn) - entorno.reloj.ahora()).toBe(15 * 60_000);

    const detalle = await ana.get(`/eventos/${evento.id}`);
    expect(detalle.body.tiposEntrada[0].cupoDisponible).toBe(8);
  });

  it('escenario 5: rechaza si la cantidad supera el cupo disponible e informa cuántas quedan', async () => {
    const evento = eventoConCupo(3);
    const res = await comprar(ana, evento, 4);
    expect(res.status).toBe(409);
    expect(res.body.error).toMatchObject({
      codigo: 'CUPO_INSUFICIENTE',
      mensaje: 'Solo quedan 3 entradas de este tipo',
    });
    await validarRespuesta('/compras', 'post', res);
  });

  it('escenario 6 (SC-002): 50 solicitudes simultáneas sobre cupo 10 → exactamente 10 creadas y 40 rechazadas', async () => {
    const evento = eventoConCupo(10);
    const tokens = await Promise.all(
      ['ana', 'bruno', 'carla'].map((n) => entorno.loginComo(`${n}@tickets.test`)),
    );
    const respuestas = await Promise.all(
      Array.from({ length: 50 }, (_, i) =>
        request(entorno.app)
          .post('/compras')
          .set('Authorization', `Bearer ${tokens[i % 3]}`)
          .send({ eventoId: evento.id, tipoEntradaId: evento.tiposEntrada[0].id, cantidad: 1 }),
      ),
    );
    const estados = respuestas.map((r) => r.status);
    expect(estados.filter((s) => s === 201)).toHaveLength(10);
    expect(estados.filter((s) => s === 409)).toHaveLength(40);
    const detalle = await ana.get(`/eventos/${evento.id}`);
    expect(detalle.body.tiposEntrada[0]).toMatchObject({ cupoDisponible: 0, agotado: true });
  });

  it('escenario 7: un organizador no puede comprar entradas de su propio evento', async () => {
    const evento = eventoConCupo(10);
    const martina = await entorno.como('martina@tickets.test');
    const propio = await comprar(martina, evento, 1);
    expect(propio.status).toBe(403);
    expect(propio.body.error.codigo).toBe('ORGANIZADOR_NO_PUEDE_COMPRAR');
    await validarRespuesta('/compras', 'post', propio);

    const joaquin = await entorno.como('joaquin@tickets.test');
    const ajeno = await comprar(joaquin, evento, 1);
    expect(ajeno.status).toBe(403);
    expect(ajeno.body.error.codigo).toBe('ROL_NO_PERMITIDO');
  });

  it('escenario 8: rechaza cantidades menores a 1 o no enteras', async () => {
    const evento = eventoConCupo(10);
    for (const cantidad of [0, -2, 1.5, '2']) {
      const res = await comprar(ana, evento, cantidad);
      expect(res.status).toBe(400);
      expect(res.body.error.codigo).toBe('VALIDACION');
    }
  });

  it('escenario 9: rechaza más de 10 entradas por compra con 409 aunque haya cupo', async () => {
    const evento = eventoConCupo(30);
    const res = await comprar(ana, evento, 11);
    expect(res.status).toBe(409);
    expect(res.body.error).toMatchObject({
      codigo: 'CANTIDAD_EXCEDE_MAXIMO',
      mensaje: 'El máximo por compra es de 10 entradas',
    });
    expect((await comprar(ana, evento, 10)).status).toBe(201);
  });

  it('escenario 10: un evento que empieza en 20 minutos avisa que no es cancelable pero se puede comprar', async () => {
    const evento = eventoConCupo(10, { fecha: enMinutosIso(entorno, 20) });
    const detalle = await ana.get(`/eventos/${evento.id}`);
    expect(detalle.body).toMatchObject({ compraAbierta: true, avisoNoCancelable: true });

    const res = await comprar(ana, evento, 1);
    expect(res.status).toBe(201);
    expect(res.body.acciones.puedeCancelar).toBe(false);
  });

  it('escenario 11: rechaza la compra de un evento que ya empezó', async () => {
    const evento = eventoConCupo(10, { fecha: enMinutosIso(entorno, 5) });
    entorno.reloj.avanzarMinutos(6);
    const res = await comprar(ana, evento, 1);
    expect(res.status).toBe(409);
    expect(res.body.error.codigo).toBe('EVENTO_NO_DISPONIBLE');
  });

  it('rechaza un tipo de entrada que no pertenece al evento y un evento inexistente', async () => {
    const evento = eventoConCupo(10);
    const otro = eventoConCupo(10);
    const tipoAjeno = await comprar(ana, evento, 1, otro.tiposEntrada[0]);
    expect(tipoAjeno.status).toBe(404);

    const inexistente = await ana.post('/compras').send({
      eventoId: '00000000-0000-4000-8000-000000000000',
      tipoEntradaId: evento.tiposEntrada[0].id,
      cantidad: 1,
    });
    expect(inexistente.status).toBe(404);
    await validarRespuesta('/compras', 'post', inexistente);
  });
});
