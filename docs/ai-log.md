# Bitácora de decisiones y uso de IA — AI Ticket It

Registro vivo para la conclusión del video (ventajas, desventajas, dificultades, aprendizajes).

## Contexto
- TP individual UTN.BA DDS, 2C 2026. Objetivo: nota máxima. Se valora criterio, justificación de decisiones y reflexión crítica sobre IA.
- Requisitos del PDF: Back-End Node + Express; Front-End React Native; ejecución local en dispositivo mobile; persistencia en memoria; sin herramientas pagas.
- Entrega: video de 5–10 min sobre UN flujo (back + front + recorrido en UI) + conclusión sobre el uso de IA.
- Plan de trabajo: SDD con Spec Kit, luego implementación "de una pasada" con Opus.
- Referencia de estilo/arquitectura: `../tp_desarrollo` (JS ESM, Express 5, capas controllers/services/repository/domain/schemas/middleware/errors, Jest + supertest, JWT + `rol`, job con setInterval, Swagger).

## Herramientas
- Spec Kit v1.4.3 (`specify init . --integration claude`): skills `speckit-*` en `.claude/skills/`.
- CodeGraph (colbymchenry): MCP + hook de prompt, solo este proyecto, telemetría deshabilitada. `codegraph init -i` pendiente hasta que exista código.
- Context7: MCP en scope local del proyecto (`claude mcp add context7 -- npx -y @upstash/context7-mcp`). Verificar con `claude mcp get context7`.
- Descartado: Expo MCP hosted (requiere plan EAS pago; el TP prohíbe herramientas pagas).
- Pendiente: skills propias con skill-creator (`ticketit-domain-rules`, `ticketit-api-conventions`, `ticketit-ui-conventions`), OBS (grabación), Bruno/Insomnia, Mermaid, Maestro (opcional).
- Entorno: WSL2, Node 24, Java 21, Python 3.12, git. Celular físico con Expo Go (usar `--tunnel` o `networkingMode=mirrored` en `.wslconfig`).

