import { validarRespuesta } from '../helpers/contrato.js';

const usuarioValido = {
  id: '6f1c2a8e-3b4d-4e5f-9a0b-1c2d3e4f5a6b',
  nombre: 'Ana',
  apellido: 'Gómez',
  email: 'ana@tickets.test',
  rol: 'COMPRADOR',
};

describe('validarRespuesta (helper de contrato)', () => {
  it('acepta un cuerpo que cumple el schema', async () => {
    await expect(validarRespuesta('/auth/me', 'get', { status: 200, body: usuarioValido })).resolves.toBe(
      true,
    );
  });

  it('rechaza un cuerpo al que le falta un campo requerido', async () => {
    const { rol: _rol, ...sinRol } = usuarioValido;
    await expect(validarRespuesta('/auth/me', 'get', { status: 200, body: sinRol })).rejects.toThrow(/rol/);
  });

  it('rechaza un valor fuera del enum', async () => {
    await expect(
      validarRespuesta('/auth/me', 'get', { status: 200, body: { ...usuarioValido, rol: 'ADMIN' } }),
    ).rejects.toThrow(/enum|allowed/i);
  });

  it('rechaza un status que el contrato no documenta para la operación', async () => {
    await expect(validarRespuesta('/auth/me', 'get', { status: 418, body: {} })).rejects.toThrow(/418/);
  });

  it('valida la forma de error común', async () => {
    const error = { error: { codigo: 'NO_AUTENTICADO', mensaje: 'Iniciá sesión' } };
    await expect(validarRespuesta('/auth/me', 'get', { status: 401, body: error })).resolves.toBe(true);
    await expect(
      validarRespuesta('/auth/me', 'get', { status: 401, body: { mensaje: 'x' } }),
    ).rejects.toThrow();
  });

  it('exige cuerpo vacío en respuestas 204', async () => {
    await expect(validarRespuesta('/favoritos/{eventoId}', 'put', { status: 204, body: {} })).resolves.toBe(
      true,
    );
    await expect(
      validarRespuesta('/favoritos/{eventoId}', 'put', { status: 204, body: { algo: 1 } }),
    ).rejects.toThrow(/204/);
  });
});
