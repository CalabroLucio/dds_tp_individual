// Datos y respuestas de prueba compartidos por los tests de mobile (no es un archivo de tests).
export const respuestaJson = (status, cuerpo) => ({
  ok: status >= 200 && status < 300,
  status,
  text: async () => (cuerpo === undefined ? '' : JSON.stringify(cuerpo)),
});

export const usuarioAna = {
  id: '6f1c2a8e-3b4d-4e5f-9a0b-1c2d3e4f5a6b',
  nombre: 'Ana',
  apellido: 'Gómez',
  email: 'ana@tickets.test',
  rol: 'COMPRADOR',
};

export const usuarioMartina = {
  id: '7a2d3b9f-4c5e-4f60-8b1c-2d3e4f5a6b7c',
  nombre: 'Martina',
  apellido: 'Ruiz',
  email: 'martina@tickets.test',
  rol: 'ORGANIZADOR',
};

// fetch simulado que responde según "MÉTODO /ruta" (sin query string). Registra cada llamada.
export function mockFetch(rutas) {
  return jest.fn(async (url, opciones = {}) => {
    const { pathname } = new URL(url);
    const clave = `${opciones.method ?? 'GET'} ${pathname}`;
    const manejador = rutas[clave];
    if (!manejador) throw new Error(`fetch no esperado: ${clave}`);
    const [status, cuerpo] = typeof manejador === 'function' ? manejador(opciones, url) : manejador;
    return respuestaJson(status, cuerpo);
  });
}

export const categorias = [
  { id: '11111111-1111-4111-8111-111111111111', nombre: 'Música', descripcion: 'Recitales' },
  { id: '22222222-2222-4222-8222-222222222222', nombre: 'Teatro', descripcion: 'Obras' },
];

const organizador = (puntaje = null, cantidadResenias = 0) => ({
  id: '7a2d3b9f-4c5e-4f60-8b1c-2d3e4f5a6b7c',
  nombre: 'Martina',
  apellido: 'Ruiz',
  puntaje,
  cantidadResenias,
});

export const eventoResumen = (cambios = {}) => ({
  id: 'evt-rock',
  nombre: 'Rock en el Estadio',
  categoria: categorias[0],
  fecha: '2026-12-10T23:00:00.000Z',
  imagenPrincipal: null,
  precioDesde: 20000,
  organizador: organizador(4.5, 2),
  esFavorito: false,
  ...cambios,
});

export const eventoDetalle = (cambios = {}) => ({
  ...eventoResumen(),
  descripcion: 'La mejor noche de rock',
  multimedia: [],
  tiposEntrada: [
    {
      id: 'tipo-campo',
      nombre: 'Campo',
      descripcion: 'De pie',
      precio: 20000,
      cupoTotal: 100,
      cupoDisponible: 8,
      agotado: false,
    },
    {
      id: 'tipo-vip',
      nombre: 'VIP',
      descripcion: 'Cerca del escenario',
      precio: 50000,
      cupoTotal: 10,
      cupoDisponible: 0,
      agotado: true,
    },
  ],
  organizador: {
    ...organizador(4.5, 2),
    resenias: [
      {
        id: 'r1',
        compraId: 'c1',
        comprador: { id: 'u1', nombre: 'Ana', apellido: 'Gómez' },
        evento: { id: 'evt-pasado', nombre: 'Festival de verano' },
        puntaje: 5,
        comentario: 'Impecable la organización',
        creadaEn: '2026-11-01T12:00:00.000Z',
      },
    ],
  },
  compraAbierta: true,
  avisoNoCancelable: false,
  maxEntradasPorCompra: 10,
  ...cambios,
});