## Decisiones cerradas
| Tema | Decisión | Justificación |
|---|---|---|
| Lenguaje | JavaScript ESM (back y mobile) | Continuidad con tp_desarrollo; RN ya es tecnología nueva; Zod en los bordes |
| Front | Expo (React Native) + expo-router + TanStack Query | Evita Android SDK/Gradle/adb en WSL; sigue siendo RN; `expo prebuild` permite pasar a nativo. Justificar en el video. Opcional: consultar a la cátedra |
| Roles | `Usuario.rol = COMPRADOR \| ORGANIZADOR` fijo; login JWT + bcryptjs; middleware `requerirRol` | Patrón de tp_desarrollo; casos de uso del PDF hablan por rol. Desvío leve del diagrama "tentativo" |
| Seed | 2 organizadores, 3 compradores; fechas relativas a "ahora" (evento en ~20 min, mañana, en 20 días, pasados) | Demostrable en video |
| Compra | Un organizador no puede comprar su propio evento | Regla de negocio |
| Estados | PENDIENTE→CONFIRMADA (pago simulado); PENDIENTE→CANCELADA (cancela comprador o expira); CONFIRMADA→REEMBOLSADA (cancela comprador antes del cutoff); CONFIRMADA→UTILIZADA (organizador). Finales: UTILIZADA, CANCELADA, REEMBOLSADA | Cada cambio se registra en CambioEstadoCompra (quién, cuándo) |
| Pago | Simulado; si falla sigue PENDIENTE y se reintenta | |
| Cupo | Se descuenta al crear la compra, se libera en CANCELADA/REEMBOLSADA. Disponible = cupo − entradas de compras activas | |
| Concurrencia | Reserva de cupo en sección síncrona atómica del repositorio (sin `await` entre chequeo y descuento); el resto es `async`. Test: 50 compras simultáneas sobre cupo 10 → exactamente 10 OK, 40 → 409 | Node es mono-hilo; más simple que recuento previo/posterior de tp_desarrollo (que en el peor caso deshace ambas) y sin rollback. En DB real: UPDATE atómico/transacción |
| Cutoff de cancelación | 30 min antes del evento, validado al momento del pedido (no por cron) | Un cron deja una ventana de error; constante configurable |
| Expiración | Compras PENDIENTES a los 15 min por job (patrón `CierreAutomatico.job.js`), libera cupo | Evita cupo bloqueado por abandono/pago fallido |
| UTILIZADA | El organizador la marca desde el cutoff (30 min antes) en adelante | Simétrico con la cancelación; sin QR |
| Reseñas | Solo sobre compra UTILIZADA, una por compra, puntaje 1–5 + comentario. Puntaje del organizador = promedio de sus reseñas; se muestra en sus eventos y sirve para ordenar | |
| Chat | Solo comprador y organizador del evento, en cualquier estado; polling | Más simple y robusto que WebSockets |
| Eventos/búsqueda | Evento: ≥1 tipo de entrada, precio ≥ 0, cupo > 0, fecha futura. Búsqueda de texto: nombre, descripción, categoría. Orden: precio (mínimo de tipos), fecha, puntaje del organizador. Backend calcula `diasParaEvento` en confirmadas | |
| Tests | Jest en todo (jest-expo en mobile). Unit (dominio), integración (supertest), E2E de API con servidor levantado (viajes completos), tests de componentes con RN Testing Library. Maestro opcional si sobra tiempo | |
| Estructura | Monorepo: `backend/`, `mobile/`, `specs/`, `docs/` | |
| Flujo para el video | comprar → pagar → chat → cancelar/reseñar | Cubre back, front y estados |
| Ejecución con agentes | Backend y mobile paralelizables con subagentes y git worktrees una vez congelado el contrato OpenAPI | |
| Cutoff vs. consigna | Se mantiene el cutoff de 30 min (configurable) aunque la consigna dice "hasta que el evento se realice" | La consigna no define cómo ni cuándo una compra pasa a UTILIZADA. Atar ambas reglas al mismo instante evita solapamiento (cancelar y marcar utilizada a la vez). Desvío propio y justificado |
| Favoritos | El comprador guarda/quita eventos favoritos y los lista (`Usuario.favoritos`) | Figura en el contexto y el diagrama, aunque no en los 12 casos de uso. Decisión del autor: incluirlo (P3) |
| Elementos del diagrama | Se incluyen todos: `Categoria` como entidad (nombre, descripción), `Evento.multimedia` (URLs), filtro por rango de precio (`tuPrecioEstaEntre`), reseñas del organizador listadas en el detalle del evento, total de la compra | Decisión del autor: cubrir todo lo mencionado en la consigna |
| Puntaje de reseña | Entero de 1 a 5 (el diagrama dice `Double`) | Más simple para UI y promedio; el promedio del organizador sí es decimal |
| Pago simulado | El comprador elige un medio de pago simulado; "Tarjeta rechazada" siempre falla, los demás siempre aprueban | Determinista para tests y video; imita las "tarjetas de prueba" de pasarelas reales (clarify, 2026-11-19) |
| UTILIZADA automática | Manual por el organizador desde el cutoff, y automática 24 h después del inicio del evento (configurable) | Evita compras CONFIRMADA eternas y habilita reseñas. Propuesta del autor: no depender solo de un marcado manual. Limitación conocida: eventos cancelados o cortados a mitad no están modelados |
| Expo SDK y celular | SDK 57 con Expo Go instalado a mano en Android (`npx expo-go download android 57`) | Verificado en la doc de Expo: el SDK más nuevo es 58 pero la plantilla por defecto es 57 y Expo Go soporta un solo SDK. Fijar la versión evita sorpresas por actualizaciones del store |
| UI | React Native Paper (Material, gratis) con tema propio | Elegido por el autor: resultado prolijo con poco código de estilos |
| Red WSL | Modo mirrored en `.wslconfig` | WSL estaba en NAT (IP 172.22.x) y el celular no la alcanza. Elegido por el autor entre mirrored y port proxy |
| Contrato | OpenAPI 3.1 escrito a mano, validado en tests con Ajv + swagger-parser | Contract-first real; generarlo desde Zod invertiría la dirección. Helper propio de ~40 líneas en vez de una dependencia poco mantenida |
| Front "tonto" | La API devuelve `acciones`, `diasParaEvento`, `avisoNoCancelable`, etc. | Las reglas viven solo en el dominio (constitution III); mobile solo muestra |
| Sesión y errores | JWT 8 h; pago rechazado = 402; conflictos de negocio = 409; errores `{error:{codigo,mensaje,detalles}}` | Cierra la duración de sesión que quedó abierta en clarify |
| Repo y `.local/` | `.local/` (consigna y material personal) en `.gitignore`. El PDF no pide entregar el repo, solo el video; el autor decidió que el repo sea **público** | Al ser público: no commitear secretos, y commitear con la identidad de la cuenta de la facultad (no la personal) |
| Identidad git | Remote por alias SSH `github.com-utn`; `user.name`/`user.email` locales del repo con la cuenta UTN | La config global es la cuenta personal; sin override local los commits salen con la identidad equivocada |

