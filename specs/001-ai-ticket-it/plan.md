# Implementation Plan: AI Ticket It — Venta de entradas para eventos

**Branch**: `main` (directorio `001-ai-ticket-it`) | **Date**: 2026-11-19 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/001-ai-ticket-it/spec.md`

## Summary

Plataforma móvil con dos roles (Comprador y Organizador) para publicar eventos con tipos de entrada, buscar y
comprar, pagar con un pago simulado, seguir el estado de la compra, cancelar con reembolso, marcar entradas como
utilizadas (a mano o automáticamente), chatear por compra, reseñar y guardar favoritos.

Enfoque técnico: **backend Node + Express 5** en capas (controllers → services → repository/domain, con schemas Zod,
middleware y errores propios) y **persistencia en memoria**, con la reserva de cupo en una sección síncrona atómica;
**front React Native con Expo SDK 57** (expo-router, TanStack Query, React Native Paper) que corre en Expo Go sobre
un celular Android. Un **contrato OpenAPI 3.1** escrito a mano ([contracts/openapi.yaml](contracts/openapi.yaml))
es la fuente de verdad para ambos lados. El backend calcula las reglas y las acciones permitidas; el front solo
muestra.

## Technical Context

**Language/Version**: JavaScript ESM sobre Node 24 (backend) y React Native con Expo SDK 57 (mobile)

**Primary Dependencies**:
- Backend: Express 5, Zod, jsonwebtoken, bcryptjs, cors, swagger-ui-express, yaml
- Mobile: expo-router, @tanstack/react-query v5, react-native-paper, expo-secure-store, expo-image,
  @react-native-community/datetimepicker, Zod

**Storage**: en memoria (colecciones `Map` en el repositorio), cargadas por un seed al arrancar

**Testing**: Jest 30 en ambos lados. Backend: unit, integración (supertest), contrato (Ajv + swagger-parser) y E2E
(servidor real con `fetch`). Mobile: jest-expo + @testing-library/react-native v13

**Target Platform**: Android con Expo Go (SDK 57) en red local; backend en WSL2 (modo mirrored) accesible por LAN

**Project Type**: mobile-app + API (dos paquetes independientes: `backend/` y `mobile/`)

**Performance Goals**: búsquedas y ordenamientos < 1 s con el seed (SC-005); mensaje visible en < 10 s (SC-006,
polling de 3 s); liberación de cupo por expiración < 1 min tras los 15 min (SC-007, job cada 30 s)

**Constraints**: sin herramientas pagas; persistencia solo en memoria; reserva de cupo atómica; el dominio no usa
`Date.now()` (reloj inyectable); el front no duplica reglas de negocio

**Scale/Scope**: demo local, ≤ 10 usuarios, decenas de eventos y compras; 10 user stories, 29 requisitos
funcionales, 21 operaciones de API, ~10 pantallas por rol

## Constitution Check

*GATE: debe pasar antes de la Fase 0 y re-evaluarse tras el diseño de la Fase 1.*

| Principio | Estado | Evidencia en el plan |
|---|---|---|
| I. Capas en JavaScript ESM, Zod en los bordes | ✅ Pasa | Estructura por capas `controllers/services/repository/domain/schemas/middleware/errors`; Zod valida requests (backend) y respuestas (mobile); sin TypeScript (R2) |
| II. Test-first con Jest (NON-NEGOTIABLE) | ✅ Pasa | Cuatro niveles definidos (R16); el orden de tareas debe poner los tests antes de la implementación; E2E del flujo de la demo |
| III. Reglas solo en el dominio, cupo atómico | ✅ Pasa | `crearCompraReservandoCupo` síncrono (R9); el backend entrega `acciones`, `diasParaEvento` y avisos para que el front no decida (R15); historial `CambioEstadoCompra` en el modelo |
| IV. OpenAPI primero | ✅ Pasa | [contracts/openapi.yaml](contracts/openapi.yaml) creado y validado en esta fase; tests de contrato (R7) |
| V. Restricciones del TP | ✅ Pasa | Node + Express, React Native (Expo), memoria, local en Android, todo gratuito (Paper, Query, Expo Go); sin EAS ni servicios pagos |
| VI. Registro de decisiones y uso de IA | ✅ Pasa | Decisiones de este plan se vuelcan en `docs/ai-log.md` |

**Re-evaluación tras el diseño (Fase 1)**: sin cambios; ninguna violación. La constitution requiere una única
precisión menor (ya aplicada en v1.0.1): el pasaje automático a UTILIZADA por el sistema.

## Project Structure

### Documentation (this feature)

```text
specs/001-ai-ticket-it/
├── plan.md              # Este archivo
├── research.md          # Fase 0: decisiones y alternativas
├── data-model.md        # Fase 1: entidades, estados, reglas, seed
├── quickstart.md        # Fase 1: ejecución y validación
├── contracts/
│   └── openapi.yaml     # Fase 1: contrato de la API (fuente de verdad)
├── checklists/
│   └── requirements.md  # Calidad de la spec
└── tasks.md             # Fase 2 (/speckit-tasks) — no lo crea este comando
```

### Source Code (repository root)

```text
backend/
├── package.json
├── src/
│   ├── index.js                  # arranque: seed, job, listen(0.0.0.0)
│   ├── app.js                    # crearApp(deps): Express configurado (para supertest)
│   ├── config/                   # reglas.js (constantes), env.js
│   ├── routes/                   # un archivo por recurso
│   ├── controllers/              # traducen HTTP ↔ servicios; sin reglas
│   ├── services/                 # casos de uso: auth, eventos, compras, mensajes, resenias, favoritos
│   ├── domain/                   # Compra (estados), reglas de cancelación/utilización, puntaje, disponibilidad
│   ├── repository/               # memoria: store, eventos, usuarios, compras (reserva atómica)
│   ├── schemas/                  # Zod: requests, query params, env
│   ├── middleware/               # autenticar, requerirRol, validar, manejarErrores
│   ├── errors/                   # jerarquía de errores con código y HTTP
│   ├── jobs/                     # ciclo.job.js: expiración y auto-UTILIZADA
│   ├── utils/                    # reloj, texto (normalizar), fechas (días calendario)
│   └── seed/                     # datos de demostración con fechas relativas
└── test/
    ├── unit/                     # dominio puro
    ├── integration/              # supertest + validación contra OpenAPI
    ├── e2e/                      # servidor real: comprar → pagar → chat → cancelar/reseñar
    └── helpers/                  # validarRespuesta (Ajv), fábricas, reloj de prueba

