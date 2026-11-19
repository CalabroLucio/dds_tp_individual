import { cargarEntorno } from './config/env.js';
import { cargarReglas } from './config/reglas.js';
import { relojSistema } from './utils/reloj.js';
import { crearStore } from './repository/store.js';
import { crearUsuariosRepository } from './repository/usuarios.repository.js';
import { crearCategoriasRepository } from './repository/categorias.repository.js';
import { crearAuthService } from './services/auth.service.js';
import { crearAutenticar } from './middleware/autenticar.js';
import { requerirRol } from './middleware/requerirRol.js';
import { manejarErrores } from './middleware/manejarErrores.js';

// Arma el grafo de dependencias de la aplicación. Los tests lo crean con un reloj y reglas propios.
export function crearContexto({
  reloj = relojSistema,
  reglas = cargarReglas(),
  entorno = cargarEntorno(),
  store = crearStore(),
} = {}) {
  const repos = {
    usuarios: crearUsuariosRepository(store),
    categorias: crearCategoriasRepository(store),
  };

  const services = {
    auth: crearAuthService({ usuariosRepo: repos.usuarios, entorno }),
  };

  const middleware = {
    autenticar: crearAutenticar({ authService: services.auth, usuariosRepo: repos.usuarios }),
    requerirRol,
    manejarErrores,
  };

  return { reloj, reglas, entorno, store, repos, services, middleware };
}