## Estado actual
- [x] Herramientas instaladas (Spec Kit, CodeGraph, Context7), repo git inicializado.
- [x] Reiniciar Claude Code para cargar MCPs/hook.
- [x] `/speckit-constitution` v1.0.0 ratificada (2026-11-19). Falta borrar el Sync Impact Report del comienzo antes de commitear.
- [x] Consigna guardada en `.local/consigna.md` (ignorada por git) y `.gitignore` creado.
- [x] `/speckit-specify` (10 user stories P1/P2/P3) y `/speckit-clarify` (4 decisiones).
- [x] `/speckit-plan`: research, data-model, contracts/openapi.yaml y quickstart.
- [x] `/speckit-tasks`: 105 tareas en 13 fases (tests primero).
- [x] `/speckit-analyze`: 12 hallazgos (2 críticos de constitution, 1 alto, 3 medios, 6 bajos), todos corregidos en spec, data-model y tasks.
- [ ] `/speckit-implement` con Opus.
- [ ] Skills propias, `CLAUDE.md` raíz, `codegraph init -i` tras el scaffold.

## Implementación — registro por fase

### Fase 1 y 2 (setup y base) — 2026-11-19
- Verificado al instalar: `create-expo-app --template default@sdk-57` genera SDK 57 (riesgo R1 cerrado). La plantilla es TypeScript y se convirtió a JS sin problemas (R2 cerrado). `expo-doctor`: 21/21.
- Versiones reales: Express 5.3, Zod 4.6 (mensajes en español con `z.locales.es()`), Jest 30 en backend y 29 en mobile (lo fija jest-expo), React Native Testing Library **v14** (el plan decía v13): en v14 `render` y `fireEvent` son asíncronos y se usan con `await`. Se consultó la guía de migración antes de escribir tests.
- Desvío del plan: las pantallas por rol van en carpetas `comprador/` y `organizador/` en lugar de grupos `(comprador)`/`(organizador)`, porque con grupos ambas pantallas `perfil` tendrían la misma URL `/perfil` y expo-router las haría chocar.
- Contexto con inyección de dependencias (`crearContexto`): los tests arman la app con reloj y reglas propios, sin mocks globales.
- `validarRespuesta(ruta, metodo, respuesta)` recibe la respuesta de supertest entera (status + body) en vez de status y cuerpo por separado: menos ruido en cada test.
- Sin celular se verificó igual que la app compila completa con `expo export --platform android`.
- Tests: backend 27, mobile 25, todos en verde, lint limpio. Pendientes del autor: T003 y T028 (celular) y T029 (`codegraph init -i`, ya hay código).

### Historia 1 — publicar evento
- Backend: dominio de evento (precio desde, cupo disponible, compra abierta, aviso de no cancelable) y `presentacion.js`, que arma las respuestas del contrato usando el dominio (el front recibe todo calculado).
- Validación en dos niveles: Zod en el borde (formatos, rangos, nombres de tipo repetidos) y el servicio para lo que depende del estado (fecha futura según el reloj, categoría existente). Ambos devuelven `VALIDACION` con detalles por campo.
- Mobile: los botones de Paper con ícono incluyen el glifo de la fuente en su nombre accesible, por eso los tests buscan por regex (`/Publicar evento/`). Lo detectó un test fallando, no la IA de antemano.
- El linter de React (`set-state-in-effect`) obligó a cambiar un efecto por un valor derivado: buena práctica que la IA no había aplicado de primera.
- Tests: backend 49, mobile 28.

