import { crearEntorno } from '../helpers/fabricas.js';
import { validarRespuesta } from '../helpers/contrato.js';
import { agregarResenia, enDias, publicarEvento } from '../helpers/datos.js';

describe('Historia 2 — el comprador busca, filtra y ordena eventos', () => {
  let entorno;
  let comprador;
  let eventos;

  beforeEach(async () => {
    entorno = await crearEntorno();
    comprador = await entorno.como('ana@tickets.test');
    const teatro = entorno.datos.categorias['Teatro'].id;

    eventos = {
      rock: publicarEvento(entorno, 'martina@tickets.test', {
        nombre: 'Rock en el Estadio',
        fecha: enDias(entorno, 5),
        tiposEntrada: [
          { nombre: 'Campo', precio: 20000, cupo: 100 },
          { nombre: 'VIP', precio: 50000, cupo: 10 },
        ],
      }),
      jazz: publicarEvento(entorno, 'joaquin@tickets.test', {
        nombre: 'Noche de Jazz',
        descripcion: 'Música improvisada en un bar íntimo',
        fecha: enDias(entorno, 2),
        tiposEntrada: [{ nombre: 'General', precio: 8000, cupo: 40 }],
      }),
      obra: publicarEvento(entorno, 'joaquin@tickets.test', {
        nombre: 'La Celestina',
        descripcion: 'Clásico español',
        categoriaId: teatro,
        fecha: enDias(entorno, 10),
        tiposEntrada: [
          { nombre: 'Platea', precio: 12000, cupo: 50 },
          { nombre: 'Pullman', precio: 3000, cupo: 50 },
        ],
      }),
    };
    // Martina tiene reseñas (4,5); Joaquín no.
    agregarResenia(entorno, { eventoId: eventos.rock.id, puntaje: 5 });
    agregarResenia(entorno, { eventoId: eventos.rock.id, puntaje: 4, compradorEmail: 'bruno@tickets.test' });
  });

  const nombres = (res) => res.body.map((e) => e.nombre);

  it('escenario 1: busca por texto en nombre, descripción o categoría sin importar tildes', async () => {
    const porNombre = await comprador.get('/eventos?q=ROCK');
    expect(porNombre.status).toBe(200);
    await validarRespuesta('/eventos', 'get', porNombre);
    expect(nombres(porNombre)).toEqual(['Rock en el Estadio']);

    const porDescripcion = await comprador.get('/eventos?q=intimo');
    expect(nombres(porDescripcion)).toEqual(['Noche de Jazz']);

    const porCategoria = await comprador.get(`/eventos?q=${encodeURIComponent('teatro')}`);
    expect(nombres(porCategoria)).toEqual(['La Celestina']);
  });

  it('escenario 2: explora por categoría', async () => {
    const res = await comprador.get(`/eventos?categoriaId=${entorno.datos.categorias['Teatro'].id}`);
    expect(nombres(res)).toEqual(['La Celestina']);
  });

  it('escenario 3: filtra por rango de precio (al menos un tipo dentro del rango)', async () => {
    const res = await comprador.get('/eventos?precioMin=2000&precioMax=5000');
    expect(nombres(res)).toEqual(['La Celestina']);
  });

  it('escenario 4: ordena por precio usando el menor precio del evento', async () => {
    const res = await comprador.get('/eventos?orden=precio');
    expect(nombres(res)).toEqual(['La Celestina', 'Noche de Jazz', 'Rock en el Estadio']);
    expect(res.body.map((e) => e.precioDesde)).toEqual([3000, 8000, 20000]);
  });

  it('escenario 5: ordena por fecha (más próximo primero) por defecto', async () => {
    const res = await comprador.get('/eventos');
    expect(nombres(res)).toEqual(['Noche de Jazz', 'Rock en el Estadio', 'La Celestina']);
  });

  it('escenario 6: ordena por puntaje del organizador con los sin reseñas al final', async () => {
    const res = await comprador.get('/eventos?orden=puntaje');
    expect(res.body[0]).toMatchObject({ nombre: 'Rock en el Estadio' });
    expect(res.body[0].organizador).toMatchObject({ puntaje: 4.5, cantidadResenias: 2 });
    expect(res.body.slice(1).every((e) => e.organizador.puntaje === null)).toBe(true);
  });

  it('escenario 7: una búsqueda sin coincidencias devuelve una lista vacía', async () => {
    const res = await comprador.get('/eventos?q=opera%20china');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('escenario 8: los eventos pasados no se ofrecen', async () => {
    entorno.reloj.avanzarHoras(24 * 3);
    const res = await comprador.get('/eventos');
    expect(nombres(res)).not.toContain('Noche de Jazz');
  });

  it('rechaza parámetros inválidos con 400', async () => {
    for (const query of [
      'orden=popularidad',
      'precioMin=-1',
      'precioMin=5000&precioMax=100',
      'categoriaId=no-es-uuid',
      'direccion=arriba',
    ]) {
      const res = await comprador.get(`/eventos?${query}`);
      expect(res.status).toBe(400);
      await validarRespuesta('/eventos', 'get', res);
    }
  });

  it('el detalle incluye las reseñas del organizador y esFavorito (false hasta la Historia 10)', async () => {
    const res = await comprador.get(`/eventos/${eventos.rock.id}`);
    expect(res.status).toBe(200);
    await validarRespuesta('/eventos/{eventoId}', 'get', res);
    expect(res.body.organizador.resenias).toHaveLength(2);
    expect(res.body.organizador.resenias[0]).toMatchObject({ evento: { nombre: 'Rock en el Estadio' } });
    expect(res.body.esFavorito).toBe(false);
  });

  it('SC-005: buscar sobre el seed más 50 eventos responde en menos de 1 segundo', async () => {
    for (let i = 0; i < 50; i++) {
      publicarEvento(entorno, 'martina@tickets.test', {
        nombre: `Evento de carga ${i}`,
        fecha: enDias(entorno, 1 + i),
      });
    }
    const inicio = performance.now();
    const res = await comprador.get('/eventos?q=evento&orden=puntaje');
    const duracion = performance.now() - inicio;
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThanOrEqual(50);
    expect(duracion).toBeLessThan(1000);
  });
});
