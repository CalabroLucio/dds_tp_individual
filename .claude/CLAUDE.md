<!-- CODEGRAPH_START -->
## CodeGraph

In repositories indexed by CodeGraph (a `.codegraph/` directory exists at the repo root), reach for it BEFORE grep/find or reading files when you need to understand or locate code:

- **MCP tool** (when available): `codegraph_explore` answers most code questions in one call — the relevant symbols' verbatim source plus the call paths between them, including dynamic-dispatch hops grep can't follow. Name a file or symbol in the query to read its current line-numbered source. If it's listed but deferred, load it by name via tool search.
- **Shell** (always works): `codegraph explore "<symbol names or question>"` prints the same output.

If there is no `.codegraph/` directory, skip CodeGraph entirely — indexing is the user's decision.
<!-- CODEGRAPH_END -->

## AI Ticket It — guía del proyecto

TP individual (DDS UTN FRBA 2C 2026). Monorepo con dos paquetes independientes (`backend/`, `mobile/`) sin npm
workspaces. Fuente de verdad: `.specify/memory/constitution.md`, `specs/001-ai-ticket-it/` (spec, plan, data-model,
`contracts/openapi.yaml`, tasks) y `docs/ai-log.md` (decisiones).

### Comandos

- `npm run dev:backend` (API en :3000, Swagger en `/api-docs`) · `npm run start:mobile` (Expo, SDK 57)
- `npm test --prefix backend` · `npm run test:e2e --prefix backend` · `npm test --prefix mobile` · `npm run lint`

### Reglas de trabajo

- JavaScript ESM, sin TypeScript. Backend en capas: routes → controllers (solo HTTP) → services → domain/repository.
  Zod en los bordes (body, query y params; en mobile, las respuestas).
- Test-first con Jest: escribir el test, verlo fallar, implementar. Los tests de integración validan cada respuesta
  con `validarRespuesta` contra `openapi.yaml`.
- Reglas de negocio solo en `backend/src/domain`; el front muestra lo que el backend calcula (`acciones`,
  `diasParaEvento`, `avisoNoCancelable`). El dominio recibe `ahora`; nunca `Date.now()`.
- Cambios de API: primero el contrato, después el código.
- Commits: uno por funcionalidad o hito, una sola línea con formato convencional (`feat: …`, `docs: …`), autoría
  del autor y **sin** `Co-Authored-By`. Revisar qué entra antes de commitear (nada de `.env`, APKs ni `node_modules`).
- Registrar en `docs/ai-log.md` las decisiones y observaciones sobre la IA en cada hito.
- En mobile, React Native Testing Library v14: `render` y `fireEvent` son asíncronos (usar `await`).
