# AI Ticket It Constitution

## Core Principles

### I. Arquitectura por Capas en JavaScript ESM
Backend y mobile MUST escribirse en JavaScript ESM (sin TypeScript). El backend MUST organizarse en
las capas `controllers`, `services`, `repository`, `domain`, `schemas`, `middleware` y `errors`,
con dependencias en un solo sentido: controller → service → repository/domain. Los controllers
MUST limitarse a traducir HTTP; no contienen reglas de negocio ni acceden al repositorio. Toda
entrada externa (body, query, params; en mobile, respuestas de la API) MUST validarse con Zod en
el borde, y los errores MUST salir por la jerarquía de `errors` con códigos HTTP consistentes.
Rationale: continuidad con `tp_desarrollo`, capas fáciles de testear y de explicar en el video.

### II. Test-First con Jest (NON-NEGOTIABLE)
Toda funcionalidad MUST tener sus tests escritos antes de la implementación y verlos fallar
(Red-Green-Refactor). Jest es el único framework de tests, en cuatro niveles: unit del dominio,
integración con supertest, E2E de API con el servidor levantado (viajes completos de usuario) y
tests de componentes mobile con React Native Testing Library sobre jest-expo. Una tarea no se
considera terminada con tests en rojo. Cada regla de negocio y cada transición de estado MUST
tener al menos un test que la cubra, incluyendo los caminos de error.
Rationale: la nota depende del criterio y la justificación; los tests son la evidencia verificable.

### III. Reglas de Negocio Solo en el Dominio
Las reglas de negocio (estados de compra, cutoff de cancelación, expiración, reseñas, puntaje del
organizador, "un organizador no compra su propio evento") MUST vivir en `domain`/`services` y
MUST NOT duplicarse en controllers, repositorios ni en el front. El front muestra y consulta, no
decide. La reserva de cupo MUST ejecutarse en una sección síncrona atómica del repositorio: sin
`await` entre el chequeo de disponibilidad y el descuento, sin rollback. El test de concurrencia
(50 compras simultáneas sobre cupo 10 → exactamente 10 OK y 40 con 409) MUST mantenerse en verde.
Cada cambio de estado de una compra MUST registrarse en `CambioEstadoCompra` (quién y cuándo).
Rationale: Node es mono-hilo, por lo que la atomicidad síncrona es la solución más simple y
correcta; en una base real se reemplazaría por un UPDATE atómico o una transacción.

### IV. Contrato OpenAPI Primero
El contrato OpenAPI MUST definirse y congelarse antes de implementar backend y mobile en
paralelo. Backend y mobile MUST ajustarse al contrato; cualquier cambio al contrato MUST hacerse
primero en el documento, acompañarse de la actualización de los tests afectados y comunicarse a
ambos lados. Los tests de integración MUST verificar que las respuestas cumplen el contrato.
Rationale: es lo que permite paralelizar con subagentes y git worktrees sin divergencias.

### V. Restricciones del TP
El sistema MUST cumplir las condiciones de la consigna: Back-End en Node + Express, Front-End en
React Native (Expo con expo-router y TanStack Query), persistencia exclusivamente en memoria,
ejecución local en dispositivo mobile y cero herramientas o servicios pagos (incluidos MCPs,
hosting y planes de pago de Expo/EAS). Las dependencias nuevas MUST ser gratuitas y justificarse.
El alcance MUST priorizar un flujo completo y demostrable (comprar → pagar → chat →
cancelar/reseñar) por sobre la cantidad de funcionalidades.
Rationale: incumplir la consigna invalida la entrega; el flujo único es lo que se muestra en video.

### VI. Registro de Decisiones y Uso de IA
Toda decisión de diseño relevante, desvío de la consigna y observación sobre el uso de IA
(aciertos, errores detectados, correcciones, dificultades) MUST registrarse en `docs/ai-log.md`
en el momento en que ocurre. Los datos externos (versiones, comandos, APIs) MUST verificarse
contra documentación o el contexto real del proyecto antes de adoptarse. Las decisiones de este
registro MUST justificarse, no solo enunciarse.
Rationale: la conclusión del video evalúa ventajas, desventajas y reflexión crítica sobre la IA.

## Stack y Reglas de Dominio

- Monorepo: `backend/`, `mobile/`, `specs/`, `docs/`.
- Autenticación con JWT y bcryptjs; `Usuario.rol` es `COMPRADOR` u `ORGANIZADOR` y se protege con
  el middleware `requerirRol`.
- Estados de compra: PENDIENTE→CONFIRMADA (pago simulado), PENDIENTE→CANCELADA (comprador o
  expiración), CONFIRMADA→REEMBOLSADA (comprador antes del cutoff), CONFIRMADA→UTILIZADA
  (organizador desde el cutoff, o el sistema 24 h después del inicio del evento). Estados finales: UTILIZADA, CANCELADA y REEMBOLSADA; no admiten transiciones.
- El cutoff de cancelación (30 min antes del evento) se valida al momento del pedido, nunca por
  cron, y es una constante configurable. Las compras PENDIENTES expiran a los 15 minutos mediante
  un job con `setInterval` que libera el cupo.
- Chat entre comprador y organizador del evento mediante polling (sin WebSockets). Reseñas solo
  sobre compras UTILIZADA, una por compra, con puntaje 1–5.
- Los datos seed MUST usar fechas relativas a "ahora" para que el flujo sea demostrable.

## Flujo de Desarrollo y Calidad

- El trabajo sigue Spec-Driven Development con Spec Kit: constitution → specify → clarify → plan
  → tasks → analyze → implement. No se implementa código sin spec, plan y tasks aprobados.
- El contrato OpenAPI y el data-model se generan en la fase de plan, antes de las tasks de código.
- Antes de dar por cumplida una tarea, la suite Jest relevante MUST pasar y el cambio MUST
  reflejar el contrato vigente.
- Se prefiere la solución más simple que cumpla la consigna (YAGNI); toda complejidad extra MUST
  justificarse en el plan.
- Los secretos y configuraciones sensibles no se commitean; el JWT secret se lee del entorno con un
  valor por defecto solo para desarrollo local.

## Governance

Esta constitution prevalece sobre cualquier otra práctica del proyecto. Una enmienda MUST
documentarse (qué cambia y por qué), actualizar la versión y registrarse en `docs/ai-log.md`;
si afecta a specs, plans o tasks existentes, MUST incluir su revisión. El versionado es semántico:
MAJOR para eliminar o redefinir principios de forma incompatible, MINOR para agregar un principio
o ampliar guía de forma material, PATCH para aclaraciones y correcciones de redacción. Cada plan y
cada revisión de implementación MUST verificar el cumplimiento de los principios I–VI; las
violaciones MUST justificarse explícitamente o corregirse. Usar `docs/ai-log.md` como guía de
contexto y decisiones durante el desarrollo.

**Version**: 1.0.1 | **Ratified**: 2026-11-19 | **Last Amended**: 2026-11-19
