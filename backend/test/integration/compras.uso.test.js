import { crearEntorno } from '../helpers/fabricas.js';
import { validarRespuesta } from '../helpers/contrato.js';
import { enDias, publicarEvento } from '../helpers/datos.js';

const enMinutosIso = (entorno, m) => new Date(entorno.reloj.ahora().getTime() + m * 60_000).toISOString();

describe('Historia 6 — el organizador marca una entrada como utilizada', () => {
  let entorno;
  let ana;
  let martina;

  beforeEach(async () => {
    entorno = await crearEntorno();
    ana = await entorno.como('ana@tickets.test');
    martina = await entorno.como('martina@tickets.test');
  });

  const compraConfirmada = async (fecha) => {
    const evento = publicarEvento(entorno, 'martina@tickets.test', {
      fecha,
      tiposEntrada: [{ nombre: 'General', precio: 100, cupo: 10 }],
    });
    const compra = (
      await ana
        .post('/compras')
        .send({ eventoId: evento.id, tipoEntradaId: evento.tiposEntrada[0].id, cantidad: 1 })
    ).body;
    await ana.post(`/compras/${compra.id}/pagos`).send({ medioPago: 'TARJETA_VISA' });
    return compra;
  };
  const marcar = (cliente, compra) => cliente.post(`/compras/${compra.id}/uso`);

  it('escenario 1: con el evento en 20 minutos la marca como UTILIZADA', async () => {
    const compra = await compraConfirmada(enMinutosIso(entorno, 20));
    const antes = await martina.get(`/compras/${compra.id}`);
    expect(antes.body.acciones.puedeMarcarUtilizada).toBe(true);

    const res = await marcar(martina, compra);
    expect(res.status).toBe(200);
    await validarRespuesta('/compras/{compraId}/uso', 'post', res);
    expect(res.body.estado).toBe('UTILIZADA');
    expect(res.body.acciones.puedeMarcarUtilizada).toBe(false);

    const comoComprador = await ana.get(`/compras/${compra.id}`);
    expect(comoComprador.body.historial.at(-1).quien).toMatchObject({
      tipo: 'ORGANIZADOR',
      nombre: 'Martina Ruiz',
    });
    expect(comoComprador.body.acciones.puedeResenar).toBe(true);
  });

  it('escenario 2: con el evento mañana se rechaza porque aún no se habilitó', async () => {
    const compra = await compraConfirmada(enDias(entorno, 1));
    const res = await marcar(martina, compra);
    expect(res.status).toBe(409);
    expect(res.body.error.codigo).toBe('AUN_NO_HABILITADA');
    await validarRespuesta('/compras/{compraId}/uso', 'post', res);
  });

  it('escenario 3: rechaza compras que no están CONFIRMADAS', async () => {
    const evento = publicarEvento(entorno, 'martina@tickets.test', {
      fecha: enMinutosIso(entorno, 20),
      tiposEntrada: [{ nombre: 'General', precio: 100, cupo: 10 }],
    });
    const pendiente = (
      await ana
        .post('/compras')
        .send({ eventoId: evento.id, tipoEntradaId: evento.tiposEntrada[0].id, cantidad: 1 })
    ).body;
    const res = await marcar(martina, pendiente);
    expect(res.status).toBe(409);
    expect(res.body.error.codigo).toBe('ESTADO_INVALIDO');
  });

  it('escenario 4: otro organizador no puede marcarla y un comprador tampoco', async () => {
    const compra = await compraConfirmada(enMinutosIso(entorno, 20));
    const joaquin = await entorno.como('joaquin@tickets.test');
    const otro = await marcar(joaquin, compra);
    expect(otro.status).toBe(403);
    expect(otro.body.error.codigo).toBe('NO_AUTORIZADO');
    await validarRespuesta('/compras/{compraId}/uso', 'post', otro);
    expect((await marcar(ana, compra)).status).toBe(403);
  });

  it('escenario 6: el marcado manual sigue disponible después de empezar el evento', async () => {
    const compra = await compraConfirmada(enMinutosIso(entorno, 20));
    entorno.reloj.avanzarHoras(3);
    const res = await marcar(martina, compra);
    expect(res.body.estado).toBe('UTILIZADA');
  });

  it('escenario 5: sin marcar, el sistema la pasa a UTILIZADA 24 h después del inicio', async () => {
    const compra = await compraConfirmada(enMinutosIso(entorno, 20));
    entorno.reloj.avanzarMinutos(20 + 24 * 60);
    entorno.contexto.jobs.ciclo.ejecutar(entorno.reloj.ahora());
    const res = await ana.get(`/compras/${compra.id}`);
    expect(res.body.estado).toBe('UTILIZADA');
    expect(res.body.historial.at(-1).quien.tipo).toBe('SISTEMA');
  });
});
