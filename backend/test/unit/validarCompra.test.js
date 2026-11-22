import { validarPuedeComprar } from '../../src/domain/compra.js';
import { REGLAS_POR_DEFECTO as reglas } from '../../src/config/reglas.js';

const ahora = new Date('2026-12-01T20:00:00-03:00');
const evento = { organizadorId: 'martina', fecha: new Date(ahora.getTime() + 60 * 60_000) };
const ana = { id: 'ana', rol: 'COMPRADOR' };
const martina = { id: 'martina', rol: 'ORGANIZADOR' };
const joaquin = { id: 'joaquin', rol: 'ORGANIZADOR' };

const codigoDe = (fn) => {
  try {
    fn();
    return null;
  } catch (error) {
    return error.codigo;
  }
};
const validar = (usuario, cambios = {}) =>
  codigoDe(() => validarPuedeComprar({ usuario, evento, cantidad: 2, ahora, reglas, ...cambios }));

describe('reglas para poder comprar (dominio, FR-011 y FR-012)', () => {
  it('un comprador puede comprar con una cantidad válida', () => {
    expect(validar(ana)).toBeNull();
    expect(validar(ana, { cantidad: reglas.MAX_ENTRADAS_POR_COMPRA })).toBeNull();
  });

  it('un organizador no compra: en su propio evento se explica el motivo', () => {
    expect(validar(martina)).toBe('ORGANIZADOR_NO_PUEDE_COMPRAR');
    expect(validar(joaquin)).toBe('ROL_NO_PERMITIDO');
  });

  it('no se compra un evento que ya empezó (con la hora de inicio exacta tampoco)', () => {
    expect(validar(ana, { ahora: evento.fecha })).toBe('EVENTO_NO_DISPONIBLE');
    expect(validar(ana, { ahora: new Date(evento.fecha.getTime() - 1) })).toBeNull();
  });

  it('el máximo por compra es configurable y se valida con un error de negocio', () => {
    expect(validar(ana, { cantidad: reglas.MAX_ENTRADAS_POR_COMPRA + 1 })).toBe('CANTIDAD_EXCEDE_MAXIMO');
    expect(validar(ana, { cantidad: 4, reglas: { ...reglas, MAX_ENTRADAS_POR_COMPRA: 3 } })).toBe(
      'CANTIDAD_EXCEDE_MAXIMO',
    );
  });
});
