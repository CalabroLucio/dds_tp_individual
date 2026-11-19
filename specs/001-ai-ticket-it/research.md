# Research — AI Ticket It

Fase 0 del plan. Cada decisión indica qué se eligió, por qué y qué alternativas se descartaron. Las versiones
exactas se fijan al instalar (`npm view <paquete> version`); aquí se fijan las versiones mayores.

## Verificado contra documentación (Context7 / docs de Expo, 2026-11-19)

- El SDK de Expo más reciente es el **58**. Durante su transición, `create-expo-app@latest` sin `--template`
  genera un proyecto **SDK 57**, y Expo Go del store soporta **un solo SDK** (el último que haya publicado).
- En Android se puede instalar el Expo Go de un SDK específico con la CLI `expo-go`
  (`npx expo-go download android 57`) o desde `expo.dev/go`. En iPhone no es posible.
- `expo-router` ofrece rutas protegidas con `Stack.Protected guard={...}`. La opción `redirectTo` es del SDK 58;
  en SDK 57 se usa solo `guard`.
- Un tunnel de Metro (`--tunnel`) es más lento que LAN y no expone el backend.

## Decisiones

### R1. Expo SDK 57 + Expo Go instalado a mano en Android
- **Decisión**: proyecto mobile en SDK 57; Expo Go para SDK 57 instalado en el celular con
  `npx expo-go download android 57` (o desde `expo.dev/go`).
- **Por qué**: el usuario es Android y no tiene Expo Go instalado, así que se puede elegir el SDK. El 57 es la
  plantilla por defecto de `create-expo-app@latest` y el ecosistema (Paper, jest-expo, Testing Library) está
  asentado. Fijar la versión evita que una actualización del store rompa la demo.
- **Alternativas**: SDK 58 (más nuevo, menos probado con el resto de librerías); Expo Go del store sin fijar
  (puede quedar en otro SDK que el proyecto).
- **Verificar en la primera tarea mobile**: que la plantilla genere SDK 57 y que Expo Go abra el proyecto.

### R2. JavaScript en el front con expo-router
- **Decisión**: JavaScript ESM (constitution I). Se parte de `create-expo-app` y se convierte a JS
  (renombrar a `.js`/`.jsx`, quitar `tsconfig.json` y dependencias de tipos). Navegación con **expo-router**.
  Rutas protegidas por rol con `Stack.Protected guard`.
- **Por qué**: continuidad con el resto del proyecto y simplicidad. expo-router es el estándar actual de Expo.
- **Alternativas**: React Navigation manual (más código); TypeScript (descartado en el log por continuidad y
  porque Zod ya valida en los bordes).
- **Riesgo**: la plantilla por defecto es TypeScript; si la conversión da problemas, usar `--template blank` y
  agregar expo-router a mano.

### R3. UI con React Native Paper
- **Decisión**: React Native Paper (Material Design, gratuita) con tema propio de la marca (verde de AI Ticket It).
- **Por qué**: botones, cards, chips, listas, diálogos y campos ya pulidos con poco código; resultado prolijo
  para el video. Decisión confirmada por el usuario.
- **Alternativas**: StyleSheet puro (más control, mucho más código); NativeWind/Tamagui (más configuración).

### R4. Estado del servidor con TanStack Query v5 y polling para el chat
- **Decisión**: TanStack Query para todo acceso a la API; chat con `refetchInterval` de 3 s mientras la pantalla
  está enfocada (cumple SC-006, <10 s). Mutaciones invalidan las listas afectadas.
- **Por qué**: caché, reintentos y estados de carga/error resueltos; el polling es trivial.
- **Alternativas**: WebSockets/SSE (más complejidad, innecesario según el log); Redux (más boilerplate).

### R5. Sesión del front
- **Decisión**: token JWT guardado en `expo-secure-store`, leído al iniciar; un `SessionProvider` expone
  `{ usuario, token, login, logout }`. El cliente HTTP agrega `Authorization: Bearer`. Ante un 401 se cierra la
  sesión y se vuelve al login.
- **Por qué**: funciona en Expo Go y es la práctica recomendada para tokens.
- **Alternativas**: AsyncStorage (sin cifrado).

### R6. Red entre celular, Metro y backend (WSL2)
- **Decisión**: WSL en **modo mirrored** (`networkingMode=mirrored` en `.wslconfig`, luego `wsl --shutdown`); el
  backend escucha en `0.0.0.0:3000`; la app usa `EXPO_PUBLIC_API_URL=http://<IP-LAN-de-la-PC>:3000`; Metro por LAN.
