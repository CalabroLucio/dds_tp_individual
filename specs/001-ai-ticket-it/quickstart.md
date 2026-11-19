# Quickstart — validar AI Ticket It de punta a punta

Guía de ejecución y validación. No contiene código de implementación: el contrato está en
[contracts/openapi.yaml](contracts/openapi.yaml) y el modelo en [data-model.md](data-model.md).

## 1. Prerrequisitos

- Node 24 y npm 11 (ya instalados), git.
- Celular **Android** con **Expo Go para SDK 57** (ver R1 en [research.md](research.md)):
  `npx expo-go download android 57` y pasar el APK al celular, o instalarlo desde <https://expo.dev/go>.
- Celular y PC en la **misma red WiFi**.

### Red entre el celular y WSL (modo mirrored — solo una vez)

1. En Windows, crear o editar `C:\Users\<usuario>\.wslconfig` y agregar:
   ```ini
   [wsl2]
   networkingMode=mirrored
   ```
2. En PowerShell: `wsl --shutdown`, y volver a abrir WSL.
3. Verificar en WSL: `wslinfo --networking-mode` debe responder `mirrored`.
4. Obtener la IP de la PC en la red local (en Windows: `ipconfig`, adaptador WiFi, "Dirección IPv4").
5. En modo mirrored, el **firewall de Hyper-V** bloquea por defecto el tráfico entrante hacia WSL
   (`DefaultInboundAction: Block`). Abrir solo los puertos del backend y de Metro, en PowerShell como administrador:
   ```powershell
   New-NetFirewallHyperVRule -Name "AITicketIt" -DisplayName "AI Ticket It (API y Metro)" -Direction Inbound -VMCreatorId '{40E0AC32-46A5-438A-A0B2-2B479E8F2E90}' -Protocol TCP -LocalPorts 3000,8081 -Action Allow
   ```
   Para quitarla: `Remove-NetFirewallHyperVRule -Name "AITicketIt"`.
6. Comprobación: abrir `http://<IP-de-la-PC>:3000/salud` en el navegador del celular (debe responder
   `{"estado":"ok"}`). El celular tiene que estar en el mismo router que la PC (misma subred).

## 2. Instalación

```bash
npm install                      # raíz: scripts de orquestación (concurrently)
npm install --prefix backend
npm install --prefix mobile
```

## 3. Ejecución

```bash
npm run dev:backend              # API en 0.0.0.0:3000 + job + seed cargado; Swagger en /api-docs
EXPO_PUBLIC_API_URL=http://<IP-de-la-PC>:3000 npm run start:mobile   # Metro; abrir en Expo Go con el QR
```

Credenciales del seed (contraseña `demo1234`):

| Rol | Usuarios |
|---|---|
| Organizador | `martina@tickets.test`, `joaquin@tickets.test` |
| Comprador | `ana@tickets.test`, `bruno@tickets.test`, `carla@tickets.test` |

## 4. Pruebas automáticas

```bash
npm test --prefix backend              # unit + integración + contrato
npm run test:e2e --prefix backend      # viajes completos contra el servidor real
npm test --prefix mobile               # componentes y pantallas (jest-expo)
npm run lint                           # ESLint en ambos paquetes
```

Resultado esperado: todo en verde, incluido el test de concurrencia (50 solicitudes sobre cupo 10 → 10 × 201 y
40 × 409) y la verificación de respuestas contra `openapi.yaml`.

## 5. Escenarios de validación manual (cubren las user stories)

Cada escenario indica la story de [spec.md](spec.md) que valida.

| # | Escenario | Pasos | Resultado esperado |
|---|---|---|---|
| 1 | Publicar evento (US1) | Organizador: "Nuevo evento", 2 tipos de entrada, fecha futura | Aparece en el catálogo; con fecha pasada o sin tipos se rechaza con mensaje claro |
| 2 | Buscar y ordenar (US2) | Comprador: buscar "rock", filtrar categoría y precio, ordenar por puntaje | Resultados coherentes; organizadores sin reseñas al final |
| 3 | Comprar y pagar (US3) | Comprar 2 entradas → pagar con `TARJETA_RECHAZADA` → reintentar con `TARJETA_VISA` | Primero 402 y sigue PENDIENTE; luego CONFIRMADA; el cupo bajó en 2 |
| 4 | Expiración (US3) | Crear compra y no pagar (con `EXPIRACION_PENDIENTE_MIN=1` para acelerar) | Pasa a CANCELADA y el cupo vuelve |
| 5 | Mis compras (US4) | Abrir "Mis compras" | Estados diferenciados; días restantes solo en CONFIRMADAS; "hoy" si es hoy |
| 6 | Cancelar (US5) | Cancelar una CONFIRMADA de un evento de mañana; intentar con el evento de ~20 min | REEMBOLSADA con cupo liberado; el segundo se rechaza por fuera de plazo |
| 7 | Utilizar (US6) | Organizador: marcar UTILIZADA una compra del evento de ~20 min; intentar con el de mañana | La primera pasa; la segunda se rechaza |
| 8 | Vista del organizador (US7) | Abrir un evento propio | Compras con estado y entradas disponibles por tipo |
| 9 | Chat (US8) | Comprador escribe; organizador responde desde otro dispositivo/sesión | La respuesta se ve en < 10 s sin refrescar |
| 10 | Reseña (US9) | Reseñar una compra UTILIZADA; intentar dos veces | Se muestra en el evento del organizador y el promedio cambia; la segunda se rechaza |
| 11 | Favoritos (US10) | Marcar y desmarcar eventos; abrir "Favoritos" | La lista se actualiza sin duplicados |
| 12 | Auto-UTILIZADA (US6) | Con `AUTO_UTILIZADA_HORAS` bajo, esperar el ciclo del job | La CONFIRMADA pasa a UTILIZADA con `quien = SISTEMA` en el historial |

## 6. Flujo para el video (5–10 min)

Comprar → pagar (mostrando un rechazo y el reintento) → chat → cancelar o reseñar. Mostrar en Swagger
(`/api-docs`) el contrato, en el código la capa de dominio con la reserva atómica de cupo, y en la app el
recorrido completo.
