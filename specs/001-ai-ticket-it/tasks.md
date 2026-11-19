---
description: "Lista de tareas de AI Ticket It — venta de entradas para eventos"
---

# Tasks: AI Ticket It — Venta de entradas para eventos

**Input**: documentos de diseño en `specs/001-ai-ticket-it/`

**Prerrequisitos**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md),
[contracts/openapi.yaml](contracts/openapi.yaml), [quickstart.md](quickstart.md)

**Tests**: **obligatorios y primero** (constitution II, NON-NEGOTIABLE). En cada historia, las tareas de test se
escriben antes de la implementación y deben verse fallar (Red) antes de pasar a las tareas de implementación (Green).

**Organización**: por user story, para implementar y probar cada una de forma independiente.

## Formato: `[ID] [P?] [Story] Descripción con ruta`

- **[P]**: se puede hacer en paralelo (archivos distintos, sin dependencias pendientes)
- **[USn]**: user story a la que pertenece (solo en fases de historia)
- Las citas `data-model.md · Entidad.campo` indican de dónde sale cada restricción; no se repiten aquí.

## Convenciones de rutas

- Backend: `backend/src/…` y `backend/test/…` · Mobile: `mobile/src/…` y `mobile/__tests__/…`
- Contrato: `specs/001-ai-ticket-it/contracts/openapi.yaml` (se modifica **primero** si hay que cambiar la API)
- Los tests de integración validan cada respuesta contra el contrato con `validarRespuesta` (T012)
- Un archivo compartido por varias historias (por ejemplo `mobile/src/app/compra/[id].js`) se edita de forma
  secuencial: no marcar [P] las tareas que lo tocan

---

## Phase 1: Setup (infraestructura compartida)

**Propósito**: repo ejecutable con ambos paquetes y herramientas de calidad.

