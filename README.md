# AI Ticket It — Entradas a un click

Plataforma móvil de venta de entradas para eventos: los **organizadores** publican eventos con distintos tipos de
entrada y los **compradores** buscan, compran, pagan (pago simulado), siguen el estado de su compra, chatean con el
organizador, cancelan con reembolso, reseñan y guardan favoritos.

Trabajo Práctico Individual de Desarrollo con IA — Desarrollo de Software, UTN FRBA, 2.º cuatrimestre 2026.

## Stack

| Módulo    | Tecnologías                                                                                                                                          |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Back-End  | Node 24 + Express 5, JavaScript ESM, Zod, JWT + bcryptjs, persistencia **en memoria**                                                                |
| Front-End | React Native con Expo SDK 57, expo-router, TanStack Query, React Native Paper                                                                        |
| Contrato  | OpenAPI 3.1 escrito a mano ([specs/001-ai-ticket-it/contracts/openapi.yaml](specs/001-ai-ticket-it/contracts/openapi.yaml)), servido en Swagger      |
| Pruebas   | Jest: unitarias, integración con supertest, validación contra el contrato, E2E con servidor real; jest-expo + React Native Testing Library en mobile |

Todo es gratuito y corre de forma local; la app se usa desde un celular Android con Expo Go.

## Estructura

```text
backend/    API REST en capas: routes → controllers → services → domain/repository (+ schemas, middleware, errors, jobs, seed)
mobile/     App Expo: src/app (pantallas por rol con expo-router), src/api, src/hooks, src/components
specs/      Spec-Driven Development con Spec Kit: spec, plan, modelo de datos, contrato, tareas
docs/       Registro de decisiones y del uso de IA (ai-log.md)
```

## Cómo correrlo

Guía completa (red WSL ↔ celular, Expo Go, escenarios de validación): [specs/001-ai-ticket-it/quickstart.md](specs/001-ai-ticket-it/quickstart.md).

```bash
npm install && npm install --prefix backend && npm install --prefix mobile
npm run dev:backend                                              # API en :3000, Swagger en /api-docs
EXPO_PUBLIC_API_URL=http://<IP-de-la-PC>:3000 npm run start:mobile  # abrir con Expo Go (SDK 57)
```

### Usuarios de prueba (contraseña `demo1234`)

| Rol          | Email                                                          |
| ------------ | -------------------------------------------------------------- |
| Organizadora | `martina@tickets.test`                                         |
| Organizador  | `joaquin@tickets.test`                                         |
| Compradores  | `ana@tickets.test`, `bruno@tickets.test`, `carla@tickets.test` |

Los datos de ejemplo se generan al arrancar con fechas relativas a ese momento: un evento que empieza en ~20 minutos,
uno mañana, uno en 20 días y eventos pasados con reseñas.

## Pruebas

```bash
npm test --prefix backend          # unitarias + integración + contrato
npm run test:e2e --prefix backend  # viajes completos contra el servidor real
npm test --prefix mobile           # pantallas y componentes
npm run lint
```

## Reglas de negocio destacadas

- **Estados de compra**: PENDIENTE → CONFIRMADA (pago) → UTILIZADA o REEMBOLSADA; PENDIENTE → CANCELADA. Cada
  cambio queda registrado con quién y cuándo.
- **Cupo atómico**: la reserva de cupo es una sección síncrona del repositorio; con 50 compras simultáneas sobre
  cupo 10 se aceptan exactamente 10.
- **Plazos**: una compra pendiente vence a los 15 minutos; se puede cancelar hasta 30 minutos antes del evento; el
  organizador marca la entrada como utilizada desde ese momento, y si no lo hace el sistema la marca 24 h después.
- **Pago simulado**: el medio "Tarjeta rechazada" siempre falla y los demás siempre se aprueban.

Las decisiones, sus justificaciones y la reflexión sobre el uso de IA están en [docs/ai-log.md](docs/ai-log.md).
