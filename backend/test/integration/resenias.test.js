import { crearEntorno } from '../helpers/fabricas.js';
import { validarRespuesta } from '../helpers/contrato.js';
import { publicarEvento } from '../helpers/datos.js';

describe('Historia 9 — reseñas y reputación del organizador', () => {
  let entorno;
  let martina;
  let evento;

  beforeEach(async () => {
    entorno = await crearEntorno();
    martina = await entorno.como('martina@tickets.test');
    evento = publicarEvento(entorno, 'martina@tickets.test', {
      nombre: 'Concierto para reseñar',
      fecha: new Date(entorno.reloj.ahora().getTime() + 20 * 60_000).toISOString(),
      tiposEntrada: [{ nombre: 'General', precio: 100, cupo: 10 }],
    });
  });

  async function compraUtilizada(email) {
    const cliente = await entorno.como(email);
    const compra = (
      await cliente
        .post('/compras')
        .send({ eventoId: evento.id, tipoEntradaId: evento.tiposEntrada[0].id, cantidad: 1 })
    ).body;
    await cliente.post(`/compras/${compra.id}/pagos`).send({ medioPago: 'TARJETA_VISA' });
    await martina.post(`/compras/${compra.id}/uso`);
    return { cliente, compra };
  }
  const reseniar = (cliente, compra, cuerpo) => cliente.post(`/compras/${compra.id}/resenia`).send(cuerpo);

  it('escenario 1: reseña una compra UTILIZADA y queda asociada a la compra', async () => {
    const { cliente, compra } = await compraUtilizada('ana@tickets.test');
    const res = await reseniar(cliente, compra, { puntaje: 4, comentario: '  Muy buen sonido  ' });
    expect(res.status).toBe(201);
    await validarRespuesta('/compras/{compraId}/resenia', 'post', res);
    expect(res.body).toMatchObject({
      puntaje: 4,
      comentario: 'Muy buen sonido',
      comprador: { nombre: 'Ana' },
      evento: { nombre: 'Concierto para reseñar' },
    });

    const detalle = await cliente.get(`/compras/${compra.id}`);
    expect(detalle.body.resenia).toMatchObject({ puntaje: 4 });
    expect(detalle.body.acciones.puedeResenar).toBe(false);
  });

  it('escenario 2: no se reseña una compra que no está UTILIZADA', async () => {
    const ana = await entorno.como('ana@tickets.test');
    const compra = (
      await ana
        .post('/compras')
        .send({ eventoId: evento.id, tipoEntradaId: evento.tiposEntrada[0].id, cantidad: 1 })
    ).body;
    const res = await reseniar(ana, compra, { puntaje: 5, comentario: 'Todavía no fui' });
    expect(res.status).toBe(409);
    expect(res.body.error.codigo).toBe('ESTADO_INVALIDO');
    await validarRespuesta('/compras/{compraId}/resenia', 'post', res);
  });

  it('escenario 3: solo una reseña por compra', async () => {
    const { cliente, compra } = await compraUtilizada('ana@tickets.test');
    await reseniar(cliente, compra, { puntaje: 5, comentario: 'Genial' });
    const otra = await reseniar(cliente, compra, { puntaje: 1, comentario: 'Cambié de idea' });
    expect(otra.status).toBe(409);
    expect(otra.body.error.codigo).toBe('YA_RESENIADA');
  });

  it('escenario 4: el puntaje debe ser un entero entre 1 y 5 y el comentario no puede estar vacío', async () => {
    const { cliente, compra } = await compraUtilizada('ana@tickets.test');
    for (const cuerpo of [
      { puntaje: 0, comentario: 'x' },
      { puntaje: 6, comentario: 'x' },
      { puntaje: 3.5, comentario: 'x' },
      { puntaje: 4, comentario: '   ' },
      { puntaje: 4, comentario: 'x'.repeat(501) },
    ]) {
      const res = await reseniar(cliente, compra, cuerpo);
      expect(res.status).toBe(400);
      await validarRespuesta('/compras/{compraId}/resenia', 'post', res);
    }
  });

  it('escenarios 5–6: el puntaje del organizador es el promedio (5 y 3 → 4) y se ve en sus eventos', async () => {
    const a = await compraUtilizada('ana@tickets.test');
    const b = await compraUtilizada('bruno@tickets.test');
    await reseniar(a.cliente, a.compra, { puntaje: 5, comentario: 'Excelente' });
    await reseniar(b.cliente, b.compra, { puntaje: 3, comentario: 'Regular' });

    const otroEvento = publicarEvento(entorno, 'martina@tickets.test', {
      fecha: new Date(entorno.reloj.ahora().getTime() + 5 * 24 * 3_600_000).toISOString(),
    });
    const detalle = await a.cliente.get(`/eventos/${otroEvento.id}`);
    expect(detalle.body.organizador).toMatchObject({ puntaje: 4, cantidadResenias: 2 });
    expect(detalle.body.organizador.resenias.map((r) => r.comentario).sort()).toEqual([
      'Excelente',
      'Regular',
    ]);

    const catalogo = await a.cliente.get('/eventos?orden=puntaje');
    expect(catalogo.body[0].organizador.puntaje).toBe(4);
  });

  it('escenario 7: no se reseña una compra ajena', async () => {
    const { compra } = await compraUtilizada('ana@tickets.test');
    const bruno = await entorno.como('bruno@tickets.test');
    const res = await reseniar(bruno, compra, { puntaje: 5, comentario: 'Intento' });
    expect(res.status).toBe(403);
  });
});
