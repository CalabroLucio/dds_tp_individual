import { readFileSync } from 'node:fs';
import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yaml';
import { RUTA_CONTRATO } from './config/env.js';
import { crearRutasAuth } from './routes/auth.routes.js';
import { crearRutasCategorias } from './routes/categorias.routes.js';
import { crearRutasEventos } from './routes/eventos.routes.js';
import { manejarErrores, rutaInexistente } from './middleware/manejarErrores.js';

// Crea la app de Express sin escuchar en ningún puerto (supertest la usa directamente).
// El job periódico NO se inicia acá: lo arranca index.js (R11).
export function crearApp(contexto) {
  const app = express();
  app.disable('x-powered-by');
  app.use(cors());
  app.use(express.json({ limit: '100kb' }));

  app.get('/salud', (_req, res) => res.json({ estado: 'ok' }));

  const contrato = YAML.parse(readFileSync(RUTA_CONTRATO, 'utf8'));
  app.get('/api-docs.json', (_req, res) => res.json(contrato));
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(contrato, { customSiteTitle: 'AI Ticket It API' }));

  app.use('/auth', crearRutasAuth(contexto));
  app.use('/categorias', crearRutasCategorias(contexto));
  app.use('/eventos', crearRutasEventos(contexto));

  app.use(rutaInexistente);
  app.use(manejarErrores);
  return app;
}