mobile/
├── package.json
├── src/
│   ├── app/                      # expo-router
│   │   ├── _layout.js            # providers (Paper, Query, Session) + Stack.Protected por rol
│   │   ├── login.js
│   │   ├── (comprador)/          # tabs: explorar, favoritos, mis-compras, perfil
│   │   ├── (organizador)/        # tabs: mis-eventos, perfil
│   │   ├── evento/[id].js        # detalle y compra
│   │   ├── evento/nuevo.js       # alta de evento (organizador)
│   │   ├── evento/[id]/compras.js
│   │   └── compra/[id].js        # detalle, pago, cancelar, historial, chat, reseña
│   ├── api/                      # cliente HTTP, endpoints, esquemas Zod de respuesta
│   ├── components/               # tarjetas, chips de estado, selector de cantidad, chat
│   ├── hooks/                    # useEventos, useCompras, useMensajes (polling)…
│   ├── session/                  # SessionProvider (SecureStore)
│   └── theme/                    # tema de Paper con la paleta de la marca
└── __tests__/                    # pantallas y componentes

package.json                      # raíz: scripts (dev:backend, start:mobile, test, lint)
eslint.config.js · .prettierrc
docs/ai-log.md
```

**Structure Decision**: dos paquetes independientes (`backend/`, `mobile/`) sin `npm workspaces` (R17); la raíz solo
orquesta. El contrato permanece en `specs/001-ai-ticket-it/contracts/` y el backend lo lee desde ahí para Swagger y
los tests de contrato. Esto permite desarrollar ambos lados en paralelo con worktrees una vez congelado el contrato.

## Complexity Tracking

Sin violaciones de la constitution: no hay entradas. (Dos paquetes es lo que exige la consigna: Back-End y
Front-End).