### Historia 2 — buscar, filtrar y ordenar
- `buscarEventos` es una función pura del dominio (recibe eventos, cómo resolver categoría y puntaje, y `ahora`), probada sin HTTP. Los organizadores sin reseñas quedan al final en cualquier dirección de orden.
- SC-005 medido en un test: búsqueda sobre seed + 50 eventos ordenada por puntaje, muy por debajo de 1 s.
- Mobile: los filtros se mandan al backend tal cual (con espera de 350 ms para no buscar por tecla); el front no filtra ni ordena. Query string armado a mano porque `URLSearchParams` tiene soporte parcial en React Native.
- `ListaResenias` se creó ya en esta historia porque el detalle del evento debe mostrar las reseñas (caso de uso 10); la Historia 9 la reutiliza.
- Tests: backend 67, mobile 35.

### Historia 3 — comprar y pagar
- Cupo derivado, no contador: el disponible se calcula de las compras activas, así que "liberar cupo" es solo cambiar el estado. No hay contador que pueda desincronizarse.
- Reserva atómica: `crearCompraReservandoCupo` es síncrona. Prueba de concurrencia real (50 solicitudes HTTP simultáneas sobre cupo 10 → 10 × 201 y 40 × 409) y una prueba de control con una versión "ingenua" con `await` entre chequeo y reserva, que vende de más: demuestra que el test detectaría el error.
- Organizador comprando: el rol se valida en el servicio para devolver `ORGANIZADOR_NO_PUEDE_COMPRAR` en su propio evento y `ROL_NO_PERMITIDO` en otros; con `requerirRol` en la ruta el mensaje específico nunca se vería.
- Pago con una PENDIENTE vencida antes de que corra el job: se cancela en ese momento y responde 409 (hallazgo U1 del análisis).
- `diasParaEvento` y `eventoRealizado` se implementaron ya en esta historia porque el contrato los exige en toda respuesta de compra; la Historia 4 los prueba.
- La pantalla de compra mobile usa `GET /compras/{id}`, que se implementa en la Historia 4 (siguiente); los tests de mobile lo simulan.
- Tests: backend 105, mobile 43.

### Historia 4 — mis compras (cierre del MVP P1)
- `GET /compras` (solo del comprador, más recientes primero) y `GET /compras/{id}` (comprador u organizador del evento, con historial). Las PENDIENTES vencidas se muestran CANCELADAS al leerlas aunque el job todavía no haya pasado.
- Desvío honesto de test-first: los tests unitarios de `seguimiento` (días para el evento) pasaron desde el primer momento porque esa lógica se adelantó en la Historia 3, cuando el contrato la exigía. Los de integración y mobile sí fallaron primero.
- E2E P1 con servidor real (fetch): publicar → buscar → comprar → pago rechazado → pago aprobado → cupo descontado → "Mis compras". Verde.
- **MVP completo**: las cuatro historias P1 funcionan de punta a punta. Tests: backend 118 + 1 E2E, mobile 46.

### Historia 5 — cancelar y reembolsar
- PENDIENTE → CANCELADA y CONFIRMADA → REEMBOLSADA solo si faltan **más** de 30 minutos (con 30 exactos ya no). El plazo se valida al momento del pedido (FR-021), sin job. El estado final se chequea antes que el plazo para dar el motivo correcto.
- Cancelar una PENDIENTE que ya venció la deja CANCELADA por el sistema y responde 200: el pedido del usuario se cumple igual.
- Mobile: diálogo de confirmación que explica si hay reembolso, e historial de estados con quién y cuándo (FR-017).
- Se automatizó la verificación (formato, lint, tests, bundle) en un script para repetirla igual en cada historia.
- Tests: backend 133, mobile 49.

