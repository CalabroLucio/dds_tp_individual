import { crearEntorno } from '../helpers/fabricas.js';
import { validarRespuesta } from '../helpers/contrato.js';
import { enDias, publicarEvento } from '../helpers/datos.js';

const enMinutosIso = (entorno, m) => new Date(entorno.reloj.ahora().getTime() + m * 60_000).toISOString();

describe('Historia 5 — el comprador cancela y obtiene el reembolso', () => {
  let entorno;
  let ana;

  beforeEach(async () => {
    entorno = await crearEntorno();
    ana = await entorno.como('ana@tickets.test');
  });

  const evento = (fecha) =>
    publicarEvento(entorno, 'martina@tickets.test', {
      fecha,
      tiposEntrada: [{ nombre: 'General', precio: 1000, cupo: 4 }],
    });
  const comprar = async (ev, cantidad = 2, cliente = ana) =>
    (await cliente.post('/compras').send({ eventoId: ev.id, tipoEntradaId: ev.tiposEntrada[0].id, cantidad }))
      .body;
  const pagar = (compra) => ana.post(`/compras/${compra.id}/pagos`).send({ medioPago: 'TARJETA_VISA' });
  const cancelar = (compra, cliente = ana) => cliente.post(`/compras/${compra.id}/cancelacion`);
  const cupo = async (ev) => (await ana.get(`/eventos/${ev.id}`)).body.tiposEntrada[0].cupoDisponible;

  it('escenario 1: una CONFIRMADA con más de 30 minutos pasa a REEMBOLSADA y libera el cupo', async () => {
    const manana = evento(enDias(entorno, 1));
    const compra = await comprar(manana, 4);
    await pagar(compra);
    expect(await cupo(manana)).toBe(0);

    const res = await cancelar(compra);
    expect(res.status).toBe(200);
    await validarRespuesta('/compras/{compraId}/cancelacion', 'post', res);
    expect(res.body).toMatchObject({ estado: 'REEMBOLSADA', diasParaEvento: null });
    expect(await cupo(manana)).toBe(4);
    expect((await comprar(manana, 4)).estado).toBe('PENDIENTE');
  });

  it('escenario 2: una PENDIENTE pasa a CANCELADA y libera el cupo', async () => {
    const manana = evento(enDias(entorno, 1));
    const compra = await comprar(manana, 3);
    const res = await cancelar(compra);
    expect(res.body.estado).toBe('CANCELADA');
    expect(await cupo(manana)).toBe(4);
  });

  it('escenario 3: con 20 minutos para el evento se rechaza por fuera de plazo', async () => {
    const pronto = evento(enMinutosIso(entorno, 50));
    const compra = await comprar(pronto);
    await pagar(compra);
    entorno.reloj.avanzarMinutos(30); // faltan 20

    const res = await cancelar(compra);
    expect(res.status).toBe(409);
    expect(res.body.error.codigo).toBe('FUERA_DE_PLAZO');
    await validarRespuesta('/compras/{compraId}/cancelacion', 'post', res);
  });

  it('con 30 minutos exactos ya no se puede cancelar', async () => {
    const pronto = evento(enMinutosIso(entorno, 40));
    const compra = await comprar(pronto);
    entorno.reloj.avanzarMinutos(10);
    expect((await cancelar(compra)).body.error.codigo).toBe('FUERA_DE_PLAZO');
  });

  it('escenario 4: no se cancela una compra en estado final', async () => {
    const manana = evento(enDias(entorno, 1));
    const compra = await comprar(manana);
    await cancelar(compra);
    const otraVez = await cancelar(compra);
    expect(otraVez.status).toBe(409);
    expect(otraVez.body.error.codigo).toBe('ESTADO_INVALIDO');
  });

  it('escenario 5: no se cancela una compra ajena', async () => {
    const manana = evento(enDias(entorno, 1));
    const compra = await comprar(manana);
    const bruno = await entorno.como('bruno@tickets.test');
    const res = await cancelar(compra, bruno);
    expect(res.status).toBe(403);
    await validarRespuesta('/compras/{compraId}/cancelacion', 'post', res);
  });

  it('escenario 6: el historial registra quién canceló y cuándo', async () => {
    const manana = evento(enDias(entorno, 1));
    const compra = await comprar(manana);
    await pagar(compra);
    entorno.reloj.avanzarMinutos(5);
    await cancelar(compra);

    const detalle = await ana.get(`/compras/${compra.id}`);
    expect(detalle.body.historial.at(-1)).toMatchObject({
      estado: 'REEMBOLSADA',
      quien: { tipo: 'COMPRADOR', nombre: 'Ana Gómez' },
      fechaHora: entorno.reloj.ahora().toISOString(),
    });
  });
});
