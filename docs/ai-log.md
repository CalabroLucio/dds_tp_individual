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
| Repo y `.local/` | `.local/` (consigna y material personal) en `.gitignore`. El PDF no pide entregar el repo, solo el video; el autor decidió que el repo sea **público** | Al ser público: no commitear secretos, y commitear con la identidad de la cuenta de la facultad (no la personal) |
| Identidad git | Remote por alias SSH `github.com-utn`; `user.name`/`user.email` locales del repo con la cuenta UTN | La config global es la cuenta personal; sin override local los commits salen con la identidad equivocada |

## Estado actual
- [x] Herramientas instaladas (Spec Kit, CodeGraph, Context7), repo git inicializado.
- [x] Reiniciar Claude Code para cargar MCPs/hook.
- [x] `/speckit-constitution` v1.0.0 ratificada (2026-11-19). Falta borrar el Sync Impact Report del comienzo antes de commitear.
- [x] Consigna guardada en `.local/consigna.md` (ignorada por git) y `.gitignore` creado.
- [ ] `/speckit-specify` → una sola spec con user stories P1/P2/P3 (los 12 casos de uso del PDF).
- [ ] `/speckit-clarify`, `/speckit-plan` (+ data-model, contracts OpenAPI), `/speckit-tasks`, `/speckit-analyze`.
- [ ] `/speckit-implement` con Opus.
- [ ] Skills propias, `CLAUDE.md` raíz, `codegraph init -i` tras el scaffold.

## Observaciones sobre IA (para la conclusión)
- La IA verificó datos externos (tags de Spec Kit, comandos de CodeGraph) antes de recomendarlos, y detectó que el MCP hosted de Expo es pago.
- Error propio detectado: una primera recomendación de TypeScript y Vitest fue corregida al revisar el TP anterior (JS + Jest). Lección: revisar el contexto real del proyecto antes de recomendar.
- El comando `claude mcp show` sugerido no existe (es `get`): contrastar siempre con la documentación.
