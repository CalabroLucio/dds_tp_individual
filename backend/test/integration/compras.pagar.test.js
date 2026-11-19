import { crearEntorno } from '../helpers/fabricas.js';
import { validarRespuesta } from '../helpers/contrato.js';
import { enDias, publicarEvento } from '../helpers/datos.js';

describe('Historia 3 — pagar una compra (pago simulado)', () => {
  let entorno;
  let ana;
  let evento;
  let compra;

  beforeEach(async () => {
    entorno = await crearEntorno();
    ana = await entorno.como('ana@tickets.test');
    evento = publicarEvento(entorno, 'martina@tickets.test', {
      fecha: enDias(entorno, 7),
      tiposEntrada: [{ nombre: 'General', precio: 1000, cupo: 10 }],
    });
    const res = await ana
      .post('/compras')
      .send({ eventoId: evento.id, tipoEntradaId: evento.tiposEntrada[0].id, cantidad: 2 });
    compra = res.body;
  });

  const pagar = (cliente, medioPago, id = compra.id) =>
    cliente.post(`/compras/${id}/pagos`).send({ medioPago });
  const enStore = () => entorno.contexto.repos.compras.porId(compra.id);

  it('GET /medios-pago lista los medios simulados, incluido el que siempre se rechaza', async () => {
    const res = await ana.get('/medios-pago');
    expect(res.status).toBe(200);
    await validarRespuesta('/medios-pago', 'get', res);
    expect(res.body.map((m) => m.id)).toEqual([
      'TARJETA_VISA',
      'TARJETA_MASTERCARD',
      'DINERO_EN_CUENTA',
      'TARJETA_RECHAZADA',
    ]);
  });

  it('escenario 2: un pago aprobado confirma la compra y lo registra en el historial', async () => {
    entorno.reloj.avanzarMinutos(3);
    const res = await pagar(ana, 'TARJETA_VISA');
    expect(res.status).toBe(200);
    await validarRespuesta('/compras/{compraId}/pagos', 'post', res);
    expect(res.body).toMatchObject({ estado: 'CONFIRMADA', expiraEn: null, diasParaEvento: 7 });
    expect(enStore().historial.map((h) => h.estado)).toEqual(['PENDIENTE', 'CONFIRMADA']);
  });

  it('escenario 3: TARJETA_RECHAZADA → 402, sigue PENDIENTE con el cupo reservado y se puede reintentar', async () => {
    const rechazado = await pagar(ana, 'TARJETA_RECHAZADA');
    expect(rechazado.status).toBe(402);
    expect(rechazado.body.error.codigo).toBe('PAGO_RECHAZADO');
    await validarRespuesta('/compras/{compraId}/pagos', 'post', rechazado);
    expect(enStore().estado).toBe('PENDIENTE');
    const detalle = await ana.get(`/eventos/${evento.id}`);
    expect(detalle.body.tiposEntrada[0].cupoDisponible).toBe(8);

    const reintento = await pagar(ana, 'DINERO_EN_CUENTA');
    expect(reintento.status).toBe(200);
    expect(reintento.body.estado).toBe('CONFIRMADA');
  });

  it('rechaza pagar una compra ya CONFIRMADA', async () => {
    await pagar(ana, 'TARJETA_VISA');
    const res = await pagar(ana, 'TARJETA_MASTERCARD');
    expect(res.status).toBe(409);
    expect(res.body.error.codigo).toBe('ESTADO_INVALIDO');
    await validarRespuesta('/compras/{compraId}/pagos', 'post', res);
  });

  it('una PENDIENTE vencida (15 min) aunque el job no haya corrido: se cancela en el momento y responde 409', async () => {
    entorno.reloj.avanzarMinutos(15);
    const res = await pagar(ana, 'TARJETA_VISA');
    expect(res.status).toBe(409);
    expect(res.body.error.codigo).toBe('ESTADO_INVALIDO');
    expect(enStore().estado).toBe('CANCELADA');
    expect(enStore().historial.at(-1).quien.tipo).toBe('SISTEMA');
    const detalle = await ana.get(`/eventos/${evento.id}`);
    expect(detalle.body.tiposEntrada[0].cupoDisponible).toBe(10);
  });

  it('rechaza pagar una compra ajena (403) o con un medio desconocido (400)', async () => {
    const bruno = await entorno.como('bruno@tickets.test');
    const ajena = await pagar(bruno, 'TARJETA_VISA');
    expect(ajena.status).toBe(403);
    expect(ajena.body.error.codigo).toBe('NO_AUTORIZADO');

    const medio = await pagar(ana, 'BITCOIN');
    expect(medio.status).toBe(400);
  });

  it('compra inexistente → 404 y id mal formado → 400', async () => {
    expect((await pagar(ana, 'TARJETA_VISA', '00000000-0000-4000-8000-000000000000')).status).toBe(404);
    expect((await pagar(ana, 'TARJETA_VISA', 'abc')).status).toBe(400);
  });
});
