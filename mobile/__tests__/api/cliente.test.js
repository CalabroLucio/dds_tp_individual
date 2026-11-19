import { z } from 'zod';
import { crearCliente, ErrorApi } from '../../src/api/cliente';

const respuesta = (status, cuerpo) => ({
  ok: status >= 200 && status < 300,
  status,
  text: async () => (cuerpo === undefined ? '' : JSON.stringify(cuerpo)),
});

describe('cliente HTTP', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  it('usa la URL base y agrega el token como Bearer', async () => {
    global.fetch.mockResolvedValue(respuesta(200, { ok: true }));
    const cliente = crearCliente({ baseUrl: 'http://api.test', obtenerToken: () => 'tkn' });

    await cliente.get('/auth/me');

    const [url, opciones] = global.fetch.mock.calls[0];
    expect(url).toBe('http://api.test/auth/me');
    expect(opciones.headers.Authorization).toBe('Bearer tkn');
  });

  it('envía el cuerpo como JSON', async () => {
    global.fetch.mockResolvedValue(respuesta(201, { id: 1 }));
    const cliente = crearCliente({ baseUrl: 'http://api.test', obtenerToken: () => null });

    await cliente.post('/compras', { body: { cantidad: 2 } });

    const [, opciones] = global.fetch.mock.calls[0];
    expect(opciones.method).toBe('POST');
    expect(opciones.headers['Content-Type']).toBe('application/json');
    expect(JSON.parse(opciones.body)).toEqual({ cantidad: 2 });
    expect(opciones.headers.Authorization).toBeUndefined();
  });

  it('traduce el cuerpo { error } a un ErrorApi con código y mensaje', async () => {
    global.fetch.mockResolvedValue(
      respuesta(409, { error: { codigo: 'CUPO_INSUFICIENTE', mensaje: 'Solo quedan 2 entradas' } }),
    );
    const cliente = crearCliente({ baseUrl: 'http://api.test', obtenerToken: () => 'tkn' });

    const error = await cliente.post('/compras', { body: {} }).catch((e) => e);

    expect(error).toBeInstanceOf(ErrorApi);
    expect(error.codigo).toBe('CUPO_INSUFICIENTE');
    expect(error.mensaje).toBe('Solo quedan 2 entradas');
    expect(error.status).toBe(409);
  });

  it('avisa que la sesión venció ante un 401 con token', async () => {
    global.fetch.mockResolvedValue(
      respuesta(401, { error: { codigo: 'NO_AUTENTICADO', mensaje: 'Venció' } }),
    );
    const alSesionVencida = jest.fn();
    const cliente = crearCliente({ baseUrl: 'http://api.test', obtenerToken: () => 'tkn', alSesionVencida });

    await expect(cliente.get('/auth/me')).rejects.toBeInstanceOf(ErrorApi);
    expect(alSesionVencida).toHaveBeenCalledTimes(1);
  });

  it('no avisa sesión vencida en un 401 de login (sin token)', async () => {
    global.fetch.mockResolvedValue(
      respuesta(401, {
        error: { codigo: 'CREDENCIALES_INVALIDAS', mensaje: 'Email o contraseña incorrectos' },
      }),
    );
    const alSesionVencida = jest.fn();
    const cliente = crearCliente({ baseUrl: 'http://api.test', obtenerToken: () => null, alSesionVencida });

    await expect(cliente.post('/auth/login', { body: {} })).rejects.toMatchObject({
      codigo: 'CREDENCIALES_INVALIDAS',
    });
    expect(alSesionVencida).not.toHaveBeenCalled();
  });

  it('valida la respuesta con Zod cuando se pasa un schema', async () => {
    global.fetch.mockResolvedValue(respuesta(200, { nombre: 123 }));
    const cliente = crearCliente({ baseUrl: 'http://api.test', obtenerToken: () => null });

    const error = await cliente.get('/x', { schema: z.object({ nombre: z.string() }) }).catch((e) => e);

    expect(error).toBeInstanceOf(ErrorApi);
    expect(error.codigo).toBe('RESPUESTA_INVALIDA');
  });

  it('informa falta de conexión', async () => {
    global.fetch.mockRejectedValue(new TypeError('Network request failed'));
    const cliente = crearCliente({ baseUrl: 'http://api.test', obtenerToken: () => null });

    await expect(cliente.get('/x')).rejects.toMatchObject({ codigo: 'SIN_CONEXION' });
  });

  it('devuelve null en un 204 sin cuerpo', async () => {
    global.fetch.mockResolvedValue(respuesta(204));
    const cliente = crearCliente({ baseUrl: 'http://api.test', obtenerToken: () => 'tkn' });

    await expect(cliente.put('/favoritos/1')).resolves.toBeNull();
  });
});
