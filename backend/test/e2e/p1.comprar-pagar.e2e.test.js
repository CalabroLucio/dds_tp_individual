import { levantarServidor } from './helpers/servidor.js';

// Viaje completo de las historias P1 contra el servidor real (HTTP de verdad, sin supertest).
describe('E2E P1 — publicar, buscar, comprar, pagar y ver mis compras', () => {
  let servidor;

  beforeAll(async () => {
    servidor = await levantarServidor();
  });
  afterAll(() => servidor.cerrar());

  it('recorre el flujo de punta a punta', async () => {
    const { api, login, datos } = servidor;
    const martina = await login('martina@tickets.test');
    const ana = await login('ana@tickets.test');

    // US1: la organizadora publica un evento dentro de 5 días.
    const fecha = new Date(Date.now() + 5 * 24 * 3_600_000).toISOString();
    const publicado = await api('POST', '/eventos', {
      token: martina,
      body: {
        nombre: 'Gran Recital E2E',
        descripcion: 'Evento creado por el test de punta a punta',
        categoriaId: datos.categorias['Música'].id,
        fecha,
        multimedia: [],
        tiposEntrada: [
          { nombre: 'Campo', descripcion: '', precio: 12000, cupo: 50 },
          { nombre: 'Platea', descripcion: '', precio: 25000, cupo: 20 },
        ],
      },
    });
    expect(publicado.status).toBe(201);

    // US2: la compradora lo encuentra buscando sin tilde y ordenando por precio.
    const busqueda = await api('GET', '/eventos?q=recital%20e2e&orden=precio', { token: ana });
    expect(busqueda.status).toBe(200);
    expect(busqueda.body.map((e) => e.id)).toContain(publicado.body.id);

    // US3: compra 3 entradas de Campo; el primer pago se rechaza y el reintento se aprueba.
    const campo = publicado.body.tiposEntrada.find((t) => t.nombre === 'Campo');
    const compra = await api('POST', '/compras', {
      token: ana,
      body: { eventoId: publicado.body.id, tipoEntradaId: campo.id, cantidad: 3 },
    });
    expect(compra.status).toBe(201);
    expect(compra.body).toMatchObject({ estado: 'PENDIENTE', total: 36000 });

    const rechazado = await api('POST', `/compras/${compra.body.id}/pagos`, {
      token: ana,
      body: { medioPago: 'TARJETA_RECHAZADA' },
    });
    expect(rechazado.status).toBe(402);

    const aprobado = await api('POST', `/compras/${compra.body.id}/pagos`, {
      token: ana,
      body: { medioPago: 'TARJETA_VISA' },
    });
    expect(aprobado.status).toBe(200);
    expect(aprobado.body.estado).toBe('CONFIRMADA');

    // El cupo quedó descontado.
    const detalle = await api('GET', `/eventos/${publicado.body.id}`, { token: ana });
    expect(detalle.body.tiposEntrada.find((t) => t.id === campo.id).cupoDisponible).toBe(47);

    // US4: "Mis compras" la muestra CONFIRMADA con los días que faltan.
    const mias = await api('GET', '/compras', { token: ana });
    expect(mias.status).toBe(200);
    expect(mias.body[0]).toMatchObject({ id: compra.body.id, estado: 'CONFIRMADA' });
    expect(mias.body[0].diasParaEvento).toBeGreaterThanOrEqual(4);

    const historial = await api('GET', `/compras/${compra.body.id}`, { token: ana });
    expect(historial.body.historial.map((h) => h.estado)).toEqual(['PENDIENTE', 'CONFIRMADA']);
  });
});