- **Por qué**: hoy WSL está en modo NAT (IP 172.22.x) y el celular no la alcanza. Mirrored comparte la IP de
  Windows (la versión de Windows del usuario lo soporta) y evita proxies que se rompen al cambiar la IP.
- **Alternativas**: `netsh interface portproxy` por puerto (se repite al reiniciar); túnel público para el backend
  (agrega un servicio externo).
- **Verificar en la primera tarea mobile**: puede hacer falta abrir los puertos 3000 y 8081 en el firewall de
  Windows (incluido el firewall de Hyper-V para tráfico entrante a WSL). Pasos en `quickstart.md`.

### R7. Contrato OpenAPI 3.1 escrito a mano, validado en tests
- **Decisión**: `contracts/openapi.yaml` es la fuente de verdad (constitution IV), escrito a mano. El backend lo
  sirve en Swagger UI (`swagger-ui-express`) y los tests de contrato validan cada respuesta contra los schemas
  con **Ajv (dialecto 2020-12)** y **@apidevtools/swagger-parser** (para resolver `$ref`), mediante un helper propio
  `validarRespuesta(ruta, metodo, status, cuerpo)`.
- **Por qué**: contract-first real; el helper son ~40 líneas y no depende de un paquete poco mantenido.
- **Alternativas**: generar el contrato desde Zod (invierte la dirección: el código dicta el contrato);
  `jest-openapi` (dependencia extra con soporte incierto); Prism como mock (se deja como opción para desarrollar
  mobile en paralelo sin backend).

### R8. Autenticación
- **Decisión**: login con email + contraseña; JWT HS256 con expiración de **8 h** (resuelve la duración de sesión
  que quedó para el plan); `bcryptjs` (costo 10; 4 en tests por velocidad); secreto desde `JWT_SECRET` con valor
  por defecto solo para desarrollo (constitution, flujo). Middleware `autenticar` y `requerirRol(rol)`.
- **Alternativas**: sesiones con cookie (no encajan en React Native), OAuth (fuera de alcance).

### R9. Reserva atómica de cupo
- **Decisión**: el repositorio en memoria expone `crearCompraReservandoCupo(datos)`, una función **síncrona** que
  chequea disponibilidad, descuenta y guarda la compra sin `await` intermedio (constitution III). El servicio
  valida todo lo demás antes y llama a esta función una sola vez. Test de concurrencia: 50 solicitudes
  simultáneas (`Promise.all` de peticiones HTTP) sobre cupo 10 → 10 × 201 y 40 × 409.
- **Por qué**: Node ejecuta un solo hilo; una sección sin `await` no puede intercalarse. Es más simple que
  recontar antes y después, y no necesita rollback. En una base real sería un `UPDATE` condicional o una
  transacción.
- **Cómo se evita el falso positivo del test**: además del test E2E, un test unitario inyecta un repositorio que
  cede el control entre el chequeo y el descuento y verifica que la implementación real no lo hace.

### R10. Reloj inyectable
- **Decisión**: todo el dominio recibe `ahora` (Date) como parámetro; la aplicación obtiene el reloj de
  `utils/reloj.js` (reemplazable en tests). No se usa `Date.now()` dentro del dominio.
- **Por qué**: cutoff (30 min), expiración (15 min) y auto-UTILIZADA (24 h) se testean de forma determinista, sin
  esperar ni usar timers falsos globales.

### R11. Job periódico único
- **Decisión**: un job con `setInterval` (cada 30 s, configurable) ejecuta `ejecutarCiclo(ahora)`:
  (1) pasa a CANCELADA las compras PENDIENTES con más de 15 min, liberando cupo; (2) pasa a UTILIZADA las
  CONFIRMADAS cuyo evento empezó hace 24 h o más. Ambos cambios se registran con `quien = SISTEMA`.
  El job se inicia solo en `index.js`, no en `crearApp()`, para que los tests invoquen `ejecutarCiclo` a mano.
- **Por qué**: patrón conocido (`CierreAutomatico.job.js` de tp_desarrollo); 30 s cumple SC-007 (<1 min extra).
- **Nota**: la validación del cutoff de cancelación NO usa el job (FR-021).

