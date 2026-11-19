import { buscarEventos } from '../../src/domain/busqueda.js';

const ahora = new Date('2026-12-01T15:00:00-03:00');
const enDias = (d) => new Date(ahora.getTime() + d * 24 * 3_600_000);

const categorias = new Map([
  ['musica', { id: 'musica', nombre: 'Música' }],
  ['teatro', { id: 'teatro', nombre: 'Teatro' }],
]);

const evento = (id, { nombre, descripcion = '', categoriaId = 'musica', fecha, precios, organizadorId }) => ({
  id,
  nombre,
  descripcion,
  categoriaId,
  fecha,
  organizadorId,
  tiposEntrada: precios.map((precio, i) => ({ id: `${id}-${i}`, precio, cupo: 10 })),
});

const eventos = [
  evento('rock', {
    nombre: 'Rock en el Estadio',
    fecha: enDias(5),
    precios: [20000, 50000],
    organizadorId: 'org-a',
  }),
  evento('jazz', {
    nombre: 'Noche de Jazz',
    descripcion: 'Música improvisada',
    fecha: enDias(2),
    precios: [8000],
    organizadorId: 'org-b',
  }),
  evento('obra', {
    nombre: 'La Celestina',
    descripcion: 'Clásico del teatro español',
    categoriaId: 'teatro',
    fecha: enDias(10),
    precios: [12000, 3000],
    organizadorId: 'org-c',
  }),
  evento('pasado', {
    nombre: 'Rock del año pasado',
    fecha: enDias(-30),
    precios: [1000],
    organizadorId: 'org-a',
  }),
];

const puntajes = new Map([
  ['org-a', 4.5],
  ['org-b', null],
  ['org-c', 3.8],
]);

const ids = (criterios) =>
  buscarEventos(eventos, criterios, {
    ahora,
    categoriaPorId: (id) => categorias.get(id),
    puntajeDe: (id) => puntajes.get(id),
  }).map((e) => e.id);

describe('buscarEventos', () => {
  it('excluye eventos pasados y por defecto ordena por fecha (más próximo primero)', () => {
    expect(ids({})).toEqual(['jazz', 'rock', 'obra']);
  });

  it('busca texto sin distinguir mayúsculas ni tildes en nombre, descripción y categoría', () => {
    expect(ids({ q: 'ROCK' })).toEqual(['rock']);
    expect(ids({ q: 'musica' })).toEqual(['jazz', 'rock']); // descripción de jazz y categoría de rock
    expect(ids({ q: 'teatro' })).toEqual(['obra']);
    expect(ids({ q: 'nada que ver' })).toEqual([]);
  });

  it('filtra por categoría', () => {
    expect(ids({ categoriaId: 'teatro' })).toEqual(['obra']);
  });

  it('filtra por rango de precio si al menos un tipo de entrada cae dentro', () => {
    expect(ids({ precioMin: 2000, precioMax: 5000 })).toEqual(['obra']);
    expect(ids({ precioMin: 40000 })).toEqual(['rock']);
    expect(ids({ precioMax: 8000 })).toEqual(['jazz', 'obra']);
  });

  it('ordena por precio usando el menor precio del evento', () => {
    expect(ids({ orden: 'precio' })).toEqual(['obra', 'jazz', 'rock']);
    expect(ids({ orden: 'precio', direccion: 'desc' })).toEqual(['rock', 'jazz', 'obra']);
  });

  it('ordena por puntaje del organizador (mayor primero) con los sin reseñas al final', () => {
    expect(ids({ orden: 'puntaje' })).toEqual(['rock', 'obra', 'jazz']);
    expect(ids({ orden: 'puntaje', direccion: 'asc' })).toEqual(['obra', 'rock', 'jazz']);
  });

  it('ordena por fecha descendente si se pide', () => {
    expect(ids({ orden: 'fecha', direccion: 'desc' })).toEqual(['obra', 'rock', 'jazz']);
  });
});
