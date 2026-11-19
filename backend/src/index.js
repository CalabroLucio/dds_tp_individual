// La zona horaria se fija antes de crear cualquier fecha (cálculo de días calendario, R13).
process.env.TZ ??= 'America/Argentina/Buenos_Aires';

const { crearContexto } = await import('./contexto.js');
const { crearApp } = await import('./app.js');
const { cargarSeed } = await import('./seed/index.js');

const contexto = crearContexto();
const resumen = cargarSeed(contexto);
const app = crearApp(contexto);

const { HOST, PORT, JWT_SECRET } = contexto.entorno;
const { SECRETO_DESARROLLO } = await import('./config/env.js');
if (JWT_SECRET === SECRETO_DESARROLLO) {
  console.warn('⚠️  Usando el JWT_SECRET de desarrollo. Definí JWT_SECRET fuera de tu máquina local.');
}

const servidor = app.listen(PORT, HOST, () => {
  console.log(`AI Ticket It API escuchando en http://${HOST}:${PORT}`);
  console.log(`Swagger: http://localhost:${PORT}/api-docs`);
  console.log(`Seed: ${resumen}`);
});

const detener = () => {
  servidor.close(() => process.exit(0));
};
process.on('SIGINT', detener);
process.on('SIGTERM', detener);
