import { habilitadaParaUtilizar, autoUtilizable } from '../../src/domain/compra.js';
import { REGLAS_POR_DEFECTO as reglas } from '../../src/config/reglas.js';
import { crearEntorno } from '../helpers/fabricas.js';
import { publicarEvento } from '../helpers/datos.js';

const ahora = new Date('2026-12-01T20:00:00-03:00');
const eventoEn = (minutos) => ({ fecha: new Date(ahora.getTime() + minutos * 60_000) });

describe('habilitación para marcar UTILIZADA (FR-022)', () => {
  it('se habilita a los 30 minutos exactos antes del evento y sigue habilitada después', () => {
    expect(habilitadaParaUtilizar(eventoEn(31), ahora, reglas)).toBe(false);
    expect(habilitadaParaUtilizar(eventoEn(30), ahora, reglas)).toBe(true);
    expect(habilitadaParaUtilizar(eventoEn(-120), ahora, reglas)).toBe(true);
  });
});

describe('pasaje automático a UTILIZADA (24 h después del inicio)', () => {
  it('solo CONFIRMADAS y desde las 24 horas exactas', () => {
    const evento = eventoEn(-24 * 60);
    expect(autoUtilizable({ estado: 'CONFIRMADA' }, evento, ahora, reglas)).toBe(true);
    expect(autoUtilizable({ estado: 'CONFIRMADA' }, eventoEn(-24 * 60 + 1), ahora, reglas)).toBe(false);
    expect(autoUtilizable({ estado: 'PENDIENTE' }, evento, ahora, reglas)).toBe(false);
    expect(autoUtilizable({ estado: 'REEMBOLSADA' }, evento, ahora, reglas)).toBe(false);
  });

  it('el job pasa a UTILIZADA las CONFIRMADAS vencidas y lo registra como sistema', async () => {
    const entorno = await crearEntorno();
    const evento = publicarEvento(entorno, 'martina@tickets.test', {
      fecha: new Date(entorno.reloj.ahora().getTime() + 60 * 60_000).toISOString(),
      tiposEntrada: [{ nombre: 'General', precio: 100, cupo: 10 }],
    });
    const ana = await entorno.como('ana@tickets.test');
    const comprar = async () =>
      (
        await ana
          .post('/compras')
          .send({ eventoId: evento.id, tipoEntradaId: evento.tiposEntrada[0].id, cantidad: 1 })
      ).body.id;
    const confirmadaId = await comprar();
    await ana.post(`/compras/${confirmadaId}/pagos`).send({ medioPago: 'TARJETA_VISA' });
    const pendienteId = await comprar();

    const repo = entorno.contexto.repos.compras;
    const ciclo = () => entorno.contexto.jobs.ciclo.ejecutar(entorno.reloj.ahora());

    entorno.reloj.avanzarHoras(24); // evento empezó hace 23 h
    expect(ciclo()).toMatchObject({ utilizadas: 0, expiradas: 1 });
    expect(repo.porId(confirmadaId).estado).toBe('CONFIRMADA');

    entorno.reloj.avanzarHoras(1); // 24 h exactas desde el inicio
    expect(ciclo()).toMatchObject({ utilizadas: 1 });
    expect(repo.porId(confirmadaId).historial.at(-1)).toMatchObject({
      estado: 'UTILIZADA',
      quien: { tipo: 'SISTEMA' },
    });
    expect(repo.porId(pendienteId).estado).toBe('CANCELADA');
  });
});
