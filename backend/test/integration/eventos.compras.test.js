import { crearEntorno } from '../helpers/fabricas.js';
import { validarRespuesta } from '../helpers/contrato.js';
import { enDias, publicarEvento } from '../helpers/datos.js';

const enMinutosIso = (entorno, m) => new Date(entorno.reloj.ahora().getTime() + m * 60_000).toISOString();

describe('Historia 7 — el organizador ve las compras de su evento y la disponibilidad', () => {
  let entorno;
  let martina;
  let evento;

  beforeEach(async () => {
    entorno = await crearEntorno();
    martina = await entorno.como('martina@tickets.test');
    evento = publicarEvento(entorno, 'martina@tickets.test', {
      fecha: enMinutosIso(entorno, 120),
      tiposEntrada: [
        { nombre: 'Campo', precio: 100, cupo: 20 },
        { nombre: 'VIP', precio: 500, cupo: 5 },
      ],
    });
    const [campo, vip] = evento.tiposEntrada;
    const comprar = async (email, tipo, cantidad) => {
      const cliente = await entorno.como(email);
      return (await cliente.post('/compras').send({ eventoId: evento.id, tipoEntradaId: tipo.id, cantidad }))
        .body;
    };
    const pagar = async (email, compra) =>
      (await entorno.como(email)).post(`/compras/${compra.id}/pagos`).send({ medioPago: 'TARJETA_VISA' });

    // PENDIENTE 2 Campo · CONFIRMADA 3 Campo · UTILIZADA 1 VIP · CANCELADA 4 Campo · REEMBOLSADA 2 VIP
    const confirmada = await comprar('bruno@tickets.test', campo, 3);
    await pagar('bruno@tickets.test', confirmada);
    const cancelada = await comprar('carla@tickets.test', campo, 4);
    await (await entorno.como('carla@tickets.test')).post(`/compras/${cancelada.id}/cancelacion`);
    const reembolsada = await comprar('ana@tickets.test', vip, 2);
    await pagar('ana@tickets.test', reembolsada);
    await (await entorno.como('ana@tickets.test')).post(`/compras/${reembolsada.id}/cancelacion`);
    const utilizada = await comprar('carla@tickets.test', vip, 1);
    await pagar('carla@tickets.test', utilizada);
    entorno.reloj.avanzarMinutos(100); // faltan 20 minutos: ya se puede marcar
    await martina.post(`/compras/${utilizada.id}/uso`);
    await comprar('ana@tickets.test', campo, 2); // PENDIENTE reciente (no vence)
  });

  it('escenarios 1–3: lista las compras con su estado y el cupo disponible por tipo', async () => {
    const res = await martina.get(`/eventos/${evento.id}/compras`);
    expect(res.status).toBe(200);
    await validarRespuesta('/eventos/{eventoId}/compras', 'get', res);

    expect(res.body.compras.map((c) => c.estado).sort()).toEqual(
      ['CANCELADA', 'CONFIRMADA', 'PENDIENTE', 'REEMBOLSADA', 'UTILIZADA'].sort(),
    );
    expect(res.body.compras.every((c) => c.comprador.nombre)).toBe(true);
    expect(res.body.tiposEntrada.map((t) => [t.nombre, t.cupoTotal, t.cupoDisponible])).toEqual([
      ['Campo', 20, 20 - 2 - 3],
      ['VIP', 5, 5 - 1],
    ]);
  });

  it('escenario 4: otro organizador y un comprador no pueden verlas', async () => {
    const joaquin = await entorno.como('joaquin@tickets.test');
    const otro = await joaquin.get(`/eventos/${evento.id}/compras`);
    expect(otro.status).toBe(403);
    await validarRespuesta('/eventos/{eventoId}/compras', 'get', otro);

    const ana = await entorno.como('ana@tickets.test');
    expect((await ana.get(`/eventos/${evento.id}/compras`)).status).toBe(403);
  });

  it('evento inexistente → 404', async () => {
    const res = await martina.get('/eventos/00000000-0000-4000-8000-000000000000/compras');
    expect(res.status).toBe(404);
  });

  it('un evento sin compras muestra el cupo completo y una lista vacía', async () => {
    const vacio = publicarEvento(entorno, 'martina@tickets.test', { fecha: enDias(entorno, 3) });
    const res = await martina.get(`/eventos/${vacio.id}/compras`);
    expect(res.body.compras).toEqual([]);
    expect(res.body.tiposEntrada[0].cupoDisponible).toBe(res.body.tiposEntrada[0].cupoTotal);
  });
});
