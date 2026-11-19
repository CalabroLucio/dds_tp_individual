import { crearEntorno } from '../helpers/fabricas.js';
import { enDias, publicarEvento } from '../helpers/datos.js';

describe('job periódico: expiración de compras PENDIENTES (FR-016, SC-007)', () => {
  let entorno;
  let evento;

  beforeEach(async () => {
    entorno = await crearEntorno();
    evento = publicarEvento(entorno, 'martina@tickets.test', {
      fecha: enDias(entorno, 3),
      tiposEntrada: [{ nombre: 'General', precio: 1000, cupo: 5 }],
    });
  });

  const comprar = async (email, cantidad) => {
    const cliente = await entorno.como(email);
    const res = await cliente
      .post('/compras')
      .send({ eventoId: evento.id, tipoEntradaId: evento.tiposEntrada[0].id, cantidad });
    return entorno.contexto.repos.compras.porId(res.body.id);
  };
  const ciclo = () => entorno.contexto.jobs.ciclo.ejecutar(entorno.reloj.ahora());
  const cupo = () =>
    entorno.contexto.services.eventos.detalle(evento.id, null).tiposEntrada[0].cupoDisponible;

  it('cancela las PENDIENTES con 15 minutos exactos, libera el cupo y registra al sistema', async () => {
    const vieja = await comprar('ana@tickets.test', 3);
    entorno.reloj.avanzarMinutos(5);
    const reciente = await comprar('bruno@tickets.test', 1);
    expect(cupo()).toBe(1);

    entorno.reloj.avanzarMinutos(9); // vieja: 14 min
    expect(ciclo().expiradas).toBe(0);

    entorno.reloj.avanzarMinutos(1); // vieja: 15 min, reciente: 10 min
    expect(ciclo().expiradas).toBe(1);
    expect(vieja.estado).toBe('CANCELADA');
    expect(vieja.historial.at(-1)).toMatchObject({ estado: 'CANCELADA', quien: { tipo: 'SISTEMA' } });
    expect(reciente.estado).toBe('PENDIENTE');
    expect(cupo()).toBe(4);
  });

  it('no toca compras CONFIRMADAS', async () => {
    const compra = await comprar('ana@tickets.test', 1);
    const ana = await entorno.como('ana@tickets.test');
    await ana.post(`/compras/${compra.id}/pagos`).send({ medioPago: 'TARJETA_VISA' });

    entorno.reloj.avanzarMinutos(60);
    expect(ciclo().expiradas).toBe(0);
    expect(compra.estado).toBe('CONFIRMADA');
  });
});
