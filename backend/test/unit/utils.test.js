import { normalizar, contiene } from '../../src/utils/texto.js';
import { diasCalendario, sumarMinutos, sumarHoras, minutosEntre } from '../../src/utils/fechas.js';
import { relojSistema } from '../../src/utils/reloj.js';
import { crearRelojDePrueba } from '../helpers/relojDePrueba.js';

describe('texto', () => {
  it('normaliza a minúsculas y sin tildes', () => {
    expect(normalizar('  Música ÉPICA en Córdoba ')).toBe('musica epica en cordoba');
    expect(normalizar('Ñandú')).toBe('nandu');
  });

  it('busca por "contiene" ignorando mayúsculas y tildes', () => {
    expect(contiene('Recital de Rock Nacional', 'rock')).toBe(true);
    expect(contiene('Teatro Colón', 'colon')).toBe(true);
    expect(contiene('Stand-up', 'teatro')).toBe(false);
  });
});

describe('fechas (zona America/Argentina/Buenos_Aires)', () => {
  it('cuenta 0 días para un evento más tarde el mismo día', () => {
    const ahora = new Date('2026-12-01T09:00:00-03:00');
    const evento = new Date('2026-12-01T23:30:00-03:00');
    expect(diasCalendario(ahora, evento)).toBe(0);
  });

  it('cuenta días calendario, no bloques de 24 horas', () => {
    const ahora = new Date('2026-12-01T23:50:00-03:00');
    const evento = new Date('2026-12-02T00:10:00-03:00');
    expect(diasCalendario(ahora, evento)).toBe(1);
  });

  it('cuenta 20 días', () => {
    const ahora = new Date('2026-12-01T15:00:00-03:00');
    const evento = new Date('2026-12-21T10:00:00-03:00');
    expect(diasCalendario(ahora, evento)).toBe(20);
  });

  it('usa la fecha local y no la UTC (21 h en Buenos Aires ya es otro día en UTC)', () => {
    const ahora = new Date('2026-12-01T21:00:00-03:00');
    const evento = new Date('2026-12-01T22:00:00-03:00');
    expect(diasCalendario(ahora, evento)).toBe(0);
  });

  it('suma minutos y horas y mide minutos entre fechas', () => {
    const base = new Date('2026-12-01T15:00:00-03:00');
    expect(sumarMinutos(base, 15).toISOString()).toBe('2026-12-01T18:15:00.000Z');
    expect(sumarHoras(base, 24).toISOString()).toBe('2026-12-02T18:00:00.000Z');
    expect(minutosEntre(base, sumarMinutos(base, 30))).toBe(30);
  });
});

describe('reloj', () => {
  it('el reloj del sistema devuelve la hora actual', () => {
    const antes = Date.now();
    const ahora = relojSistema.ahora().getTime();
    expect(ahora).toBeGreaterThanOrEqual(antes);
  });

  it('el reloj de prueba se puede fijar y avanzar', () => {
    const reloj = crearRelojDePrueba(new Date('2026-12-01T15:00:00-03:00'));
    reloj.avanzarMinutos(10);
    expect(reloj.ahora().toISOString()).toBe('2026-12-01T18:10:00.000Z');
    reloj.avanzarHoras(1);
    expect(reloj.ahora().toISOString()).toBe('2026-12-01T19:10:00.000Z');
    const copia = reloj.ahora();
    copia.setFullYear(2000);
    expect(reloj.ahora().getFullYear()).toBe(2026);
  });
});
