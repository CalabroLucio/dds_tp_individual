import { crearEntorno } from '../helpers/fabricas.js';
import { validarRespuesta } from '../helpers/contrato.js';
import { enDias, publicarEvento } from '../helpers/datos.js';

describe('Historia 4 — el comprador ve sus compras', () => {
  let entorno;
  let ana;
  let evento20;
  let eventoHoy;

  beforeEach(async () => {
    entorno = await crearEntorno({ ahora: new Date('2026-12-01T10:00:00-03:00') });
    ana = await entorno.como('ana@tickets.test');
    evento20 = publicarEvento(entorno, 'martina@tickets.test', {
      nombre: 'Festival en 20 días',
      fecha: enDias(entorno, 20),
      tiposEntrada: [{ nombre: 'General', precio: 1000, cupo: 50 }],
    });
    eventoHoy = publicarEvento(entorno, 'joaquin@tickets.test', {
      nombre: 'Show de hoy',
      fecha: new Date('2026-12-01T22:00:00-03:00').toISOString(),
      tiposEntrada: [{ nombre: 'General', precio: 500, cupo: 50 }],
    });
  });

  const comprar = async (cliente, evento, cantidad = 1) =>
    (
      await cliente
        .post('/compras')
        .send({ eventoId: evento.id, tipoEntradaId: evento.tiposEntrada[0].id, cantidad })
    ).body;
  const pagar = (cliente, compra) =>
    cliente.post(`/compras/${compra.id}/pagos`).send({ medioPago: 'TARJETA_VISA' });

  it('escenarios 1–4: lista solo las propias, más recientes primero, con días solo en CONFIRMADAS', async () => {
    const pendiente = await comprar(ana, evento20);
    entorno.reloj.avanzarMinutos(1);
    const confirmada20 = await comprar(ana, evento20, 2);
    await pagar(ana, confirmada20);
    entorno.reloj.avanzarMinutos(1);
    const confirmadaHoy = await comprar(ana, eventoHoy);
    await pagar(ana, confirmadaHoy);
    const bruno = await entorno.como('bruno@tickets.test');
    await comprar(bruno, evento20);

    const res = await ana.get('/compras');
    expect(res.status).toBe(200);
    await validarRespuesta('/compras', 'get', res);
    expect(res.body.map((c) => c.id)).toEqual([confirmadaHoy.id, confirmada20.id, pendiente.id]);
    expect(res.body.map((c) => [c.estado, c.diasParaEvento])).toEqual([
      ['CONFIRMADA', 0],
      ['CONFIRMADA', 20],
      ['PENDIENTE', null],
    ]);
    expect(res.body.every((c) => c.comprador.nombre === 'Ana')).toBe(true);
  });

  it('escenario 5: una CONFIRMADA de un evento que ya empezó figura como evento realizado', async () => {
    const compra = await comprar(ana, eventoHoy);
    await pagar(ana, compra);
    entorno.reloj.fijar(new Date('2026-12-01T22:30:00-03:00'));
    const res = await ana.get('/compras');
    expect(res.body[0]).toMatchObject({ estado: 'CONFIRMADA', diasParaEvento: null, eventoRealizado: true });
  });

  it('las PENDIENTES vencidas se muestran CANCELADAS aunque el job no haya corrido', async () => {
    await comprar(ana, evento20);
    entorno.reloj.avanzarMinutos(16);
    const res = await ana.get('/compras');
    expect(res.body[0].estado).toBe('CANCELADA');
  });

  it('GET /compras/{id} devuelve el historial al comprador y al organizador del evento', async () => {
    const compra = await comprar(ana, evento20);
    await pagar(ana, compra);

    const res = await ana.get(`/compras/${compra.id}`);
    expect(res.status).toBe(200);
    await validarRespuesta('/compras/{compraId}', 'get', res);
    expect(res.body.historial.map((h) => [h.estado, h.quien.tipo, h.quien.nombre])).toEqual([
      ['PENDIENTE', 'COMPRADOR', 'Ana Gómez'],
      ['CONFIRMADA', 'COMPRADOR', 'Ana Gómez'],
    ]);
    expect(res.body.resenia).toBeNull();

    const martina = await entorno.como('martina@tickets.test');
    const comoOrganizador = await martina.get(`/compras/${compra.id}`);
    expect(comoOrganizador.status).toBe(200);
    expect(comoOrganizador.body.acciones.puedePagar).toBe(false);
  });

  it('rechaza ver una compra ajena (403), un id mal formado (400) y uno inexistente (404)', async () => {
    const compra = await comprar(ana, evento20);
    const bruno = await entorno.como('bruno@tickets.test');
    const joaquin = await entorno.como('joaquin@tickets.test');

    const ajena = await bruno.get(`/compras/${compra.id}`);
    expect(ajena.status).toBe(403);
    await validarRespuesta('/compras/{compraId}', 'get', ajena);
    expect((await joaquin.get(`/compras/${compra.id}`)).status).toBe(403);
    expect((await ana.get('/compras/xyz')).status).toBe(400);
    expect((await ana.get('/compras/00000000-0000-4000-8000-000000000000')).status).toBe(404);
  });

  it('un organizador no tiene "Mis compras"', async () => {
    const martina = await entorno.como('martina@tickets.test');
    const res = await martina.get('/compras');
    expect(res.status).toBe(403);
    await validarRespuesta('/compras', 'get', res);
  });
});
