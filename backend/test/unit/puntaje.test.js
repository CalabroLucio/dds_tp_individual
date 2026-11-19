import { promedioPuntaje } from '../../src/domain/puntaje.js';

describe('puntaje del organizador', () => {
  it('es null si no tiene reseñas', () => {
    expect(promedioPuntaje([])).toBeNull();
  });
  it('promedia las reseñas (5 y 3 → 4)', () => {
    expect(promedioPuntaje([{ puntaje: 5 }, { puntaje: 3 }])).toBe(4);
  });
  it('redondea a un decimal', () => {
    expect(promedioPuntaje([{ puntaje: 5 }, { puntaje: 4 }, { puntaje: 4 }])).toBe(4.3);
    expect(promedioPuntaje([{ puntaje: 5 }, { puntaje: 5 }, { puntaje: 4 }])).toBe(4.7);
  });
});
