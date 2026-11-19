# Data Model — AI Ticket It

Persistencia **en memoria** (colecciones en `Map` dentro del repositorio). Los datos se cargan con el seed al
arrancar y se pierden al reiniciar. Todos los ids son UUID (`crypto.randomUUID()`). Las fechas son `Date` en el
dominio y ISO 8601 UTC en la API.

## Entidades

### Usuario
| Campo | Tipo | Reglas |
|---|---|---|
| id | uuid | |
| nombre, apellido | string | no vacíos |
| email | string | único, formato email, minúsculas |
| passwordHash | string | bcryptjs; nunca sale por la API |
| rol | `COMPRADOR` \| `ORGANIZADOR` | fijo, no se cambia |
| favoritos | Set de eventoId | solo compradores; sin duplicados (FR-028) |

### Categoria
| Campo | Tipo | Reglas |
|---|---|---|
| id | uuid | |
| nombre | string | único |
| descripcion | string | |

Conjunto fijo cargado por el seed (FR-006): Música, Teatro, Deportes, Festivales, Conferencias, Stand-up.

### Evento
| Campo | Tipo | Reglas |
|---|---|---|
| id | uuid | |
| nombre | string | 1–120 caracteres |
| descripcion | string | 1–2000 caracteres |
| categoriaId | uuid | debe existir |
| fecha | Date | futura al crear (FR-004) |
| multimedia | string[] | URLs http(s); puede ser vacío |
| organizadorId | uuid | usuario con rol ORGANIZADOR |
| tiposEntrada | TipoEntrada[] | al menos 1 (FR-005) |
| creadoEn | Date | |

Derivados: `precioDesde` (mínimo `precio` de los tipos), `compraAbierta` (`ahora` < `fecha`),
`avisoNoCancelable` (`compraAbierta` y faltan ≤ 30 min), puntaje y reseñas del organizador.

### TipoEntrada
| Campo | Tipo | Reglas |
|---|---|---|
| id | uuid | |
| nombre | string | 1–60 caracteres; único dentro del evento |
| descripcion | string | |
| precio | number | ≥ 0, hasta 2 decimales |
| cupo | integer | > 0 (cupo total) |

Derivado: `cupoDisponible = cupo − Σ cantidad(compras PENDIENTE, CONFIRMADA o UTILIZADA)` (FR-013);
`hayCupoPara(n) = n ≤ cupoDisponible`.

### Compra
| Campo | Tipo | Reglas |
|---|---|---|
| id | uuid | |
| compradorId | uuid | rol COMPRADOR |
| eventoId, tipoEntradaId | uuid | el tipo pertenece al evento |
| cantidad | integer | 1 ≤ n ≤ min(10, cupoDisponible) (FR-011) |
| total | number | `precio × cantidad`, fijado al crear |
| estado | EstadoCompra | ver transiciones |
| creadaEn | Date | |
| expiraEn | Date | `creadaEn + 15 min`; solo relevante en PENDIENTE |
| historial | CambioEstadoCompra[] | uno por cada cambio, incluido el inicial |
| mensajes | Mensaje[] | |
| resenia | Resenia \| null | máximo una |

### CambioEstadoCompra
| Campo | Tipo | Reglas |
|---|---|---|
| estado | EstadoCompra | estado al que pasó |
| quien | `{ id, nombre, rol }` \| `SISTEMA` | comprador, organizador o sistema (job) |
| fechaHora | Date | |

### Mensaje
| Campo | Tipo | Reglas |
|---|---|---|
| id | uuid | |
| autorId | uuid | comprador de la compra u organizador del evento |
| texto | string | 1–500 caracteres tras `trim` (FR-025) |
| enviadoEn | Date | |

### Resenia
| Campo | Tipo | Reglas |
|---|---|---|
| id | uuid | |
| compraId | uuid | compra UTILIZADA; una reseña por compra |
| compradorId, eventoId | uuid | |
| puntaje | integer | 1 a 5 |
| comentario | string | 1–500 caracteres |
| creadaEn | Date | |

### Derivado: puntaje del organizador
`promedio(puntaje)` de todas las reseñas de eventos del organizador, redondeado a 1 decimal; `null` si no tiene
reseñas ("sin reseñas", queda al final al ordenar por puntaje) (FR-027).

