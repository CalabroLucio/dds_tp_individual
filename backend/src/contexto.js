import { cargarEntorno } from './config/env.js';
import { cargarReglas } from './config/reglas.js';
import { relojSistema } from './utils/reloj.js';
import { crearStore } from './repository/store.js';
import { crearUsuariosRepository } from './repository/usuarios.repository.js';
import { crearCategoriasRepository } from './repository/categorias.repository.js';
import { crearEventosRepository } from './repository/eventos.repository.js';
import { crearComprasRepository } from './repository/compras.repository.js';
import { crearReseniasRepository } from './repository/resenias.repository.js';
import { crearAuthService } from './services/auth.service.js';
import { crearPresentacion } from './services/presentacion.js';
import { crearEventosService } from './services/eventos.service.js';
import { crearCategoriasService } from './services/categorias.service.js';
import { crearComprasService } from './services/compras.service.js';
import { crearMensajesService } from './services/mensajes.service.js';
import { crearCiclo } from './jobs/ciclo.job.js';
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
    eventos: crearEventosRepository(store),
    compras: crearComprasRepository(store),
    resenias: crearReseniasRepository(store),
  };

  const presentacion = crearPresentacion({ repos, reloj, reglas });

  const services = {
    auth: crearAuthService({ usuariosRepo: repos.usuarios, entorno }),
    categorias: crearCategoriasService({ repos, presentacion }),
    eventos: crearEventosService({ repos, reloj, presentacion }),
    compras: crearComprasService({ repos, reloj, reglas, presentacion }),
  };
  services.mensajes = crearMensajesService({ repos, reloj, comprasService: services.compras });

  const jobs = { ciclo: crearCiclo({ repos, reglas }) };

  const middleware = {
    autenticar: crearAutenticar({ authService: services.auth, usuariosRepo: repos.usuarios }),
    requerirRol,
    manejarErrores,
  };

  return { reloj, reglas, entorno, store, repos, presentacion, services, jobs, middleware };
}
