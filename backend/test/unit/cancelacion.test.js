import { dentroDelPlazoDeCancelacion, esFinal } from '../../src/domain/compra.js';
import { REGLAS_POR_DEFECTO as reglas } from '../../src/config/reglas.js';

const ahora = new Date('2026-12-01T20:00:00-03:00');
const eventoEn = (minutos) => ({ fecha: new Date(ahora.getTime() + minutos * 60_000) });

describe('límite de cancelación (30 minutos, FR-020)', () => {
  it('permite cancelar con 31 minutos o más', () => {
    expect(dentroDelPlazoDeCancelacion(eventoEn(31), ahora, reglas)).toBe(true);
    expect(dentroDelPlazoDeCancelacion(eventoEn(60 * 24), ahora, reglas)).toBe(true);
  });

  it('rechaza con 30 minutos exactos, con menos y con el evento empezado', () => {
    expect(dentroDelPlazoDeCancelacion(eventoEn(30), ahora, reglas)).toBe(false);
    expect(dentroDelPlazoDeCancelacion(eventoEn(20), ahora, reglas)).toBe(false);
    expect(dentroDelPlazoDeCancelacion(eventoEn(-10), ahora, reglas)).toBe(false);
  });

  it('el límite es configurable', () => {
    expect(dentroDelPlazoDeCancelacion(eventoEn(20), ahora, { LIMITE_CANCELACION_MIN: 10 })).toBe(true);
  });
});

describe('estados finales', () => {
  it.each([
    ['PENDIENTE', false],
    ['CONFIRMADA', false],
    ['UTILIZADA', true],
    ['CANCELADA', true],
    ['REEMBOLSADA', true],
  ])('%s es final: %s', (estado, final) => {
    expect(esFinal(estado)).toBe(final);
  });
});