## Máquina de estados de Compra (FR-014)

```text
PENDIENTE ──pago aprobado──▶ CONFIRMADA ──cancela comprador (> 30 min antes)──▶ REEMBOLSADA
    │                            │
    │                            └──organizador (desde cutoff) o sistema (24 h tras inicio)──▶ UTILIZADA
    ├──cancela comprador (> 30 min antes)──▶ CANCELADA
    └──expira a los 15 min (sistema)──────▶ CANCELADA
```

Finales: UTILIZADA, CANCELADA, REEMBOLSADA. Todo otro intento → `409 ESTADO_INVALIDO`.

| Transición | Quién | Condición |
|---|---|---|
| (nueva) → PENDIENTE | comprador | cupo disponible, evento no empezado, no es el organizador del evento |
| PENDIENTE → CONFIRMADA | comprador | medio de pago aprobado; si es `TARJETA_RECHAZADA` → 402 y sigue PENDIENTE |
| PENDIENTE → CANCELADA | comprador | faltan **más de** 30 min para el evento |
| PENDIENTE → CANCELADA | sistema | `ahora ≥ expiraEn` |
| CONFIRMADA → REEMBOLSADA | comprador | faltan **más de** 30 min para el evento |
| CONFIRMADA → UTILIZADA | organizador del evento | `ahora ≥ fecha − 30 min` |
| CONFIRMADA → UTILIZADA | sistema | `ahora ≥ fecha + 24 h` |

Cupo: se reserva al crear la compra (sección síncrona atómica); se libera al pasar a CANCELADA o REEMBOLSADA.
Cada transición agrega un `CambioEstadoCompra`.

## Acciones calculadas por compra (R15)

| Acción | Verdadera cuando |
|---|---|
| puedePagar | estado PENDIENTE y `ahora < expiraEn` (solo el comprador) |
| puedeCancelar | estado PENDIENTE o CONFIRMADA y faltan > 30 min (solo el comprador) |
| puedeMarcarUtilizada | estado CONFIRMADA y `ahora ≥ fecha − 30 min` (solo el organizador) |
| puedeResenar | estado UTILIZADA y sin reseña (solo el comprador) |

`diasParaEvento`: solo si estado = CONFIRMADA y el evento aún no empezó: días calendario hasta el evento (0 = hoy);
`eventoRealizado`: `true` si estado = CONFIRMADA y el evento ya empezó (se muestra "Evento realizado").

## Reglas de validación transversales

- Toda entrada se valida con Zod en el borde (constitution I); error → `400 VALIDACION` con `detalles`.
- Un usuario con rol equivocado → `403 ROL_NO_PERMITIDO`; fuera de su recurso → `403 NO_AUTORIZADO`.
- Un organizador no compra sus propios eventos → `403 ORGANIZADOR_NO_PUEDE_COMPRAR`.

## Configuración (constantes, sobrescribibles por entorno)

| Constante | Valor por defecto |
|---|---|
| `LIMITE_CANCELACION_MIN` | 30 |
| `EXPIRACION_PENDIENTE_MIN` | 15 |
| `AUTO_UTILIZADA_HORAS` | 24 |
| `MAX_ENTRADAS_POR_COMPRA` | 10 |
| `JWT_EXPIRACION` | `8h` |
| `INTERVALO_JOB_SEG` | 30 |

## Datos seed (FR-029)

- **Organizadores**: Martina Ruiz (`martina@tickets.test`), Joaquín Pérez (`joaquin@tickets.test`).
- **Compradores**: Ana, Bruno y Carla (`ana@…`, `bruno@…`, `carla@…`). Contraseña de todos: `demo1234`.
- **Eventos futuros**: uno que empieza en ~20 min (con compras CONFIRMADAS para probar UTILIZADA y la ventana
  no cancelable), uno mañana, uno en 20 días, y otros en categorías variadas.
- **Eventos pasados**: con compras UTILIZADAS y reseñas, para tener puntajes de organizador y ordenar por puntaje.
- Todas las fechas se calculan relativas a la hora de arranque.