- [X] T001 Crear `package.json` raíz con scripts (`dev:backend`, `start:mobile`, `test`, `test:e2e`, `lint`, `format`) y devDependencies (`concurrently`, `eslint`, `prettier`); crear `eslint.config.js`, `.prettierrc` y `.editorconfig` en la raíz
- [X] T002 Crear `backend/package.json` (`"type": "module"`, scripts `start`, `dev`, `test` con `node --experimental-vm-modules`, `test:e2e`) e instalar dependencias de [plan.md](plan.md) (`express`, `cors`, `zod`, `jsonwebtoken`, `bcryptjs`, `swagger-ui-express`, `yaml`; dev: `jest`, `supertest`, `ajv`, `ajv-formats`, `@apidevtools/swagger-parser`); crear `backend/jest.config.js` y las carpetas `backend/src/{config,routes,controllers,services,domain,repository,schemas,middleware,errors,jobs,utils,seed}` y `backend/test/{unit,integration,e2e,helpers}`
- [ ] T003 [P] **(acción manual del autor; bloquea solo ver las pantallas mobile en el celular, no el backend ni los tests)** Instalar Expo Go para SDK 57 en el celular Android (`npx expo-go download android 57` o <https://expo.dev/go>) y activar el modo mirrored de WSL siguiendo [quickstart.md](quickstart.md) §1 (`.wslconfig` + `wsl --shutdown`); anotar la IP de la PC en la red local
- [X] T004 Crear el proyecto `mobile/` con `npx create-expo-app@latest mobile --template default@sdk-57` (si la plantilla no existe, usar `create-expo-app@latest` y confirmar que genera SDK 57), convertirlo a **JavaScript** (renombrar a `.js`, quitar `tsconfig.json` y tipos, `npm run reset-project` para limpiar el boilerplate) y dejar `mobile/src/app/` con expo-router; si la conversión falla, usar `--template blank` y agregar expo-router a mano (riesgo R2 en [research.md](research.md))
- [X] T005 Instalar en `mobile/` con `npx expo install` las dependencias compatibles con el SDK (`react-native-paper`, `react-native-safe-area-context`, `expo-secure-store`, `expo-image`, `@react-native-community/datetimepicker`) más `@tanstack/react-query` y `zod`; dev: `jest-expo`, `@testing-library/react-native`, `jest`; crear `mobile/jest.config.js` y un test de humo `mobile/__tests__/humo.test.js` que pase
- [X] T006 [P] Crear `backend/.env.example` (`PORT`, `JWT_SECRET`, `TZ`, y las constantes de [data-model.md](data-model.md) §Configuración) y `mobile/.env.example` (`EXPO_PUBLIC_API_URL`)

**Checkpoint**: `npm install` en los tres `package.json` funciona, `npm test --prefix mobile` pasa el test de humo.

---

## Phase 2: Foundational (prerrequisitos bloqueantes)

**Propósito**: base de backend y mobile que TODAS las historias necesitan.

**⚠️ CRÍTICO**: ninguna historia puede empezar hasta terminar esta fase.

### Backend

- [X] T007 [P] Crear `backend/src/config/reglas.js` (constantes `LIMITE_CANCELACION_MIN`, `EXPIRACION_PENDIENTE_MIN`, `AUTO_UTILIZADA_HORAS`, `MAX_ENTRADAS_POR_COMPRA`, `JWT_EXPIRACION`, `INTERVALO_JOB_SEG` con los valores de [data-model.md](data-model.md) §Configuración, sobrescribibles por entorno) y `backend/src/config/env.js` (validación Zod del entorno, `TZ` por defecto `America/Argentina/Buenos_Aires`)
- [X] T008 [P] Escribir test (debe fallar) `backend/test/unit/utils.test.js`: `normalizar` (minúsculas y sin tildes), `diasCalendario` (0 = hoy, 20, cruce de medianoche, zona Buenos Aires) y reloj inyectable
- [X] T009 Implementar `backend/src/utils/reloj.js`, `backend/src/utils/texto.js` y `backend/src/utils/fechas.js` hasta pasar T008 (R10, R12, R13 en [research.md](research.md))
- [X] T010 [P] Crear la jerarquía de errores `backend/src/errors/ErrorApp.js` y `backend/src/errors/index.js` con un error por código del contrato y su estado HTTP (`VALIDACION` 400, `NO_AUTENTICADO` y `CREDENCIALES_INVALIDAS` 401, `PAGO_RECHAZADO` 402, `ROL_NO_PERMITIDO`, `NO_AUTORIZADO` y `ORGANIZADOR_NO_PUEDE_COMPRAR` 403, `NO_ENCONTRADO` 404, `CUPO_INSUFICIENTE`, `CANTIDAD_EXCEDE_MAXIMO`, `EVENTO_NO_DISPONIBLE`, `ESTADO_INVALIDO`, `FUERA_DE_PLAZO`, `AUN_NO_HABILITADA` y `YA_RESENIADA` 409)
- [X] T011 [P] Crear los helpers de prueba `backend/test/helpers/relojDePrueba.js` (reloj controlable) y `backend/test/helpers/fabricas.js` (arma `crearApp` con reloj de prueba y store limpio, `loginComo(rol)`, y atajos para insertar eventos y compras directo en el repositorio) y `backend/test/e2e/helpers/servidor.js` (levanta la app en puerto efímero)
- [X] T012 Crear `backend/test/helpers/contrato.js` con `validarRespuesta(ruta, metodo, status, cuerpo)` (Ajv dialecto 2020-12 + `@apidevtools/swagger-parser` sobre `specs/001-ai-ticket-it/contracts/openapi.yaml`, R7) y `backend/test/unit/contrato.helper.test.js` que demuestre que acepta un cuerpo válido y rechaza uno al que le falta un campo requerido
- [X] T013 Escribir test de integración (debe fallar) `backend/test/integration/auth.test.js`: login correcto, credenciales inválidas (mismo mensaje para email y contraseña), cuerpo inválido 400, `GET /auth/me` con y sin token, token vencido o malformado → 401, y una ruta de prueba que verifique `requerirRol` (403); todas las respuestas contra el contrato
- [X] T014 [P] Crear `backend/src/repository/store.js` (colecciones `Map`, función `reiniciar`), `backend/src/repository/usuarios.repository.js` (`buscarPorEmail`, `porId`; el email único según data-model.md · `Usuario.email`) y `backend/src/repository/categorias.repository.js` (unicidad según data-model.md · `Categoria.nombre`)
- [X] T015 [P] Crear `backend/src/schemas/auth.schema.js` (Zod para `LoginRequest`; formato de email según data-model.md · `Usuario.email`)
- [X] T016 Crear los middleware `backend/src/middleware/autenticar.js` (verifica JWT, adjunta usuario), `backend/src/middleware/requerirRol.js` (data-model.md · `Usuario.rol`), `backend/src/middleware/validar.js` (Zod sobre **body, query y params** → `VALIDACION` con `detalles`; un id de ruta que no es UUID responde 400, constitution I) y `backend/src/middleware/manejarErrores.js` (forma `{ error: { codigo, mensaje, detalles } }`)
- [X] T017 Implementar `backend/src/services/auth.service.js` (bcryptjs, JWT con `JWT_EXPIRACION`), `backend/src/controllers/auth.controller.js` y `backend/src/routes/auth.routes.js` (`POST /auth/login`, `GET /auth/me`) hasta pasar T013
- [X] T018 Crear `backend/src/app.js` (`crearApp(deps)`: cors, json, rutas, Swagger UI en `/api-docs` y `/api-docs.json` leyendo `openapi.yaml`, `GET /salud`, manejador de errores y 404 con forma de error) y `backend/src/index.js` (carga el seed base, escucha en `0.0.0.0` y el puerto configurado)
- [X] T019 Crear `backend/src/seed/seed.js` con `cargarSeedBase`: las 6 categorías (data-model.md · `Categoria.nombre`) y los 5 usuarios del seed (2 organizadores y 3 compradores, email único, contraseña `demo1234`, data-model.md · `Usuario.nombre`, `Usuario.apellido`, `Usuario.email`, `Usuario.rol`)

### Mobile

- [X] T020 [P] Crear `mobile/src/theme/tema.js` (tema de React Native Paper con la paleta verde de AI Ticket It) y `mobile/src/components/{Cargando,MensajeError,EstadoVacio}.js`
- [X] T021 [P] Escribir test (debe fallar) `mobile/__tests__/api/cliente.test.js`: agrega `Authorization: Bearer`, traduce el cuerpo `{ error }` a un error con `codigo` y `mensaje`, y llama al callback de sesión vencida ante un 401
- [X] T022 Implementar `mobile/src/api/cliente.js` (base `EXPO_PUBLIC_API_URL`, fetch, validación Zod de respuestas) y `mobile/src/api/auth.js` hasta pasar T021
- [X] T023 [P] Escribir test (debe fallar) `mobile/__tests__/session/SessionProvider.test.js`: restaura la sesión desde `expo-secure-store` al iniciar, `login` guarda el token, `logout` lo borra
- [X] T024 Implementar `mobile/src/session/SessionProvider.js` hasta pasar T023
- [X] T025 [P] Escribir test (debe fallar) `mobile/__tests__/login.test.js`: pantalla de login con validación y mensaje de error ante credenciales inválidas; redirige según el rol
- [X] T026 Implementar `mobile/src/app/_layout.js` (providers de Paper, TanStack Query y sesión; `Stack.Protected guard` para `login`, `(comprador)` y `(organizador)`, R2), `mobile/src/app/login.js`, `mobile/src/app/(comprador)/_layout.js` y `mobile/src/app/(organizador)/_layout.js` (tabs que por ahora declaran solo `perfil`; cada historia agrega su tab al crear la pantalla), más una pantalla `perfil.js` mínima en cada grupo con cierre de sesión, hasta pasar T025
- [X] T027 [P] Crear `mobile/src/components/ChipEstado.js` (color y rótulo por `EstadoCompra`) con test `mobile/__tests__/components/ChipEstado.test.js`

### Verificación del entorno

- [ ] T028 **(manual; diferible: hacerlo antes de empezar las pantallas mobile de las historias, no bloquea el carril de backend)** Con `npm run dev:backend` y `npm run start:mobile` corriendo: abrir `http://<IP-de-la-PC>:3000/api-docs` en el celular, abrir la app en Expo Go, iniciar sesión como `ana@tickets.test` y como `martina@tickets.test` y ver el grupo de pantallas correcto; si no conecta, abrir los puertos 3000 y 8081 en el firewall de Windows (riesgo R6 en [research.md](research.md))
- [ ] T029 **(acción del autor; hacerlo cuando ya exista código de la Fase 2 de backend)** Ejecutar `codegraph init -i` en la raíz para indexar el código existente; desde ahí el hook `post-commit` mantiene el grafo al día

**Checkpoint**: `npm test` verde en ambos paquetes y login probado por tests. El carril de backend de las historias puede empezar ya; el carril de mobile puede escribir sus tests, pero las pantallas se verifican en el celular recién después de T003 y T028 (backend y mobile en paralelo con worktrees).

---

## Phase 3: User Story 1 — El organizador publica un evento (Priority: P1) 🎯 MVP

**Goal**: un organizador crea un evento con varios tipos de entrada y aparece en el catálogo.

**Independent Test**: iniciar sesión como organizador, crear un evento con dos tipos de entrada y verlo en "Mis eventos" y en `GET /eventos/{id}`; probar los rechazos (sin tipos, fecha pasada, cupo 0, precio negativo, rol comprador).

### Tests (escribir primero; deben fallar)

- [X] T030 [P] [US1] Test unitario `backend/test/unit/evento.domain.test.js`: `precioDesde`, `cupoDisponible`, `hayCupoPara`, `compraAbierta` y `avisoNoCancelable` con límites exactos (30 min antes → aviso; evento empezado → cerrado)
- [X] T031 [P] [US1] Test unitario `backend/test/unit/puntaje.test.js`: promedio de reseñas redondeado a 1 decimal (5 y 3 → 4) y `null` sin reseñas (data-model.md · puntaje del organizador)
- [X] T032 [P] [US1] Test de integración `backend/test/integration/eventos.crear.test.js`: escenarios 1–5 de la story 1, `GET /categorias`, `GET /eventos/mios` y detalle del evento creado, un `eventoId` que no es UUID → 400, todo contra el contrato

### Implementación backend

- [X] T033 [P] [US1] Crear `backend/src/schemas/evento.schema.js` (Zod para `NuevoEvento`): data-model.md · `Evento.nombre`, `Evento.descripcion`, `Evento.categoriaId`, `Evento.fecha`, `Evento.multimedia`, `Evento.tiposEntrada`, `TipoEntrada.nombre`, `TipoEntrada.descripcion`, `TipoEntrada.precio` y `TipoEntrada.cupo`
- [X] T034 [P] [US1] Crear `backend/src/domain/evento.js` y `backend/src/domain/puntaje.js` (reglas de T030 y T031; incluye data-model.md · `Evento.organizadorId` como organizador con rol ORGANIZADOR)
- [X] T035 [US1] Crear `backend/src/repository/eventos.repository.js` (guardar, `porId`, `listarPorOrganizador`) y `backend/src/services/eventos.service.js` (`crear`, `misEventos`, `detalle` con organizador y puntaje) y `backend/src/services/categorias.service.js`
- [X] T036 [US1] Crear controllers y rutas: `backend/src/controllers/eventos.controller.js`, `backend/src/routes/eventos.routes.js` (`POST /eventos`, `GET /eventos/mios`, `GET /eventos/:eventoId`) y `backend/src/routes/categorias.routes.js` (`GET /categorias`), con `requerirRol('ORGANIZADOR')` donde corresponda, hasta pasar T030–T032

### Mobile

- [X] T037 [P] [US1] Test `mobile/__tests__/organizador/nuevoEvento.test.js`: formulario con tipos de entrada dinámicos (agregar y quitar), muestra el mensaje del backend ante un rechazo y navega al detalle al crear
- [X] T038 [US1] Crear `mobile/src/api/eventos.js` (con esquemas Zod de respuesta), `mobile/src/hooks/useCategorias.js` y `mobile/src/hooks/useMisEventos.js`
- [X] T039 [US1] Crear `mobile/src/app/(organizador)/mis-eventos.js` (lista con estado vacío) (y su tab en `(organizador)/_layout.js`) y `mobile/src/app/evento/nuevo.js` (formulario con selector de categoría, selector de fecha y hora, lista de URLs de multimedia y tipos de entrada dinámicos), hasta pasar T037

**Checkpoint**: US1 funcional y probada de forma independiente. Commit de hito.

---

## Phase 4: User Story 2 — El comprador busca, filtra y ordena (Priority: P1)

**Goal**: el comprador encuentra eventos por texto o categoría, filtra por precio, ordena y abre el detalle.

**Independent Test**: con eventos de ejemplo, buscar un texto, filtrar por categoría y rango de precio, cambiar el orden y verificar los resultados; abrir el detalle de un evento.

### Tests (escribir primero; deben fallar)

- [X] T040 [P] [US2] Test unitario `backend/test/unit/busqueda.test.js`: texto con tildes y mayúsculas sobre nombre, descripción y categoría; categoría; rango de precio (al menos un tipo dentro); orden por precio (mínimo del evento), fecha (más próximo primero) y puntaje (sin reseñas al final); excluye eventos pasados
- [X] T041 [P] [US2] Test de integración `backend/test/integration/eventos.buscar.test.js`: `GET /eventos` con cada combinación de parámetros, lista vacía, parámetros inválidos → 400 (incluido `precioMin` > `precioMax`), el detalle con `organizador.resenias` y `esFavorito` (en esta historia solo se verifica que exista y valga `false`; el `true` lo cubre US10), y que la búsqueda sobre el seed base más 50 eventos responda en menos de 1 s (SC-005), contra el contrato

### Implementación backend

- [X] T042 [P] [US2] Crear `backend/src/domain/busqueda.js` (filtros y ordenamientos puros; usa `utils/texto.js`) y `backend/src/schemas/busqueda.schema.js` (query: `q`, `categoriaId`, `precioMin`, `precioMax`, `orden`, `direccion`)
- [X] T043 [US2] Extender `backend/src/services/eventos.service.js` con `listar` (resumen con `precioDesde`, organizador y puntaje) y agregar `GET /eventos` en `backend/src/routes/eventos.routes.js` y el controller, hasta pasar T040 y T041

### Mobile

- [X] T044 [P] [US2] Tests `mobile/__tests__/comprador/explorar.test.js` (buscador, chips de categoría, selector de orden, filtro de precio, estado vacío) y `mobile/__tests__/comprador/detalleEvento.test.js` (tipos de entrada con cupo y "agotado", puntaje del organizador y lista de reseñas)
- [X] T045 [US2] Crear `mobile/src/hooks/useEventos.js` (con *debounce* del texto), `mobile/src/components/TarjetaEvento.js` y `mobile/src/app/(comprador)/explorar.js` (y su tab en `(comprador)/_layout.js`)
- [X] T046 [US2] Crear `mobile/src/app/evento/[id].js` (detalle: descripción, multimedia con `expo-image`, tipos de entrada, puntaje y reseñas del organizador), hasta pasar T044

**Checkpoint**: US1 + US2 funcionan: un organizador publica y un comprador encuentra. Commit de hito.

---

## Phase 5: User Story 3 — El comprador compra y paga (Priority: P1)

**Goal**: comprar tipo y cantidad reservando cupo de forma atómica, y pagar con un pago simulado; la compra expira a los 15 minutos si no se paga.

**Independent Test**: comprar 2 entradas de un tipo con cupo 10 (cupo → 8, compra PENDIENTE); pagar con `TARJETA_RECHAZADA` (402, sigue PENDIENTE) y reintentar con `TARJETA_VISA` (CONFIRMADA); 50 compras simultáneas sobre cupo 10 → exactamente 10 × 201 y 40 × 409.

### Tests (escribir primero; deben fallar)

- [X] T047 [P] [US3] Test unitario `backend/test/unit/compra.domain.test.js`: creación (total, `expiraEn`, estado PENDIENTE, historial inicial), matriz de transiciones permitidas y prohibidas, y `acciones.puedePagar`
- [X] T048 [P] [US3] Test unitario `backend/test/unit/reserva.atomica.test.js`: `crearCompraReservandoCupo` es **síncrona** (no devuelve una promesa), nunca supera el cupo, y un repositorio sustituto que cede el control entre el chequeo y el descuento hace fallar la verificación (evita el falso positivo, R9 en [research.md](research.md))
- [X] T049 [P] [US3] Test de integración `backend/test/integration/compras.crear.test.js`: escenarios 1, 5, 7, 8, 9, 10 y 11 de la story 3 (cantidad > cupo, > 10, organizador sobre evento propio → 403, aviso de no cancelable, evento empezado → 409) y la prueba de concurrencia de **50 solicitudes sobre cupo 10 → 10 × 201 y 40 × 409** (SC-002), contra el contrato
- [X] T050 [P] [US3] Test de integración `backend/test/integration/compras.pagar.test.js`: pago aprobado, `TARJETA_RECHAZADA` → 402 y sigue PENDIENTE con cupo reservado, reintento aprobado, pagar compra CONFIRMADA/CANCELADA → 409, compra ajena → 403, pagar con `ahora ≥ expiraEn` aunque el job todavía no corrió → la compra pasa a CANCELADA (registrada como sistema) y responde 409 `ESTADO_INVALIDO`, y `GET /medios-pago`
- [X] T051 [P] [US3] Test unitario `backend/test/unit/ciclo.expiracion.test.js`: `ejecutarCiclo(ahora)` cancela PENDIENTES con 15 min exactos, libera el cupo, registra `quien = SISTEMA` y no toca CONFIRMADAS ni PENDIENTES más recientes (SC-007)

### Implementación backend

- [X] T052 [P] [US3] Crear `backend/src/schemas/compra.schema.js` (Zod para `NuevaCompra` y `NuevoPago`; data-model.md · `Compra.cantidad`, `Compra.tipoEntradaId` y `Compra.compradorId`). Precisión: el Zod valida solo que `cantidad` sea entera ≥ 1; el máximo por compra y el cupo los valida el servicio (T055) con 409 `CANTIDAD_EXCEDE_MAXIMO` y `CUPO_INSUFICIENTE`, como dice el contrato
- [X] T053 [P] [US3] Crear `backend/src/domain/compra.js` (creación con data-model.md · `Compra.total`, `Compra.estado`, `Compra.expiraEn` y `CambioEstadoCompra.estado`, `CambioEstadoCompra.quien`, `CambioEstadoCompra.fechaHora`; tabla de transiciones de [data-model.md](data-model.md) §Máquina de estados; cálculo de `acciones`) y `backend/src/domain/pagos.js` (medios simulados deterministas, R19)
- [X] T054 [US3] Crear `backend/src/repository/compras.repository.js` con `crearCompraReservandoCupo` (sección síncrona atómica, constitution III), cálculo de `cupoDisponible` (data-model.md · `TipoEntrada.cupo`) y liberación de cupo
- [X] T055 [US3] Crear `backend/src/services/compras.service.js` (`crearCompra` y `pagar`: rol, organizador no compra su evento, evento no empezado, máximo por compra, pertenencia del tipo al evento; `pagar` trata como vencida toda PENDIENTE con `ahora ≥ expiraEn`, la cancela en el momento y responde 409), `backend/src/controllers/compras.controller.js` y `backend/src/routes/compras.routes.js` (`POST /compras`, `POST /compras/:compraId/pagos`) y `GET /medios-pago`
- [X] T056 [US3] Crear `backend/src/jobs/ciclo.job.js` con `ejecutarCiclo(ahora)` (expiración de PENDIENTES) e `iniciarJob` (`setInterval`), y arrancarlo en `backend/src/index.js` (no en `crearApp`), hasta pasar T047–T051

### Mobile

- [X] T057 [P] [US3] Tests `mobile/__tests__/comprador/comprar.test.js` (selector de cantidad limitado por `maxEntradasPorCompra` y cupo, diálogo de aviso cuando `avisoNoCancelable`, crea la compra y navega) y `mobile/__tests__/comprador/pago.test.js` (lista de medios, rechazo muestra el mensaje y permite reintentar, aprobado muestra CONFIRMADA)
- [X] T058 [US3] Crear `mobile/src/api/compras.js`, `mobile/src/hooks/useCompras.js` (mutaciones que invalidan las listas) y `mobile/src/components/SelectorCantidad.js`
- [X] T059 [US3] Extender `mobile/src/app/evento/[id].js` con la compra (selección de tipo y cantidad, aviso previo si `avisoNoCancelable`) y crear `mobile/src/app/compra/[id].js` con el pago (medios de pago, reintento tras rechazo, cuenta regresiva hasta `expiraEn`), hasta pasar T057

**Checkpoint**: se puede comprar y pagar; la concurrencia está probada. Commit de hito.

---

## Phase 6: User Story 4 — El comprador ve sus compras (Priority: P1)

**Goal**: lista de "Mis compras" con estado claro y días restantes en las CONFIRMADAS.

**Independent Test**: con compras en distintos estados, abrir "Mis compras" y verificar estado, días restantes ("hoy" si es hoy), "Evento realizado" y que solo se ven las propias.

### Tests (escribir primero; deben fallar)

- [X] T060 [P] [US4] Test unitario `backend/test/unit/compra.seguimiento.test.js`: `diasParaEvento` (solo CONFIRMADA con evento futuro; 0 = hoy; 20) y `eventoRealizado`
- [X] T061 [P] [US4] Test de integración `backend/test/integration/compras.listar.test.js`: `GET /compras` solo propias y más recientes primero, `GET /compras/:id` con historial, compra ajena → 403, organizador en `GET /compras` → 403, un `compraId` que no es UUID → 400, contra el contrato
- [X] T062 [P] [US4] Test `mobile/__tests__/comprador/misCompras.test.js`: estado diferenciado, días restantes solo en CONFIRMADAS, "hoy", "Evento realizado" y estado vacío

### Implementación

- [X] T063 [US4] Extender `backend/src/domain/compra.js` (`diasParaEvento`, `eventoRealizado`) y `backend/src/services/compras.service.js` (`listarMias`, `detalle` con verificación de participante) y las rutas `GET /compras` y `GET /compras/:compraId`, hasta pasar T060 y T061
- [X] T064 [US4] Crear `mobile/src/components/TarjetaCompra.js` y `mobile/src/app/(comprador)/mis-compras.js` (y su tab), y mostrar estado y días en `mobile/src/app/compra/[id].js`, hasta pasar T062
- [X] T065 [US4] Test E2E `backend/test/e2e/p1.comprar-pagar.e2e.test.js` con el servidor real: organizador crea evento → comprador busca → compra → pago rechazado → pago aprobado → "Mis compras" muestra CONFIRMADA con días restantes

**Checkpoint (MVP)**: las 4 historias P1 completas = el flujo comprar → pagar demostrable. Commit de hito.

---

## Phase 7: User Story 5 — El comprador cancela y obtiene reembolso (Priority: P2)

**Goal**: cancelar PENDIENTE (→ CANCELADA) o CONFIRMADA (→ REEMBOLSADA) hasta 30 minutos antes del evento, liberando el cupo.

**Independent Test**: confirmar una compra de un evento de mañana, cancelarla (REEMBOLSADA, cupo liberado, historial registrado); intentar con el evento de ~20 minutos y verlo rechazado.

### Tests (escribir primero; deben fallar)

- [ ] T066 [P] [US5] Test unitario `backend/test/unit/cancelacion.test.js`: límite exacto (31 min → permitido; 30 min exactos y 20 min → rechazado), estados permitidos y finales
- [ ] T067 [P] [US5] Test de integración `backend/test/integration/compras.cancelar.test.js`: escenarios 1–6 de la story 5 con reloj de prueba, el cupo vuelve a estar disponible, el historial registra quién y cuándo, compra ajena → 403
- [ ] T068 [P] [US5] Test `mobile/__tests__/comprador/cancelar.test.js`: el botón aparece solo con `acciones.puedeCancelar`, diálogo de confirmación, muestra REEMBOLSADA, muestra el mensaje ante un 409

### Implementación

- [ ] T069 [US5] Extender `backend/src/domain/compra.js` (`puedeCancelar`, transición por tipo de estado, `LIMITE_CANCELACION_MIN`), `backend/src/services/compras.service.js` (`cancelar`, liberación de cupo en el repositorio) y la ruta `POST /compras/:compraId/cancelacion`, hasta pasar T066 y T067
- [ ] T070 [US5] Crear `mobile/src/components/Historial.js` (estados con quién y cuándo) y agregar la cancelación con diálogo a `mobile/src/app/compra/[id].js`, hasta pasar T068

**Checkpoint**: US5 funcional. Commit de hito.

---

## Phase 8: User Story 6 — Entradas utilizadas, a mano o automáticamente (Priority: P2)

**Goal**: el organizador marca CONFIRMADA → UTILIZADA desde 30 minutos antes del evento; el sistema lo hace solo 24 horas después del inicio.

**Independent Test**: con una compra CONFIRMADA de un evento de ~20 minutos, marcarla como utilizada; probar el rechazo con el evento de mañana; avanzar el reloj 24 h y ver el pasaje automático con `quien = SISTEMA`.

### Tests (escribir primero; deben fallar)

- [ ] T071 [P] [US6] Test unitario `backend/test/unit/utilizacion.test.js` y ampliación de `backend/test/unit/ciclo.expiracion.test.js`: habilitación a los 30 min exactos antes, rechazo antes y en estados distintos de CONFIRMADA, y auto-UTILIZADA a las 24 h exactas del inicio sin afectar PENDIENTES
- [ ] T072 [P] [US6] Test de integración `backend/test/integration/compras.uso.test.js`: escenarios 1–4 y 6 de la story 6, evento de otro organizador → 403, y el cambio automático registrado como sistema
- [ ] T073 [P] [US6] Test `mobile/__tests__/organizador/marcarUtilizada.test.js`: el botón aparece solo con `acciones.puedeMarcarUtilizada` y refresca el estado

### Implementación

- [ ] T074 [US6] Extender `backend/src/domain/compra.js` (`puedeMarcarUtilizada`, `autoUtilizable`), `backend/src/services/compras.service.js` (`marcarUtilizada`), la ruta `POST /compras/:compraId/uso` y `backend/src/jobs/ciclo.job.js` (paso de auto-UTILIZADA), hasta pasar T071 y T072
- [ ] T075 [US6] Agregar la acción del organizador a `mobile/src/app/compra/[id].js` (detalle visible también para el organizador del evento), hasta pasar T073; en el celular se llega desde la pantalla de T080 (US7)

**Checkpoint**: US6 funcional. Commit de hito.

---

## Phase 9: User Story 7 — El organizador ve las compras de su evento (Priority: P2)

**Goal**: el organizador ve las compras de un evento con estado diferenciado y las entradas disponibles por tipo.

**Independent Test**: tras varias compras en distintos estados, abrir el evento como organizador y verificar la lista y el cupo disponible por tipo; un organizador ajeno es rechazado.

### Tests (escribir primero; deben fallar)

- [ ] T076 [P] [US7] Test de integración `backend/test/integration/eventos.compras.test.js`: lista de compras con estado, disponibilidad por tipo (PENDIENTE, CONFIRMADA y UTILIZADA restan; CANCELADA y REEMBOLSADA no), evento de otro organizador → 403, comprador → 403, contra el contrato
- [ ] T077 [P] [US7] Test `mobile/__tests__/organizador/eventoCompras.test.js`: compras con chips de estado y resumen de cupos por tipo

### Implementación

- [ ] T078 [US7] Extender `backend/src/services/eventos.service.js` (`comprasDeEvento` con verificación de dueño) y agregar `GET /eventos/:eventoId/compras` a `backend/src/routes/eventos.routes.js` y el controller, hasta pasar T076
- [ ] T079 [P] [US7] Crear `mobile/src/components/ResumenCupos.js` y `mobile/src/hooks/useComprasDeEvento.js`
- [ ] T080 [US7] Crear `mobile/src/app/evento/[id]/compras.js` y enlazarla desde `mobile/src/app/(organizador)/mis-eventos.js`, hasta pasar T077

**Checkpoint**: US7 funcional. Commit de hito (cierra las historias P2).

---

## Phase 10: User Story 8 — Chat por compra (Priority: P3)

**Goal**: comprador y organizador del evento conversan dentro de la compra, en cualquier estado, con actualización periódica.

**Independent Test**: el comprador envía un mensaje; el organizador lo ve y responde; el comprador ve la respuesta sin refrescar en menos de 10 s; un tercero es rechazado.

### Tests (escribir primero; deben fallar)

- [ ] T081 [P] [US8] Test de integración `backend/test/integration/mensajes.test.js`: envío por ambos participantes en cualquier estado de la compra, orden cronológico, filtro `desde`, mensaje vacío o solo espacios → 400, más de 500 caracteres → 400, usuario ajeno → 403 en lectura y escritura, contra el contrato
- [ ] T082 [P] [US8] Test `mobile/__tests__/chat.test.js`: consulta periódica cada 3 s con temporizadores falsos, envío, mensaje vacío rechazado y los propios a la derecha

### Implementación

- [ ] T083 [P] [US8] Crear `backend/src/schemas/mensaje.schema.js` (Zod para `NuevoMensaje`; data-model.md · `Mensaje.texto` y `Mensaje.autorId`)
- [ ] T084 [US8] Crear `backend/src/services/mensajes.service.js`, `backend/src/controllers/mensajes.controller.js` y las rutas `GET` y `POST /compras/:compraId/mensajes` en `backend/src/routes/compras.routes.js`, hasta pasar T081
- [ ] T085 [US8] Crear `mobile/src/hooks/useMensajes.js` (`refetchInterval` de 3 s solo con la pantalla enfocada) y `mobile/src/components/Chat.js`, e integrarlo en `mobile/src/app/compra/[id].js` para ambos roles, hasta pasar T082

**Checkpoint**: US8 funcional. Commit de hito.

---

## Phase 11: User Story 9 — Reseñas y reputación del organizador (Priority: P3)

**Goal**: reseñar una compra UTILIZADA (1–5 y comentario); el puntaje del organizador es el promedio y se ve en el detalle de sus eventos.

**Independent Test**: reseñar una compra UTILIZADA, verla en el detalle del evento, ver que el promedio se actualiza y que una segunda reseña es rechazada.

### Tests (escribir primero; deben fallar)

- [ ] T086 [P] [US9] Test de integración `backend/test/integration/resenias.test.js`: escenarios 1–7 de la story 9 (compra no utilizada, duplicada, puntaje fuera de rango o no entero, compra ajena), promedio 5 y 3 → 4, las reseñas aparecen en el detalle del evento y el orden por puntaje cambia, contra el contrato
- [ ] T087 [P] [US9] Test `mobile/__tests__/comprador/resenia.test.js`: formulario de 1 a 5 con comentario solo con `acciones.puedeResenar`, desaparece tras enviar y la reseña se ve en el detalle del evento

### Implementación

- [ ] T088 [P] [US9] Crear `backend/src/schemas/resenia.schema.js` (Zod para `NuevaResenia`; data-model.md · `Resenia.puntaje`, `Resenia.comentario` y `Resenia.compraId`)
- [ ] T089 [US9] Crear `backend/src/services/resenias.service.js`, el almacenamiento de reseñas en el repositorio, la ruta `POST /compras/:compraId/resenia`, `acciones.puedeResenar` en `backend/src/domain/compra.js` y la inclusión de `organizador.resenias` y `puntaje` en `eventos.service.js`, hasta pasar T086
- [ ] T090 [P] [US9] Crear `mobile/src/components/FormularioResenia.js` y `mobile/src/components/ListaResenias.js`
- [ ] T091 [US9] Integrar el formulario en `mobile/src/app/compra/[id].js` y la lista en `mobile/src/app/evento/[id].js`, hasta pasar T087

**Checkpoint**: US9 funcional. Commit de hito.

---

## Phase 12: User Story 10 — Favoritos (Priority: P3)

**Goal**: marcar y desmarcar eventos favoritos y consultarlos.

**Independent Test**: marcar dos eventos, abrir "Favoritos", desmarcar uno y ver la lista actualizada sin duplicados.

### Tests (escribir primero; deben fallar)

- [ ] T092 [P] [US10] Test de integración `backend/test/integration/favoritos.test.js`: `PUT` idempotente sin duplicados, `DELETE`, `GET /favoritos`, aislamiento entre compradores, organizador → 403, evento inexistente → 404, y `esFavorito` en listado y detalle, contra el contrato
- [ ] T093 [P] [US10] Test `mobile/__tests__/comprador/favoritos.test.js`: el corazón alterna el estado y la pantalla "Favoritos" refleja los cambios

### Implementación

- [ ] T094 [US10] Implementar favoritos en `backend/src/repository/usuarios.repository.js` (data-model.md · `Usuario.favoritos` como conjunto sin duplicados), `backend/src/services/favoritos.service.js`, `backend/src/controllers/favoritos.controller.js` y `backend/src/routes/favoritos.routes.js` (`GET /favoritos`, `PUT` y `DELETE /favoritos/:eventoId`), y completar `esFavorito` en `eventos.service.js`, hasta pasar T092
- [ ] T095 [P] [US10] Crear `mobile/src/components/BotonFavorito.js` y `mobile/src/app/(comprador)/favoritos.js` (y su tab)
- [ ] T096 [US10] Integrar `BotonFavorito` en `mobile/src/components/TarjetaEvento.js` y `mobile/src/app/evento/[id].js`, hasta pasar T093

**Checkpoint**: las 10 historias completas. Commit de hito.

---

## Phase 13: Polish y transversales

**Propósito**: datos de demostración, flujo del video, documentación y calidad.

- [ ] T097 [P] Test de integración `backend/test/integration/seed.test.js` (debe fallar): el seed completo cumple FR-029 — ≥ 2 organizadores y 3 compradores; eventos en ~20 min, mañana y +20 días; eventos pasados con compras UTILIZADAS y reseñas; puntajes distintos entre organizadores; compras CONFIRMADAS sobre el evento de ~20 min
- [ ] T098 Ampliar `backend/src/seed/seed.js` con los eventos, compras, reseñas y favoritos de demostración con fechas relativas a "ahora" (cuidando que las reglas de data-model.md · `Evento.fecha` solo apliquen a la creación, no al seed), hasta pasar T097
- [ ] T099 [P] Test de cobertura del contrato `backend/test/integration/cobertura-contrato.test.js`: toda operación de `openapi.yaml` tiene una ruta implementada (ninguna responde 404 de ruta inexistente)
- [ ] T100 Test E2E `backend/test/e2e/flujo-demo.e2e.test.js` con el servidor real: comprar → pagar (rechazo y reintento) → chat entre ambos roles → cancelar; y variante comprar → pagar → utilizar → reseñar; incluye la prueba de 50 solicitudes simultáneas sobre HTTP real
- [ ] T101 [P] Crear `README.md` en la raíz (repo público): qué es el proyecto, stack, cómo correrlo (enlazando [quickstart.md](quickstart.md)), usuarios del seed y estructura
- [ ] T102 [P] Actualizar `.claude/CLAUDE.md` con comandos, arquitectura en capas, enlace a la constitution y reglas de commit (una línea, sin `Co-Authored-By`, por hito)
- [ ] T103 Pasada de calidad: `npm run lint` y `npm run format` en ambos paquetes sin errores, y `npm test` + `npm run test:e2e` en verde
- [ ] T104 **(manual)** Recorrer los 12 escenarios de [quickstart.md](quickstart.md) §5 en el celular y corregir lo que falle
- [ ] T105 Cerrar `docs/ai-log.md` (las decisiones ya se registraron en cada checkpoint) con la sección de reflexión sobre IA (ventajas, desventajas, dificultades, aprendizajes) para la conclusión del video; el guion del video queda en `.local/guion-video.md` (no se sube al repo)

---

## Dependencias y orden de ejecución

### Dependencias entre fases

- **Setup (Fase 1)** → **Foundational (Fase 2)** → todas las historias → **Polish (Fase 13)**.
- T003 (celular) y T004–T005 (mobile) son independientes del backend y pueden ir en paralelo con T002.
- **Backend y tests no dependen del celular**: T003 y T028 solo son necesarios para ver las pantallas mobile y para el video; se pueden hacer después de terminar el backend. T029 es una acción del autor posterior a la Fase 2 de backend.

### Dependencias entre historias

- **US1** (crear evento) es base de todas las demás (hacen falta eventos).
- **US2** depende de US1. **US3** depende de US1 (y se prueba mejor con US2). **US4** depende de US3.
- **US5** depende de US3/US4. **US6** depende de US3; su pantalla en el celular se alcanza desde US7.
- **US7** depende de US3. **US8** depende de US3 (necesita compras). **US9** depende de US6 (compra UTILIZADA).
- **US10** depende de US2 (necesita el catálogo).
- Los archivos `mobile/src/app/compra/[id].js` y `mobile/src/app/evento/[id].js` se editan en varias historias: hacerlo en orden.

### Dentro de cada historia

1. Tests (Red) → 2. dominio y esquemas → 3. repositorio → 4. servicio → 5. controller/ruta → 6. pantallas → tests en verde (Green).
2. Cualquier cambio a la API se hace primero en `contracts/openapi.yaml`.

### Oportunidades de paralelismo

- **Backend y mobile en paralelo**: una vez terminada la Fase 2, cada historia tiene un carril de backend y uno de mobile en worktrees distintos (el contrato está congelado).
- Todos los tests de una historia marcados [P] se escriben en paralelo.
- Historias sin dependencia directa: US7 y US8 en paralelo tras US3; US10 en paralelo con US5/US6.

#### Ejemplo: Historia 3

```bash
# Tests en paralelo (archivos distintos):
Tarea: "T047 compra.domain.test.js"      Tarea: "T048 reserva.atomica.test.js"
Tarea: "T049 compras.crear.test.js"      Tarea: "T050 compras.pagar.test.js"
Tarea: "T051 ciclo.expiracion.test.js"

# Carriles en paralelo tras los tests:
Carril backend: T052 → T053 → T054 → T055 → T056
Carril mobile:  T057 → T058 → T059   (usa el backend real con el seed base o Prism sobre openapi.yaml)
```

---

## Estrategia de implementación

### MVP primero (historias P1: US1–US4)

1. Fase 1 y Fase 2 completas (con la verificación en el celular, T028).
2. US1 → US2 → US3 → US4; el checkpoint de US4 es el MVP: flujo comprar → pagar demostrable.
3. **Parar y validar** con el E2E T065 y el recorrido manual antes de seguir.

### Entrega incremental

1. P1 (MVP) → commit de hito.
2. Agregar US5, US7 y US6 (P2) → cada una probada y commiteada.
3. Agregar US8, US9 y US10 (P3).
4. Polish: seed completo, E2E del flujo del video, documentación.

### Notas

- **Commits**: uno por fase o historia completada (una línea, sin `Co-Authored-By`, autoría del autor); el hook `post-commit` actualiza CodeGraph.
- **Registro de IA (constitution VI)**: en cada checkpoint, antes del commit, agregar a `docs/ai-log.md` las decisiones tomadas y las observaciones sobre el uso de IA de esa fase (aciertos, errores detectados, correcciones). No se acumula para el final.
- Verificar que los tests fallen antes de implementar; no se da por terminada una tarea con tests en rojo.
- Evitar tareas vagas, conflictos de archivo entre tareas [P] y dependencias entre historias que rompan su independencia.
- Opcional si sobra tiempo: skills propias del proyecto con skill-creator (`ticketit-domain-rules`, `ticketit-api-conventions`, `ticketit-ui-conventions`) y pruebas de interfaz con Maestro.