### R12. Búsqueda de texto
- **Decisión**: normalización (minúsculas, sin tildes con `String.normalize('NFD')`) y coincidencia por
  "contiene" sobre nombre, descripción y nombre de categoría. Sin librería externa.
- **Alternativas**: motores de búsqueda (innecesarios para decenas de eventos).

### R13. Fechas y "días para el evento"
- **Decisión**: la API usa ISO 8601 en UTC. Los días se calculan en días calendario según la zona horaria del
  servidor, fijada por defecto en `America/Argentina/Buenos_Aires` (variable `TZ`), así los tests no dependen
  de la máquina. 0 días → "hoy".
- **Alternativas**: librerías de fechas (innecesarias para esta cuenta).

### R14. Modelo de errores y códigos HTTP
- **Decisión**: respuesta de error uniforme `{ "error": { "codigo", "mensaje", "detalles?" } }`.
  400 validación; 401 sin sesión/credenciales; 402 pago rechazado; 403 rol o pertenencia; 404 no existe;
  409 conflicto de negocio (sin cupo, estado inválido, fuera de plazo, ya reseñada).
- **Por qué**: el front puede mostrar `mensaje` tal cual (constitution III: el front no decide) y los tests
  verifican `codigo`.

### R15. Front “tonto”: el backend calcula lo que se puede hacer
- **Decisión**: las compras incluyen `acciones { puedePagar, puedeCancelar, puedeMarcarUtilizada, puedeResenar }`,
  `diasParaEvento` y `eventoRealizado`; el detalle de evento incluye `avisoNoCancelable`, `compraAbierta` y
  `maxEntradasPorCompra`. El front solo muestra o esconde botones según esos campos.
- **Por qué**: evita duplicar reglas en mobile (constitution III) y simplifica los tests de componentes.

### R16. Estrategia de pruebas
- **Backend**: Jest 30 en ESM (`node --experimental-vm-modules`). Niveles: `unit` (dominio), `integration`
  (supertest sobre `crearApp()`), `contract` (respuestas vs. OpenAPI, dentro de integración), `e2e` (servidor
  real en puerto efímero con `fetch`, viajes completos).
- **Mobile**: `jest-expo` + `@testing-library/react-native` v13: pantallas con el cliente API mockeado.
- **Orden**: test-first (constitution II). Los E2E cubren el flujo comprar → pagar → chat → cancelar/reseñar.

### R17. Estructura del repo
- **Decisión**: dos paquetes independientes (`backend/`, `mobile/`) sin `npm workspaces`; el `package.json` raíz
  solo orquesta scripts (`concurrently`). El contrato vive en `specs/001-ai-ticket-it/contracts/`.
- **Por qué**: Expo/Metro con dependencias hoisteadas puede requerir configuración extra; dos paquetes aislados son
  más simples de explicar y de paralelizar con worktrees.

### R18. Lenguaje de dominio
- **Decisión**: nombres de dominio, rutas y campos JSON en español (como el diagrama de la consigna): `eventos`,
  `compras`, `tiposEntrada`, `cupoDisponible`. Identificadores técnicos y comentarios, en español; la interfaz,
  en español rioplatense. IDs con `crypto.randomUUID()`.

### R19. Otros
- **Medios de pago simulados** (`GET /medios-pago`): `TARJETA_VISA`, `TARJETA_MASTERCARD`, `DINERO_EN_CUENTA`
  (aprueban) y `TARJETA_RECHAZADA` (siempre falla). Resuelve la clarificación 1.
- **Imágenes**: `expo-image` para las URLs de multimedia.
- **Fecha al crear evento**: `@react-native-community/datetimepicker` (compatible con Expo Go).
- **Calidad**: ESLint + Prettier en ambos paquetes.
- **Trabajo en paralelo**: con el contrato congelado, backend y mobile pueden desarrollarse en worktrees
  distintos; mobile puede usar el backend real con el seed o Prism sobre `openapi.yaml`.
- **Reseñas del organizador en el detalle**: se devuelven embebidas (decenas de reseñas), sin paginación;
  paginar queda fuera de alcance.
- **Disponibilidad**: sin rate limiting ni paginación (fuera de alcance, datos en memoria y uso local).

## Pendientes de verificación durante la implementación (no bloquean el plan)

1. Que `create-expo-app` genere SDK 57 y se convierta bien a JavaScript (R1, R2).
2. Alcanzabilidad del backend desde el celular tras activar mirrored y reglas de firewall (R6).
3. Versiones finales de cada paquete al instalar.
