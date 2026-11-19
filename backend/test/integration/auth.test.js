import express from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { crearEntorno, PASSWORD_SEED } from '../helpers/fabricas.js';
import { validarRespuesta } from '../helpers/contrato.js';

describe('POST /auth/login', () => {
  let entorno;
  beforeEach(async () => {
    entorno = await crearEntorno();
  });

  it('inicia sesión con credenciales correctas y devuelve token y usuario', async () => {
    const res = await request(entorno.app)
      .post('/auth/login')
      .send({ email: 'ana@tickets.test', password: PASSWORD_SEED });

    expect(res.status).toBe(200);
    expect(res.body.usuario).toMatchObject({ email: 'ana@tickets.test', rol: 'COMPRADOR' });
    expect(res.body.usuario).not.toHaveProperty('passwordHash');
    expect(typeof res.body.token).toBe('string');
    await validarRespuesta('/auth/login', 'post', res);
  });

  it('acepta el email con mayúsculas y espacios', async () => {
    const res = await request(entorno.app)
      .post('/auth/login')
      .send({ email: '  Martina@Tickets.TEST ', password: PASSWORD_SEED });
    expect(res.status).toBe(200);
    expect(res.body.usuario.rol).toBe('ORGANIZADOR');
  });

  it('rechaza contraseña incorrecta y email inexistente con el mismo mensaje', async () => {
    const malaPassword = await request(entorno.app)
      .post('/auth/login')
      .send({ email: 'ana@tickets.test', password: 'otra' });
    const emailInexistente = await request(entorno.app)
      .post('/auth/login')
      .send({ email: 'nadie@tickets.test', password: PASSWORD_SEED });

    expect(malaPassword.status).toBe(401);
    expect(emailInexistente.status).toBe(401);
    expect(malaPassword.body.error.codigo).toBe('CREDENCIALES_INVALIDAS');
    expect(malaPassword.body.error.mensaje).toBe(emailInexistente.body.error.mensaje);
    await validarRespuesta('/auth/login', 'post', malaPassword);
  });

  it('rechaza un cuerpo inválido con detalles por campo', async () => {
    const res = await request(entorno.app).post('/auth/login').send({ email: 'no-es-un-email' });
    expect(res.status).toBe(400);
    expect(res.body.error.codigo).toBe('VALIDACION');
    const campos = res.body.error.detalles.map((d) => d.campo);
    expect(campos).toEqual(expect.arrayContaining(['email', 'password']));
    await validarRespuesta('/auth/login', 'post', res);
  });

  it('rechaza un JSON mal formado con 400', async () => {
    const res = await request(entorno.app)
      .post('/auth/login')
      .set('Content-Type', 'application/json')
      .send('{"email": ');
    expect(res.status).toBe(400);
    expect(res.body.error.codigo).toBe('VALIDACION');
  });
});

describe('GET /auth/me', () => {
  let entorno;
  beforeEach(async () => {
    entorno = await crearEntorno();
  });

  it('devuelve el usuario de la sesión', async () => {
    const token = await entorno.loginComo('martina@tickets.test');
    const res = await request(entorno.app).get('/auth/me').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ email: 'martina@tickets.test', rol: 'ORGANIZADOR' });
    await validarRespuesta('/auth/me', 'get', res);
  });

  it('rechaza sin token', async () => {
    const res = await request(entorno.app).get('/auth/me');
    expect(res.status).toBe(401);
    expect(res.body.error.codigo).toBe('NO_AUTENTICADO');
    await validarRespuesta('/auth/me', 'get', res);
  });

  it('rechaza un token malformado', async () => {
    const res = await request(entorno.app).get('/auth/me').set('Authorization', 'Bearer basura');
    expect(res.status).toBe(401);
    expect(res.body.error.codigo).toBe('NO_AUTENTICADO');
  });

  it('rechaza un token vencido', async () => {
    const usuario = entorno.contexto.repos.usuarios.buscarPorEmail('ana@tickets.test');
    const vencido = jwt.sign({ sub: usuario.id, rol: usuario.rol }, process.env.JWT_SECRET, {
      expiresIn: -10,
    });
    const res = await request(entorno.app).get('/auth/me').set('Authorization', `Bearer ${vencido}`);
    expect(res.status).toBe(401);
    expect(res.body.error.codigo).toBe('NO_AUTENTICADO');
  });
});

describe('requerirRol', () => {
  it('deja pasar al rol correcto y rechaza al otro con 403 ROL_NO_PERMITIDO', async () => {
    const entorno = await crearEntorno();
    const { autenticar, requerirRol, manejarErrores } = entorno.contexto.middleware;
    const app = express();
    app.get('/solo-organizadores', autenticar, requerirRol('ORGANIZADOR'), (req, res) =>
      res.json({ ok: true }),
    );
    app.use(manejarErrores);

    const tokenOrganizador = await entorno.loginComo('martina@tickets.test');
    const tokenComprador = await entorno.loginComo('ana@tickets.test');

    const permitido = await request(app)
      .get('/solo-organizadores')
      .set('Authorization', `Bearer ${tokenOrganizador}`);
    const rechazado = await request(app)
      .get('/solo-organizadores')
      .set('Authorization', `Bearer ${tokenComprador}`);

    expect(permitido.status).toBe(200);
    expect(rechazado.status).toBe(403);
    expect(rechazado.body.error.codigo).toBe('ROL_NO_PERMITIDO');
  });
});

describe('rutas inexistentes y salud', () => {
  it('responde 404 con forma de error en una ruta inexistente', async () => {
    const entorno = await crearEntorno();
    const res = await request(entorno.app).get('/no-existe');
    expect(res.status).toBe(404);
    expect(res.body.error.codigo).toBe('RUTA_INEXISTENTE');
  });

  it('GET /salud responde ok sin sesión', async () => {
    const entorno = await crearEntorno();
    const res = await request(entorno.app).get('/salud');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ estado: 'ok' });
  });
});
