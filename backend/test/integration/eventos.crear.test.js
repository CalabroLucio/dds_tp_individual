import { crearEntorno } from '../helpers/fabricas.js';
import { validarRespuesta } from '../helpers/contrato.js';
import { nuevoEventoValido } from '../helpers/datos.js';

describe('Historia 1 — el organizador publica un evento', () => {
  let entorno;
  let organizador;
  let categoriaId;

  beforeEach(async () => {
    entorno = await crearEntorno();
    organizador = await entorno.como('martina@tickets.test');
    categoriaId = entorno.datos.categorias['Música'].id;
  });

  const valido = (cambios) => nuevoEventoValido(categoriaId, entorno.reloj.ahora(), cambios);

  it('escenario 1: crea un evento con dos tipos de entrada y queda visible', async () => {
    const res = await organizador.post('/eventos').send(valido());

    expect(res.status).toBe(201);
    await validarRespuesta('/eventos', 'post', res);
    expect(res.body.tiposEntrada).toHaveLength(2);
    expect(res.body.tiposEntrada.map((t) => [t.nombre, t.cupoTotal, t.cupoDisponible])).toEqual([
      ['General', 100, 100],
      ['VIP', 20, 20],
    ]);
    expect(res.body.organizador).toMatchObject({ nombre: 'Martina', puntaje: null, cantidadResenias: 0 });
    expect(res.body.compraAbierta).toBe(true);
    expect(res.body.maxEntradasPorCompra).toBe(10);

    const detalle = await organizador.get(`/eventos/${res.body.id}`);
    expect(detalle.status).toBe(200);
    await validarRespuesta('/eventos/{eventoId}', 'get', detalle);
    expect(detalle.body.nombre).toBe('Recital de Rock Nacional');

    const mios = await organizador.get('/eventos/mios');
    expect(mios.status).toBe(200);
    await validarRespuesta('/eventos/mios', 'get', mios);
    expect(mios.body.map((e) => e.id)).toContain(res.body.id);
    expect(mios.body[0].precioDesde).toBe(15000);
  });

  it('escenario 2: rechaza un evento sin tipos de entrada', async () => {
    const res = await organizador.post('/eventos').send(valido({ tiposEntrada: [] }));
    expect(res.status).toBe(400);
    expect(res.body.error.detalles.map((d) => d.campo)).toContain('tiposEntrada');
    await validarRespuesta('/eventos', 'post', res);
  });

  it('escenario 3: rechaza fecha pasada, cupo 0 y precio negativo indicando el campo', async () => {
    const ayer = new Date(entorno.reloj.ahora().getTime() - 24 * 3_600_000).toISOString();
    const fechaPasada = await organizador.post('/eventos').send(valido({ fecha: ayer }));
    expect(fechaPasada.status).toBe(400);
    expect(fechaPasada.body.error.detalles.map((d) => d.campo)).toContain('fecha');

    const cupoCero = await organizador
      .post('/eventos')
      .send(valido({ tiposEntrada: [{ nombre: 'General', descripcion: '', precio: 100, cupo: 0 }] }));
    expect(cupoCero.status).toBe(400);
    expect(cupoCero.body.error.detalles.map((d) => d.campo)).toContain('tiposEntrada.0.cupo');

    const precioNegativo = await organizador
      .post('/eventos')
      .send(valido({ tiposEntrada: [{ nombre: 'General', descripcion: '', precio: -1, cupo: 10 }] }));
    expect(precioNegativo.status).toBe(400);
    expect(precioNegativo.body.error.detalles.map((d) => d.campo)).toContain('tiposEntrada.0.precio');
  });

  it('escenario 4: acepta una entrada gratuita (precio 0)', async () => {
    const res = await organizador
      .post('/eventos')
      .send(
        valido({ tiposEntrada: [{ nombre: 'Libre', descripcion: 'Entrada gratuita', precio: 0, cupo: 50 }] }),
      );
    expect(res.status).toBe(201);
    expect(res.body.tiposEntrada[0].precio).toBe(0);
  });

  it('escenario 5: un comprador no puede crear eventos', async () => {
    const comprador = await entorno.como('ana@tickets.test');
    const res = await comprador.post('/eventos').send(valido());
    expect(res.status).toBe(403);
    expect(res.body.error.codigo).toBe('ROL_NO_PERMITIDO');
    await validarRespuesta('/eventos', 'post', res);
  });

  it('rechaza categoría inexistente, multimedia que no es URL http(s) y tipos con nombre repetido', async () => {
    const categoria = await organizador
      .post('/eventos')
      .send(valido({ categoriaId: '00000000-0000-4000-8000-000000000000' }));
    expect(categoria.status).toBe(400);
    expect(categoria.body.error.detalles.map((d) => d.campo)).toContain('categoriaId');

    const multimedia = await organizador.post('/eventos').send(valido({ multimedia: ['ftp://archivo'] }));
    expect(multimedia.status).toBe(400);
    expect(multimedia.body.error.detalles.map((d) => d.campo)).toContain('multimedia.0');

    const repetidos = await organizador.post('/eventos').send(
      valido({
        tiposEntrada: [
          { nombre: 'General', descripcion: '', precio: 1, cupo: 1 },
          { nombre: 'general', descripcion: '', precio: 2, cupo: 1 },
        ],
      }),
    );
    expect(repetidos.status).toBe(400);
    expect(repetidos.body.error.detalles.map((d) => d.campo)).toContain('tiposEntrada.1.nombre');
  });

  it('rechaza precios con más de dos decimales', async () => {
    const res = await organizador
      .post('/eventos')
      .send(valido({ tiposEntrada: [{ nombre: 'General', descripcion: '', precio: 10.555, cupo: 1 }] }));
    expect(res.status).toBe(400);
  });

  it('GET /categorias lista las 6 categorías', async () => {
    const res = await organizador.get('/categorias');
    expect(res.status).toBe(200);
    await validarRespuesta('/categorias', 'get', res);
    expect(res.body).toHaveLength(6);
  });

  it('GET /eventos/{id}: id que no es UUID → 400; inexistente → 404', async () => {
    const malFormado = await organizador.get('/eventos/hola');
    expect(malFormado.status).toBe(400);
    expect(malFormado.body.error.codigo).toBe('VALIDACION');

    const inexistente = await organizador.get('/eventos/00000000-0000-4000-8000-000000000000');
    expect(inexistente.status).toBe(404);
    await validarRespuesta('/eventos/{eventoId}', 'get', inexistente);
  });

  it('GET /eventos/mios es solo para organizadores y no muestra eventos de otros', async () => {
    const otro = await entorno.como('joaquin@tickets.test');
    await organizador.post('/eventos').send(valido());

    const deOtro = await otro.get('/eventos/mios');
    expect(deOtro.status).toBe(200);
    expect(deOtro.body).toEqual([]);

    const comprador = await entorno.como('ana@tickets.test');
    const rechazado = await comprador.get('/eventos/mios');
    expect(rechazado.status).toBe(403);
  });
});
