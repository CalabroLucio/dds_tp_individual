import {
  precioDesde,
  cupoDisponible,
  hayCupoPara,
  compraAbierta,
  avisoNoCancelable,
} from '../../src/domain/evento.js';

const ahora = new Date('2026-12-01T20:00:00-03:00');
const enMinutos = (m) => new Date(ahora.getTime() + m * 60_000);

const tipoGeneral = { id: 'general', nombre: 'General', precio: 15000, cupo: 10 };
const tipoVip = { id: 'vip', nombre: 'VIP', precio: 40000, cupo: 5 };
const evento = { id: 'e1', fecha: enMinutos(60 * 24), tiposEntrada: [tipoVip, tipoGeneral] };

const compra = (tipoEntradaId, cantidad, estado) => ({ tipoEntradaId, cantidad, estado });

describe('precioDesde', () => {
  it('es el menor precio entre los tipos de entrada', () => {
    expect(precioDesde(evento)).toBe(15000);
  });
  it('admite entradas gratuitas', () => {
    expect(precioDesde({ tiposEntrada: [tipoVip, { ...tipoGeneral, precio: 0 }] })).toBe(0);
  });
});

describe('cupoDisponible y hayCupoPara', () => {
  const compras = [
    compra('general', 2, 'PENDIENTE'),
    compra('general', 3, 'CONFIRMADA'),
    compra('general', 1, 'UTILIZADA'),
    compra('general', 4, 'CANCELADA'),
    compra('general', 2, 'REEMBOLSADA'),
    compra('vip', 5, 'CONFIRMADA'),
  ];

  it('resta PENDIENTE, CONFIRMADA y UTILIZADA; no resta CANCELADA ni REEMBOLSADA', () => {
    expect(cupoDisponible(tipoGeneral, compras)).toBe(10 - 2 - 3 - 1);
  });

  it('solo cuenta las compras del mismo tipo', () => {
    expect(cupoDisponible(tipoVip, compras)).toBe(0);
  });

  it('hay cupo exactamente hasta el disponible', () => {
    expect(hayCupoPara(tipoGeneral, compras, 4)).toBe(true);
    expect(hayCupoPara(tipoGeneral, compras, 5)).toBe(false);
  });
});

describe('compraAbierta', () => {
  it('está abierta antes del inicio y cerrada desde el inicio', () => {
    expect(compraAbierta({ fecha: enMinutos(1) }, ahora)).toBe(true);
    expect(compraAbierta({ fecha: enMinutos(0) }, ahora)).toBe(false);
    expect(compraAbierta({ fecha: enMinutos(-30) }, ahora)).toBe(false);
  });
});

describe('avisoNoCancelable (límite de 30 minutos)', () => {
  it('no avisa si faltan más de 30 minutos', () => {
    expect(avisoNoCancelable({ fecha: enMinutos(31) }, ahora, 30)).toBe(false);
  });
  it('avisa con exactamente 30 minutos y con menos', () => {
    expect(avisoNoCancelable({ fecha: enMinutos(30) }, ahora, 30)).toBe(true);
    expect(avisoNoCancelable({ fecha: enMinutos(20) }, ahora, 30)).toBe(true);
  });
  it('no avisa si el evento ya empezó (la compra está cerrada)', () => {
    expect(avisoNoCancelable({ fecha: enMinutos(-5) }, ahora, 30)).toBe(false);
  });
});
