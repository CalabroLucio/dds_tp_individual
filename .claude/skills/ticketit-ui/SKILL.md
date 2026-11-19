---
name: ticketit-ui
description: Sistema de diseño de la app mobile de AI Ticket It (estilo nocturno premium, tarjetas troqueladas, Poppins). Usar SIEMPRE antes de crear o modificar pantallas o componentes en mobile/src, para mantener paleta, tipografía, espaciado, componentes y reglas de interacción consistentes.
---

# AI Ticket It — sistema de diseño mobile

Decisiones tomadas por el autor el 2026-11-19 (registradas en `docs/ai-log.md`). Todo color, fuente y medida sale de
`mobile/src/theme/tema.js`: **nunca** hardcodear hex ni tamaños sueltos en una pantalla.

## Dirección visual: nocturno premium

App de salida de noche, en la línea de DICE o Fever: fondo casi negro, superficies apenas más claras, el verde de la
marca como acento neón y las imágenes de los eventos como protagonistas. Contraste alto, pocas líneas y bordes.

## Paleta (`colores` en `tema.js`)

| Token | Hex | Uso |
|---|---|---|
| `fondo` | `#0E0F12` | Fondo de todas las pantallas y color de las muescas del troquel |
| `superficie` | `#17191E` | Tarjetas, tickets, inputs |
| `superficieAlta` | `#21242B` | Tab bar flotante, diálogos, burbujas ajenas |
| `borde` | `#2C3039` | Separadores y líneas punteadas |
| `texto` | `#F3F5F7` | Texto principal |
| `textoSecundario` | `#9BA3AE` | Fechas, descripciones, metadatos |
| `marca` | `#6BD43F` | Acento: botón principal, pestaña activa, precios destacados |
| `sobreMarca` | `#0B1A05` | Texto e íconos sobre el verde (nunca blanco sobre verde) |
| `error` | `#FF5A6E` | Errores y acciones destructivas |
| `estrella` | `#FFC53D` | Puntajes |

Estados de compra (texto / fondo translúcido): PENDIENTE `#FFB547`, CONFIRMADA `#6BD43F`, UTILIZADA `#5AA9FF`,
CANCELADA `#8A9099`, REEMBOLSADA `#B78CFF`; fondo = color al 16 % de opacidad. Definidos en `ChipEstado.ESTADOS`.

## Tipografía: Poppins

Cargada con `@expo-google-fonts/poppins` en `src/app/_layout.js` (la splash espera a las fuentes). Usar los
`variant` de Paper, ya mapeados en el tema:

- `displaySmall`/`headlineMedium`/`headlineSmall`: Poppins Bold — títulos de pantalla y nombre del evento.
- `titleLarge`/`titleMedium`/`titleSmall`: Poppins SemiBold — títulos de tarjeta, precios.
- `labelLarge`/`labelMedium`/`labelSmall`: Poppins Medium — chips, botones, etiquetas en mayúsculas.
- `bodyLarge`/`bodyMedium`/`bodySmall`: Poppins Regular — texto corrido.

Etiquetas cortas en mayúsculas con `letterSpacing: 1` (ej. categoría, "HOY").

## Espaciado y forma

- Escala `espacio`: 4, 8, 12, 16, 24, 32. Margen lateral de pantalla: 16. Separación entre tarjetas: 12.
- Radios: tarjetas y tickets 18, botones y chips 999 (píldora), inputs 14.
- Toda lista deja `paddingBottom: ESPACIO_TAB` para no quedar debajo de la tab bar flotante.

## Componentes de identidad (propios)

- **`Ticket`** (`components/Ticket.js`): contenedor troquelado. Dos variantes según la prop: `talon` (talón izquierdo separado
  por una línea punteada vertical, muescas arriba y abajo) y `superior` (bloque de arriba separado por una línea punteada horizontal, con muescas a
  los costados). Las muescas usan el color `fondo` para "perforar" la tarjeta. La línea punteada se dibuja con
  segmentos (los bordes `dashed` de un solo lado fallan en Android).
- **`TarjetaEvento`**: `Ticket` con talón de **fecha grande** (día de la semana, número, mes, hora) y cuerpo con
  categoría, nombre, puntaje del organizador, precio "desde" y la acción (favorito).
- **`BarraPestanas`**: tab bar **flotante tipo píldora**: a 16 px del borde inferior, `superficieAlta`, radio 999; la
  pestaña activa se resalta con fondo `marca` y su rótulo; las inactivas muestran solo el ícono.
- **`EntradaDigital`**: la compra como entrada grande troquelada (estado, evento, fecha, tipo × cantidad, total y
  código corto de compra). Si está CONFIRMADA muestra: "El QR de acceso se envía al mail de tu cuenta (envío
  simulado en esta demo)". No se dibuja ningún QR: no existe validación en puerta.
- **`ChipEstado`**: píldora con punto de color y rótulo del estado.

Paper se mantiene para lo funcional (TextInput, Dialog, Portal, RadioButton, Snackbar, ActivityIndicator) con el
tema oscuro; `mode="outlined"` en inputs.

## Pantallas

- Encabezados propios dentro del contenido (título grande en Poppins Bold), no el header gris del Stack, salvo en
  pantallas de detalle donde el header es transparente sobre la imagen.
- Detalle de evento: imagen a sangre arriba con degradé (`expo-linear-gradient`) hacia `fondo`; la compra queda al
  final con el botón principal verde.
- El chat de una compra es una **pantalla propia** (`compra/[id]/chat`), estilo mensajería: burbujas propias en
  `marca` (texto `sobreMarca`) a la derecha, ajenas en `superficieAlta` a la izquierda, input fijo abajo.

## Reglas que no cambian con el rediseño

- El front no decide reglas: los botones aparecen solo si el backend los habilita en `acciones`.
- Mantener los `accessibilityLabel` y textos que usan los tests (`__tests__/`); si cambian, actualizar el test en el
  mismo cambio.
- Accesibilidad: contraste mínimo 4.5:1 para texto, áreas táctiles de 44 px, estado comunicado con texto y no solo
  con color.
