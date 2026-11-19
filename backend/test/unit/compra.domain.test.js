import {
  crearCompra,
  transicionar,
  puedeTransicionar,
  estaVencida,
  calcularAcciones,
  QUIEN_SISTEMA,
  quienDe,
} from '../../src/domain/compra.js';
import { REGLAS_POR_DEFECTO as reglas } from '../../src/config/reglas.js';

const ahora = new Date('2026-12-01T15:00:00-03:00');
const enMinutos = (m) => new Date(ahora.getTime() + m * 60_000);
const ana = { id: 'ana', nombre: 'Ana', apellido: 'Gómez', rol: 'COMPRADOR' };
const martina = { id: 'martina', nombre: 'Martina', apellido: 'Ruiz', rol: 'ORGANIZADOR' };
const evento = { id: 'e1', organizadorId: 'martina', fecha: enMinutos(60 * 24) };
const tipo = { id: 't1', nombre: 'General', precio: 1500.5, cupo: 10 };

const nueva = (cambios = {}) =>
  crearCompra({
    id: 'c1',
    comprador: ana,
    evento,
    tipoEntrada: tipo,
    cantidad: 3,
    ahora,
    reglas,
    ...cambios,
  });

describe('crearCompra', () => {
  it('nace PENDIENTE con total, vencimiento a los 15 minutos e historial inicial', () => {
    const compra = nueva();
    expect(compra).toMatchObject({
      compradorId: 'ana',
      eventoId: 'e1',
      tipoEntradaId: 't1',
      cantidad: 3,
      total: 4501.5,
      estado: 'PENDIENTE',
    });
    expect(compra.expiraEn).toEqual(enMinutos(15));
    expect(compra.historial).toEqual([
      { estado: 'PENDIENTE', quien: { tipo: 'COMPRADOR', id: 'ana', nombre: 'Ana Gómez' }, fechaHora: ahora },
    ]);
  });
});

describe('máquina de estados (FR-014)', () => {
  it.each([
    ['PENDIENTE', 'CONFIRMADA', true],
    ['PENDIENTE', 'CANCELADA', true],
    ['CONFIRMADA', 'REEMBOLSADA', true],
    ['CONFIRMADA', 'UTILIZADA', true],
    ['PENDIENTE', 'UTILIZADA', false],
    ['PENDIENTE', 'REEMBOLSADA', false],
    ['CONFIRMADA', 'CANCELADA', false],
    ['CONFIRMADA', 'PENDIENTE', false],
    ['UTILIZADA', 'REEMBOLSADA', false],
    ['CANCELADA', 'CONFIRMADA', false],
    ['REEMBOLSADA', 'CONFIRMADA', false],
  ])('%s → %s permitido: %s', (desde, hacia, permitido) => {
    expect(puedeTransicionar(desde, hacia)).toBe(permitido);
  });

  it('transicionar registra quién y cuándo', () => {
    const compra = nueva();
    transicionar(compra, 'CONFIRMADA', quienDe(ana), enMinutos(2));
    transicionar(compra, 'UTILIZADA', QUIEN_SISTEMA, enMinutos(60));
    expect(compra.estado).toBe('UTILIZADA');
    expect(compra.historial.map((h) => [h.estado, h.quien.tipo])).toEqual([
      ['PENDIENTE', 'COMPRADOR'],
      ['CONFIRMADA', 'COMPRADOR'],
      ['UTILIZADA', 'SISTEMA'],
    ]);
    expect(compra.historial[2].fechaHora).toEqual(enMinutos(60));
  });

  it('transicionar rechaza una transición no permitida con ESTADO_INVALIDO', () => {
    const compra = nueva();
    expect(() => transicionar(compra, 'UTILIZADA', quienDe(martina), ahora)).toThrow(
      expect.objectContaining({ codigo: 'ESTADO_INVALIDO' }),
    );
    expect(compra.estado).toBe('PENDIENTE');
  });
});

describe('vencimiento y acciones', () => {
  it('una PENDIENTE vence a los 15 minutos exactos', () => {
    const compra = nueva();
    expect(estaVencida(compra, enMinutos(14))).toBe(false);
    expect(estaVencida(compra, enMinutos(15))).toBe(true);
  });

  it('puedePagar solo para el comprador, en PENDIENTE y antes del vencimiento', () => {
    const compra = nueva();
    expect(calcularAcciones(compra, evento, ana, enMinutos(1), reglas).puedePagar).toBe(true);
    expect(calcularAcciones(compra, evento, ana, enMinutos(15), reglas).puedePagar).toBe(false);
    expect(calcularAcciones(compra, evento, martina, enMinutos(1), reglas).puedePagar).toBe(false);
    transicionar(compra, 'CONFIRMADA', quienDe(ana), enMinutos(1));
    expect(calcularAcciones(compra, evento, ana, enMinutos(2), reglas).puedePagar).toBe(false);
  });
});
