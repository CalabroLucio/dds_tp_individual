import { crearEntorno } from '../helpers/fabricas.js';
import { validarRespuesta } from '../helpers/contrato.js';
import { enDias, publicarEvento } from '../helpers/datos.js';

describe('Historia 8 — chat por compra entre comprador y organizador', () => {
  let entorno;
  let ana;
  let martina;
  let compra;

  beforeEach(async () => {
    entorno = await crearEntorno();
    ana = await entorno.como('ana@tickets.test');
    martina = await entorno.como('martina@tickets.test');
    const evento = publicarEvento(entorno, 'martina@tickets.test', {
      fecha: enDias(entorno, 3),
      tiposEntrada: [{ nombre: 'General', precio: 100, cupo: 10 }],
    });
    compra = (
      await ana
        .post('/compras')
        .send({ eventoId: evento.id, tipoEntradaId: evento.tiposEntrada[0].id, cantidad: 1 })
    ).body;
  });

  const ruta = () => `/compras/${compra.id}/mensajes`;
  const enviar = (cliente, texto) => cliente.post(ruta()).send({ texto });

  it('escenarios 1–2: comprador y organizador intercambian mensajes en orden, con autor y hora', async () => {
    const pregunta = await enviar(ana, '¿Se puede entrar con cámara?');
    expect(pregunta.status).toBe(201);
    await validarRespuesta('/compras/{compraId}/mensajes', 'post', pregunta);
    expect(pregunta.body).toMatchObject({
      texto: '¿Se puede entrar con cámara?',
      autor: { nombre: 'Ana', rol: 'COMPRADOR' },
      enviadoEn: entorno.reloj.ahora().toISOString(),
    });

    entorno.reloj.avanzarMinutos(2);
    await enviar(martina, 'Sí, sin flash.');

    const conversacion = await ana.get(ruta());
    expect(conversacion.status).toBe(200);
    await validarRespuesta('/compras/{compraId}/mensajes', 'get', conversacion);
    expect(conversacion.body.map((m) => [m.autor.rol, m.texto])).toEqual([
      ['COMPRADOR', '¿Se puede entrar con cámara?'],
      ['ORGANIZADOR', 'Sí, sin flash.'],
    ]);
  });

  it('filtra con `desde` para traer solo los mensajes nuevos (polling)', async () => {
    const primero = await enviar(ana, 'Hola');
    entorno.reloj.avanzarMinutos(1);
    await enviar(martina, 'Hola, ¿en qué te ayudo?');
    const res = await ana.get(`${ruta()}?desde=${encodeURIComponent(primero.body.enviadoEn)}`);
    expect(res.body.map((m) => m.texto)).toEqual(['Hola, ¿en qué te ayudo?']);
  });

  it('se puede escribir en cualquier estado, incluso con la compra cancelada', async () => {
    await ana.post(`/compras/${compra.id}/cancelacion`);
    expect((await enviar(ana, '¿Me confirman el reembolso?')).status).toBe(201);
    expect((await enviar(martina, 'Ya está acreditado.')).status).toBe(201);
  });

  it('escenario 3: un tercero no puede leer ni escribir', async () => {
    const bruno = await entorno.como('bruno@tickets.test');
    const joaquin = await entorno.como('joaquin@tickets.test');
    const leer = await bruno.get(ruta());
    expect(leer.status).toBe(403);
    await validarRespuesta('/compras/{compraId}/mensajes', 'get', leer);
    expect((await enviar(joaquin, 'Hola')).status).toBe(403);
  });

  it('escenario 4: rechaza mensajes vacíos, de solo espacios o de más de 500 caracteres', async () => {
    for (const texto of ['', '    ', 'x'.repeat(501)]) {
      const res = await enviar(ana, texto);
      expect(res.status).toBe(400);
      await validarRespuesta('/compras/{compraId}/mensajes', 'post', res);
    }
    expect((await enviar(ana, '  con espacios  ')).body.texto).toBe('con espacios');
  });

  it('compra inexistente → 404; `desde` inválido → 400', async () => {
    expect((await ana.get('/compras/00000000-0000-4000-8000-000000000000/mensajes')).status).toBe(404);
    expect((await ana.get(`${ruta()}?desde=ayer`)).status).toBe(400);
  });
});