### Historia 6 — utilizada, a mano o automática
- Manual: solo el organizador del evento, sobre una CONFIRMADA, desde 30 minutos antes (con 30 exactos ya se puede: no se superpone con la cancelación). Automática: el job pasa a UTILIZADA las CONFIRMADAS 24 h después del inicio, registradas como sistema.
- El job ahora devuelve `{ expiradas, utilizadas }` y el servidor lo loguea cuando hay cambios.
- Mobile: el organizador ve el nombre del comprador y el botón "Marcar como utilizada" solo si el backend lo habilita.
- Pendiente menor: Jest de mobile avisa que un worker "no terminó limpio" (temporizadores vivos, probablemente animaciones de Paper). No afecta resultados; `--detectOpenHandles` se cuelga y no dio información. Se agregó limpieza de los clientes de TanStack Query después de cada test.
- Tests: backend 142, mobile 51.

### Historia 7 — vista del organizador
- `GET /eventos/{id}/compras`: solo el organizador dueño; compras con estado y cupo disponible por tipo (PENDIENTE, CONFIRMADA y UTILIZADA restan; CANCELADA y REEMBOLSADA no).
- Un test falló por un error del propio test: al avanzar el reloj 100 minutos la PENDIENTE vencía, que es el comportamiento correcto. Se corrigió el test, no el código.
- Mobile: pantalla con barras de disponibilidad por tipo y la lista de compras por comprador; cada una abre el detalle (donde el organizador marca como utilizada y, desde la Historia 8, chatea).
- Cierra las historias P2. Tests: backend 146, mobile 52.

### Historia 8 — chat por compra
- Los mensajes viven en la compra (data-model.md · Compra.mensajes). Solo comprador y organizador del evento, en cualquier estado, incluso cancelada. `desde` trae solo los nuevos para el polling.
- Mobile: polling cada 3 s con TanStack Query (`refetchInterval`), sin WebSockets (decisión del log). El intervalo es un parámetro del componente para que el test lo baje a 50 ms y no dependa de temporizadores falsos. El mensaje enviado se agrega a la caché sin esperar al siguiente ciclo.
- Tests: backend 152, mobile 54.

### Historia 9 — reseñas y reputación
- Solo el comprador, con la compra UTILIZADA y una por compra; puntaje entero 1 a 5 y comentario. El promedio del organizador (5 y 3 → 4) se refleja en el detalle de todos sus eventos y en el orden por puntaje del catálogo.
- Mobile: estrellas tocables y comentario; tras enviar se muestra "Tu reseña" en lugar del formulario. `ListaResenias` (creada en la Historia 2) muestra las reseñas en el detalle del evento.
- Corrección de capas: el handler de reseñas había quedado dentro de la ruta; se movió a su controller (constitution I).
- Tests: backend 158, mobile 56.

## Observaciones sobre IA (para la conclusión)
- La IA verificó datos externos (tags de Spec Kit, comandos de CodeGraph) antes de recomendarlos, y detectó que el MCP hosted de Expo es pago.
- Error propio detectado: una primera recomendación de TypeScript y Vitest fue corregida al revisar el TP anterior (JS + Jest). Lección: revisar el contexto real del proyecto antes de recomendar.
- El comando `claude mcp show` sugerido no existe (es `get`): contrastar siempre con la documentación.
- `/speckit-analyze` encontró contradicciones que la IA introdujo al escribir los propios artefactos: el tope de 10 entradas figuraba como 400 en el modelo y como 409 en el contrato, y la constitution exigía validar params y registrar el log "en el momento", pero las tareas no lo reflejaban. Lección: un paso de verificación cruzada automática detecta inconsistencias que una sola pasada de generación no ve.
- Error de la IA: commiteó con `git add -A` un APK de 200 MB que estaba en la raíz del repo. Se detectó antes del push, se reescribió el commit local y se agregó `*.apk` al `.gitignore`. Lección: revisar qué entra en cada commit en vez de agregar todo a ciegas.
- Decisión de ritmo del autor: desarrollar primero backend y tests, y dejar la configuración del celular (Expo Go, red mirrored) para antes de las pantallas mobile.
