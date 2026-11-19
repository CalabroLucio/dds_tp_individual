// Después de cada test: se cancelan consultas y temporizadores de TanStack Query para no dejar procesos vivos.
const { clientesActivos } = require('./__tests__/utils/renderConProviders');

afterEach(() => {
  for (const cliente of clientesActivos) cliente.clear();
  clientesActivos.clear();
});
