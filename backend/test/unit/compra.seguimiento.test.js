import { seguimiento } from '../../src/domain/compra.js';

const ahora = new Date('2026-12-01T10:00:00-03:00');
const evento = (fechaIso) => ({ fecha: new Date(fechaIso) });
const compra = (estado) => ({ estado });

describe('seguimiento de la compra (FR-018)', () => {
  it('CONFIRMADA de un evento dentro de 20 días → faltan 20', () => {
    expect(seguimiento(compra('CONFIRMADA'), evento('2026-12-21T21:00:00-03:00'), ahora)).toEqual({
      diasParaEvento: 20,
      eventoRealizado: false,
    });
  });

  it('CONFIRMADA de un evento que es hoy más tarde → 0 (hoy)', () => {
    expect(seguimiento(compra('CONFIRMADA'), evento('2026-12-01T23:00:00-03:00'), ahora).diasParaEvento).toBe(
      0,
    );
  });

  it('CONFIRMADA de un evento que ya empezó → sin días y evento realizado', () => {
    expect(seguimiento(compra('CONFIRMADA'), evento('2026-12-01T09:00:00-03:00'), ahora)).toEqual({
      diasParaEvento: null,
      eventoRealizado: true,
    });
  });

  it.each(['PENDIENTE', 'UTILIZADA', 'CANCELADA', 'REEMBOLSADA'])(
    '%s no muestra días ni evento realizado',
    (estado) => {
      expect(seguimiento(compra(estado), evento('2026-12-21T21:00:00-03:00'), ahora)).toEqual({
        diasParaEvento: null,
        eventoRealizado: false,
      });
    },
  );
});
