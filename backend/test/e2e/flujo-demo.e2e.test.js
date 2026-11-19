import { levantarServidor } from './helpers/servidor.js';

// Flujo elegido para el video sobre el servidor real con el seed de demostración:
// comprar → pagar (rechazo y reintento) → chat → cancelar, y comprar → pagar → utilizar → reseñar.
describe('E2E — flujo del video', () => {
  let s;
  let ana;
  let bruno;
  let martina;

  beforeAll(async () => {
    s = await levantarServidor({ seedCompleto: true });
    [ana, bruno, martina] = await Promise.all(
      ['ana', 'bruno', 'martina'].map((n) => s.login(`${n}@tickets.test`)),
    );
  });
  afterAll(() => s.cerrar());

  const buscar = async (texto) =>
    (await s.api('GET', `/eventos?q=${encodeURIComponent(texto)}`, { token: ana })).body[0];

  it('comprar → pagar con rechazo y reintento → chat → cancelar con reembolso', async () => {
    const standup = await buscar('risas sin filtro');
    const detalle = (await s.api('GET', `/eventos/${standup.id}`, { token: ana })).body;
    expect(detalle.avisoNoCancelable).toBe(false);

    const compra = await s.api('POST', '/compras', {
      token: ana,
      body: { eventoId: standup.id, tipoEntradaId: detalle.tiposEntrada[0].id, cantidad: 2 },
    });
    expect(compra.status).toBe(201);

    const id = compra.body.id;
    expect(
      (await s.api('POST', `/compras/${id}/pagos`, { token: ana, body: { medioPago: 'TARJETA_RECHAZADA' } }))
        .status,
    ).toBe(402);
    expect(
      (await s.api('POST', `/compras/${id}/pagos`, { token: ana, body: { medioPago: 'TARJETA_VISA' } })).body
        .estado,
    ).toBe('CONFIRMADA');

    await s.api('POST', `/compras/${id}/mensajes`, {
      token: ana,
      body: { texto: 'No voy a poder ir, ¿cómo cancelo?' },
    });
    await s.api('POST', `/compras/${id}/mensajes`, {
      token: martina,
      body: { texto: 'Desde la app, con reembolso total.' },
    });
    const chat = await s.api('GET', `/compras/${id}/mensajes`, { token: ana });
    expect(chat.body.map((m) => m.autor.rol)).toEqual(['COMPRADOR', 'ORGANIZADOR']);

    const cancelada = await s.api('POST', `/compras/${id}/cancelacion`, { token: ana });
    expect(cancelada.body.estado).toBe('REEMBOLSADA');
    const historial = (await s.api('GET', `/compras/${id}`, { token: ana })).body.historial.map(
      (h) => h.estado,
    );
    expect(historial).toEqual(['PENDIENTE', 'CONFIRMADA', 'REEMBOLSADA']);
  });

  it('comprar con aviso de no cancelable → pagar → el organizador la marca utilizada → reseñar', async () => {
    const rock = await buscar('noche de rock');
    const detalle = (await s.api('GET', `/eventos/${rock.id}`, { token: bruno })).body;
    expect(detalle.avisoNoCancelable).toBe(true);
    const puntajeAntes = detalle.organizador.puntaje;

    const compra = (
      await s.api('POST', '/compras', {
        token: bruno,
        body: { eventoId: rock.id, tipoEntradaId: detalle.tiposEntrada[0].id, cantidad: 1 },
      })
    ).body;
    expect(compra.acciones.puedeCancelar).toBe(false);
    await s.api('POST', `/compras/${compra.id}/pagos`, {
      token: bruno,
      body: { medioPago: 'DINERO_EN_CUENTA' },
    });

    const usada = await s.api('POST', `/compras/${compra.id}/uso`, { token: martina });
    expect(usada.body.estado).toBe('UTILIZADA');

    const resenia = await s.api('POST', `/compras/${compra.id}/resenia`, {
      token: bruno,
      body: { puntaje: 1, comentario: 'Empezó muy tarde.' },
    });
    expect(resenia.status).toBe(201);
    const despues = (await s.api('GET', `/eventos/${rock.id}`, { token: bruno })).body.organizador;
    expect(despues.cantidadResenias).toBe(detalle.organizador.cantidadResenias + 1);
    expect(despues.puntaje).toBeLessThan(puntajeAntes);
  });

  it('50 compras simultáneas por HTTP real sobre cupo 10 → exactamente 10 aceptadas', async () => {
    const fecha = new Date(Date.now() + 3 * 24 * 3_600_000).toISOString();
    const evento = (
      await s.api('POST', '/eventos', {
        token: martina,
        body: {
          nombre: 'Show con cupo chico',
          descripcion: 'Para la prueba de concurrencia',
          categoriaId: s.datos.categorias['Música'].id,
          fecha,
          tiposEntrada: [{ nombre: 'Única', descripcion: '', precio: 100, cupo: 10 }],
        },
      })
    ).body;
    const tokens = [ana, bruno, await s.login('carla@tickets.test')];
    const respuestas = await Promise.all(
      Array.from({ length: 50 }, (_, i) =>
        s.api('POST', '/compras', {
          token: tokens[i % 3],
          body: { eventoId: evento.id, tipoEntradaId: evento.tiposEntrada[0].id, cantidad: 1 },
        }),
      ),
    );
    expect(respuestas.filter((r) => r.status === 201)).toHaveLength(10);
    expect(respuestas.filter((r) => r.status === 409)).toHaveLength(40);
  });
});
