# Feature Specification: AI Ticket It — Venta de entradas para eventos

**Feature Branch**: `main` (sin rama dedicada; directorio `001-ai-ticket-it`)

**Created**: 2026-11-19

**Status**: Draft

**Input**: User description: "AI Ticket It: plataforma móvil de venta de entradas para eventos, con rol Organizador y rol Comprador. Una única spec con user stories priorizadas (P1: crear eventos, buscar, comprar y pagar, ver mis compras; P2: cancelar/reembolsar, marcar utilizada, vista del organizador por evento; P3: chat por compra, reseñas, favoritos). Flujo de demo: comprar → pagar → chat → cancelar/reseñar."

## Clarifications

### Session 2026-11-19

- Q: ¿Cómo se decide que un pago simulado falle? → A: El comprador elige un medio de pago simulado; uno (por ejemplo "Tarjeta rechazada") siempre es rechazado y los demás siempre se aprueban.
- Q: ¿Qué pasa con una compra CONFIRMADA cuyo evento ya terminó y nadie la marcó como UTILIZADA? → A: Dos vías: el organizador puede marcarla UTILIZADA a mano desde el límite de cancelación, y el sistema la pasa a UTILIZADA automáticamente 24 horas después del inicio del evento (valor configurable). Eventos cancelados o cortados a mitad quedan como limitación conocida (ver Assumptions).
- Q: ¿Hasta cuándo se pueden comprar entradas de un evento? → A: Hasta el inicio del evento; si faltan menos de 30 minutos (ya pasó el límite de cancelación), la app avisa antes de confirmar que esa compra no se podrá cancelar.
- Q: ¿Hay un máximo de entradas por compra? → A: Sí, 10 entradas por compra (valor configurable); si el cupo disponible es menor, vale el menor de los dos.

## User Scenarios & Testing *(mandatory)*

AI Ticket It conecta a **organizadores**, que publican eventos y venden entradas, con **compradores**, que
descubren eventos, compran entradas y hacen seguimiento de su compra hasta el día del evento. Todas las
personas inician sesión y tienen uno de dos roles fijos: Comprador u Organizador.

### User Story 1 - El organizador publica un evento con distintos tipos de entrada (Priority: P1)

Un organizador crea un evento indicando nombre, descripción, categoría, fecha, material multimedia
(enlaces a imágenes o videos) y uno o más tipos de entrada (por ejemplo General, Platea, VIP), cada uno con
nombre, descripción, precio y cupo. Una vez creado, el evento queda disponible en el catálogo.

**Why this priority**: sin eventos publicados no existe nada para buscar, comprar ni reseñar. Es la base de
todo el flujo.

**Independent Test**: iniciar sesión como organizador, crear un evento con dos tipos de entrada y verificar
que aparece en el catálogo con sus tipos, precios y cupos.

**Acceptance Scenarios**:

1. **Given** un organizador con sesión iniciada, **When** crea un evento con fecha futura y dos tipos de
   entrada con precio y cupo válidos, **Then** el evento queda publicado y es visible en el catálogo con los
   dos tipos de entrada.
2. **Given** un organizador creando un evento, **When** no define ningún tipo de entrada, **Then** el sistema
   rechaza la creación e indica que se requiere al menos un tipo.
3. **Given** un organizador creando un evento, **When** ingresa una fecha pasada, un cupo igual o menor a cero
   o un precio negativo, **Then** el sistema rechaza el evento e indica cuál dato es inválido.
4. **Given** un organizador, **When** crea un tipo de entrada con precio 0, **Then** el sistema lo acepta
   (entrada gratuita).
5. **Given** un comprador con sesión iniciada, **When** intenta crear un evento, **Then** el sistema lo impide.

---

### User Story 2 - El comprador busca, filtra y ordena eventos (Priority: P1)

Un comprador encuentra eventos buscando por texto (coincidencia con nombre, descripción o categoría) o
explorando por categoría. Puede acotar por rango de precio y ordenar los resultados por precio, por fecha
del evento o por puntaje del organizador. Puede abrir el detalle de un evento para ver su información
completa, los tipos de entrada con cupo disponible y las reseñas del organizador.

**Why this priority**: es la puerta de entrada del comprador; sin descubrimiento no hay compra.

**Independent Test**: con los datos de ejemplo cargados, buscar un texto, filtrar por categoría y por
rango de precio, cambiar el orden y verificar que los resultados cambian de forma coherente.

**Acceptance Scenarios**:

1. **Given** un catálogo con varios eventos, **When** el comprador busca un texto que aparece en el nombre,
   la descripción o la categoría de algunos eventos, **Then** ve solo esos eventos.
2. **Given** un catálogo con eventos de varias categorías, **When** el comprador elige una categoría,
   **Then** ve únicamente los eventos de esa categoría.
3. **Given** resultados de búsqueda, **When** el comprador define un rango de precio, **Then** ve solo los
   eventos que tienen al menos un tipo de entrada dentro del rango.
4. **Given** resultados de búsqueda, **When** ordena por precio, **Then** se ordenan por el precio más bajo
   entre los tipos de entrada de cada evento.
5. **Given** resultados de búsqueda, **When** ordena por fecha, **Then** los eventos más próximos aparecen
   primero.
6. **Given** resultados de búsqueda, **When** ordena por puntaje del organizador, **Then** aparecen primero los
   eventos con organizadores mejor puntuados, y los organizadores sin reseñas quedan al final.
7. **Given** una búsqueda sin coincidencias, **When** se muestra el resultado, **Then** el comprador ve un
   mensaje claro de que no hay eventos.
8. **Given** eventos cuya fecha ya pasó, **When** el comprador explora el catálogo, **Then** esos eventos no
   se ofrecen para la compra.

---

### User Story 3 - El comprador compra entradas y las paga (Priority: P1)

El comprador elige un evento, un tipo de entrada y una cantidad, y confirma la compra. La compra se crea en
estado PENDIENTE y reserva ese cupo de inmediato. Luego el comprador paga (pago simulado); si el pago se
aprueba, la compra pasa a CONFIRMADA. Si el pago falla, la compra sigue PENDIENTE y el comprador puede
reintentar. Una compra PENDIENTE que no se paga a los 15 minutos expira y libera el cupo.

**Why this priority**: es el corazón del negocio y el primer tramo del flujo elegido para la demo.

**Independent Test**: como comprador, comprar 2 entradas de un tipo con cupo 10 y verificar que el cupo
disponible baja a 8, que la compra queda PENDIENTE y que, tras pagar, queda CONFIRMADA.

**Acceptance Scenarios**:

1. **Given** un tipo de entrada con cupo disponible 10, **When** el comprador compra 2, **Then** se crea una
   compra PENDIENTE por el total (precio × cantidad) y el cupo disponible pasa a 8.
2. **Given** una compra PENDIENTE, **When** el comprador paga con un medio de pago simulado que se aprueba,
   **Then** la compra pasa a CONFIRMADA.
3. **Given** una compra PENDIENTE, **When** el comprador paga con el medio de pago simulado que siempre es
   rechazado (por ejemplo "Tarjeta rechazada"), **Then** el pago falla, la compra sigue PENDIENTE, el cupo
   sigue reservado y el comprador puede reintentar con otro medio de pago.
4. **Given** una compra PENDIENTE sin pagar, **When** pasan 15 minutos desde su creación, **Then** la compra
   pasa a CANCELADA por expiración y el cupo reservado se libera.
5. **Given** un tipo de entrada con cupo disponible 3, **When** el comprador intenta comprar 4, **Then** el
   sistema rechaza la compra e informa el cupo disponible.
6. **Given** un tipo de entrada con cupo disponible 10 y 50 compradores comprando una entrada a la vez,
   **When** todas las solicitudes llegan en simultáneo, **Then** exactamente 10 compras se crean y las otras 40
   son rechazadas por falta de cupo.
7. **Given** un organizador con sesión iniciada, **When** intenta comprar entradas de un evento propio,
   **Then** el sistema lo impide.
8. **Given** una cantidad menor a 1 o no entera, **When** el comprador intenta comprar, **Then** el sistema
   rechaza la solicitud.
9. **Given** un tipo de entrada con cupo disponible 30, **When** el comprador intenta comprar 11 entradas,
   **Then** el sistema rechaza la compra e informa que el máximo por compra es 10.
10. **Given** un evento que empieza dentro de 20 minutos con cupo disponible, **When** el comprador va a
   confirmar la compra, **Then** la app le avisa que esa compra ya no se podrá cancelar y, si confirma, la
   compra se crea normalmente.
11. **Given** un evento cuya hora de inicio ya pasó, **When** el comprador intenta comprar, **Then** el
    sistema rechaza la compra.

---

### User Story 4 - El comprador ve sus compras y su estado (Priority: P1)

El comprador consulta la lista de sus compras con el estado de cada una (PENDIENTE, CONFIRMADA, UTILIZADA,
CANCELADA, REEMBOLSADA) diferenciado con claridad. Para las compras CONFIRMADAS se muestra cuántos días
faltan para el evento.

**Why this priority**: es lo que da seguimiento a la compra y habilita las acciones posteriores (cancelar,
chatear, reseñar).

**Independent Test**: con compras en distintos estados, abrir "Mis compras" y verificar el estado visible de
cada una y los días restantes en las confirmadas.

**Acceptance Scenarios**:

1. **Given** un comprador con compras en distintos estados, **When** abre "Mis compras", **Then** cada compra
   muestra su evento, tipo de entrada, cantidad, total y estado, distinguible visualmente de los demás.
2. **Given** una compra CONFIRMADA de un evento dentro de 20 días, **When** el comprador la ve, **Then** se
   muestra que faltan 20 días.
3. **Given** una compra CONFIRMADA de un evento que ocurre hoy, **When** el comprador la ve, **Then** se
   muestra que el evento es hoy.
4. **Given** una compra en un estado distinto de CONFIRMADA, **When** el comprador la ve, **Then** no se
   muestra el conteo de días.
5. **Given** una compra CONFIRMADA de un evento que ya comenzó y aún no fue marcada como utilizada, **When**
   el comprador la ve, **Then** se muestra "Evento realizado" en lugar de un conteo de días negativo.
6. **Given** un comprador, **When** abre "Mis compras", **Then** solo ve sus propias compras.

---

### User Story 5 - El comprador cancela una compra y obtiene el reembolso (Priority: P2)

El comprador cancela una compra mientras no esté UTILIZADA y falten más de 30 minutos para el evento (límite
de cancelación configurable). Una compra PENDIENTE cancelada pasa a CANCELADA; una compra CONFIRMADA
cancelada pasa a REEMBOLSADA. En ambos casos el cupo vuelve a quedar disponible.

**Why this priority**: es el cierre alternativo del flujo de la demo y una regla de negocio central; es
valioso pero la venta funciona sin él.

**Independent Test**: confirmar una compra de un evento dentro de varios días, cancelarla y verificar estado
REEMBOLSADA, cupo liberado y registro del cambio de estado.

**Acceptance Scenarios**:

1. **Given** una compra CONFIRMADA de un evento que ocurre dentro de más de 30 minutos, **When** el comprador
   la cancela, **Then** pasa a REEMBOLSADA y el cupo se libera.
2. **Given** una compra PENDIENTE, **When** el comprador la cancela, **Then** pasa a CANCELADA y el cupo se
   libera.
3. **Given** una compra CONFIRMADA de un evento que ocurre dentro de 20 minutos, **When** el comprador intenta
   cancelarla, **Then** el sistema lo rechaza explicando que se superó el límite de cancelación.
4. **Given** una compra UTILIZADA, CANCELADA o REEMBOLSADA, **When** el comprador intenta cancelarla,
   **Then** el sistema lo rechaza porque ya está en un estado final.
5. **Given** una compra de otro comprador, **When** un comprador intenta cancelarla, **Then** el sistema lo
   rechaza.
6. **Given** cualquier cambio de estado de una compra, **When** se produce, **Then** queda registrado el nuevo
   estado, quién lo originó y cuándo.

---

### User Story 6 - Las entradas pasan a utilizadas, a mano o automáticamente (Priority: P2)

Cuando el evento está por comenzar o ya comenzó, el organizador puede marcar una compra CONFIRMADA como
UTILIZADA (la persona asistió). Esto solo es posible desde el límite de cancelación (30 minutos antes) en
adelante, de modo que cancelar y utilizar nunca se superpongan. Si nadie la marca, el sistema pasa la compra
CONFIRMADA a UTILIZADA automáticamente 24 horas después del inicio del evento, para que ninguna compra
quede confirmada para siempre y se habilite la reseña.

**Why this priority**: habilita las reseñas y cierra el ciclo de vida de la compra.

**Independent Test**: con una compra CONFIRMADA de un evento que empieza en ~20 minutos, marcarla como
utilizada como organizador y verificar el estado; intentarlo con un evento de mañana y verificar el rechazo.

**Acceptance Scenarios**:

1. **Given** una compra CONFIRMADA de un evento que empieza dentro de 20 minutos, **When** su organizador la
   marca como utilizada, **Then** pasa a UTILIZADA.
2. **Given** una compra CONFIRMADA de un evento de mañana, **When** el organizador intenta marcarla como
   utilizada, **Then** el sistema lo rechaza porque aún no se habilitó.
3. **Given** una compra en estado distinto de CONFIRMADA, **When** el organizador intenta marcarla como
   utilizada, **Then** el sistema lo rechaza.
4. **Given** una compra de un evento de otro organizador, **When** un organizador intenta marcarla como
   utilizada, **Then** el sistema lo rechaza.
5. **Given** una compra CONFIRMADA que nadie marcó como utilizada, **When** pasan 24 horas desde el inicio
   del evento, **Then** el sistema la pasa a UTILIZADA y el cambio queda registrado como originado por el
   sistema.
6. **Given** una compra CONFIRMADA de un evento que empezó hace menos de 24 horas, **When** su organizador la
   marca como utilizada, **Then** pasa a UTILIZADA (el marcado manual sigue disponible después del inicio).

---

### User Story 7 - El organizador ve las compras de un evento y su disponibilidad (Priority: P2)

El organizador abre uno de sus eventos y ve todas las compras asociadas, con el estado de cada una
diferenciado con claridad, y cuántas entradas quedan disponibles de cada tipo.

**Why this priority**: da al organizador visibilidad de sus ventas y es el punto de partida para marcar
entradas como utilizadas y responder mensajes.

**Independent Test**: tras varias compras en distintos estados, abrir el evento como organizador y verificar
la lista de compras con estados y el cupo disponible por tipo.

**Acceptance Scenarios**:

1. **Given** un evento con compras en distintos estados, **When** su organizador lo abre, **Then** ve todas
   las compras con comprador, tipo, cantidad, total y estado diferenciado.
2. **Given** un evento con varios tipos de entrada, **When** su organizador lo abre, **Then** ve para cada tipo
   el cupo total y las entradas disponibles.
3. **Given** compras PENDIENTES, CONFIRMADAS y UTILIZADAS, **When** se calcula la disponibilidad, **Then** esas
   compras restan del cupo, mientras que las CANCELADAS y REEMBOLSADAS no.
4. **Given** el evento de otro organizador, **When** un organizador intenta ver sus compras, **Then** el
   sistema lo rechaza.

---

### User Story 8 - Comprador y organizador conversan dentro de la compra (Priority: P3)

Cada compra tiene un chat entre su comprador y el organizador del evento, para consultas sobre el evento, el
acceso al lugar o cambios de fecha. Ambos pueden escribir en cualquier momento y en cualquier estado de la
compra. La conversación se actualiza periódicamente, sin necesidad de reabrir la pantalla.

**Why this priority**: es el tercer paso del flujo de la demo y reduce la dependencia de canales externos,
pero la compra funciona sin él.

**Independent Test**: como comprador enviar un mensaje en una compra, y como organizador abrir la misma
compra, verlo y responder; verificar que el comprador ve la respuesta sin reabrir la pantalla.

**Acceptance Scenarios**:

1. **Given** una compra en cualquier estado, **When** el comprador envía un mensaje, **Then** el mensaje queda
   en la conversación con su autor y su hora.
2. **Given** una conversación con mensajes del comprador, **When** el organizador del evento responde,
   **Then** el comprador ve la respuesta sin acciones manuales adicionales dentro de un intervalo breve.
3. **Given** una compra, **When** un usuario que no es su comprador ni el organizador del evento intenta leer
   o escribir en el chat, **Then** el sistema lo rechaza.
4. **Given** un mensaje vacío o formado solo por espacios, **When** se intenta enviar, **Then** el sistema lo
   rechaza.

---

### User Story 9 - El comprador reseña el evento y se construye la reputación del organizador (Priority: P3)

Una vez que la compra está UTILIZADA, el comprador califica el evento con un puntaje entero de 1 a 5 y un
comentario. Solo se permite una reseña por compra. El puntaje del organizador es el promedio de las reseñas
de sus eventos. El detalle de cada evento muestra el puntaje del organizador y sus reseñas anteriores, para
que futuros compradores conozcan experiencias previas.

**Why this priority**: cierra el flujo de la demo y alimenta el orden por puntaje, pero depende de todo lo
anterior.

**Independent Test**: con una compra UTILIZADA, dejar una reseña y verificar que aparece en el detalle de
los eventos del organizador y que el promedio del organizador se actualiza.

**Acceptance Scenarios**:

1. **Given** una compra UTILIZADA sin reseña, **When** el comprador deja puntaje 4 y un comentario, **Then**
   la reseña queda registrada.
2. **Given** una compra que no está UTILIZADA, **When** el comprador intenta reseñar, **Then** el sistema lo
   rechaza.
3. **Given** una compra UTILIZADA que ya tiene reseña, **When** el comprador intenta reseñar de nuevo,
   **Then** el sistema lo rechaza.
4. **Given** un puntaje fuera del rango de 1 a 5 o no entero, **When** el comprador intenta reseñar, **Then**
   el sistema lo rechaza.
5. **Given** un organizador con reseñas de puntaje 5 y 3, **When** se consulta su puntaje, **Then** es 4.
6. **Given** el detalle de un evento, **When** el comprador lo abre, **Then** ve el puntaje del organizador y
   sus reseñas con puntaje, comentario y autor.
7. **Given** una compra de otro comprador, **When** un comprador intenta reseñarla, **Then** el sistema lo
   rechaza.

---

### User Story 10 - El comprador guarda eventos favoritos (Priority: P3)

El comprador marca y desmarca eventos como favoritos desde el catálogo o el detalle, y consulta la lista de
sus favoritos.

**Why this priority**: mejora la experiencia de descubrimiento; no interviene en el flujo de compra.

**Independent Test**: marcar dos eventos como favoritos, abrir "Favoritos", desmarcar uno y verificar que
la lista se actualiza.

**Acceptance Scenarios**:

1. **Given** un evento del catálogo, **When** el comprador lo marca como favorito, **Then** aparece en su
   lista de favoritos y se ve marcado en el catálogo y el detalle.
2. **Given** un evento favorito, **When** el comprador lo desmarca, **Then** desaparece de su lista.
3. **Given** un evento ya favorito, **When** el comprador intenta marcarlo otra vez, **Then** no se duplica
   en la lista.
4. **Given** dos compradores distintos, **When** cada uno guarda favoritos, **Then** cada uno ve únicamente
   los suyos.

---

### Edge Cases

- Dos compradores piden las últimas entradas al mismo tiempo: solo se concede la cantidad que realmente
  queda; nunca se vende por encima del cupo.
- Una compra PENDIENTE expira mientras el comprador está por pagar: el pago se rechaza porque la compra ya
  está CANCELADA.
- El pago de una compra ya CONFIRMADA, CANCELADA, REEMBOLSADA o UTILIZADA se rechaza.
- Una compra PENDIENTE cuyo plazo de 15 minutos ya venció se considera vencida aunque el proceso automático
  todavía no la haya cancelado: el pago se rechaza y la compra pasa a CANCELADA en ese momento.
- El comprador cancela justo en el instante del límite (exactamente 30 minutos antes): la regla es
  determinista; se considera que a menos de 30 minutos, o exactamente a 30, ya no se puede cancelar.
- Un evento cuya fecha ya pasó deja de aceptar compras, aunque tenga cupo.
- Un tipo de entrada con cupo agotado se muestra como agotado y no se puede comprar.
- Un comprador sin compras, sin favoritos o un organizador sin eventos ven un estado vacío claro, no un error.
- Sesión inexistente o vencida: toda acción protegida se rechaza indicando que hay que iniciar sesión.
- Credenciales incorrectas: se rechaza el inicio de sesión sin revelar cuál dato es el erróneo.
- Un usuario con el rol equivocado para una acción (comprador intentando crear eventos u organizador
  intentando comprar) recibe un rechazo claro.
- Un organizador sin reseñas no tiene puntaje: se muestra "sin reseñas" y queda al final al ordenar por
  puntaje.

## Requirements *(mandatory)*

### Functional Requirements

**Acceso y roles**

- **FR-001**: El sistema MUST permitir iniciar sesión con credenciales y MUST asignar a cada persona uno de
  dos roles fijos: Comprador u Organizador.
- **FR-002**: El sistema MUST restringir cada acción al rol que corresponde (crear eventos y marcar
  utilizadas: Organizador; comprar, reseñar y favoritos: Comprador; chat y ver detalle de una compra:
  solo sus dos participantes) y MUST rechazar las demás con un mensaje claro.

**Eventos**

- **FR-003**: Un organizador MUST poder crear un evento con nombre, descripción, categoría, fecha y hora,
  material multimedia (enlaces) y uno o más tipos de entrada.
- **FR-004**: Cada tipo de entrada MUST tener nombre, descripción, precio mayor o igual a 0 y cupo entero
  mayor a 0; la fecha del evento MUST ser futura al momento de la creación.
- **FR-005**: El sistema MUST rechazar la creación de un evento que incumpla FR-004 o que no tenga ningún tipo
  de entrada, indicando qué dato es inválido.
- **FR-006**: Las categorías MUST ser un conjunto definido con nombre y descripción, al que cada evento
  pertenece.

**Búsqueda y catálogo**

- **FR-007**: El comprador MUST poder buscar por texto, con coincidencia (sin distinguir mayúsculas ni
  tildes) en nombre, descripción o categoría del evento.
- **FR-008**: El comprador MUST poder explorar por categoría y filtrar por rango de precio (un evento
  coincide si al menos un tipo de entrada está dentro del rango).
- **FR-009**: El comprador MUST poder ordenar por precio (el menor entre los tipos de entrada del evento),
  por fecha del evento (más próximo primero) y por puntaje del organizador (mayor primero, sin reseñas al
  final).
- **FR-010**: El catálogo MUST ofrecer solo eventos con fecha futura. El detalle de un evento MUST mostrar
  descripción, fecha, multimedia, tipos de entrada con precio y cupo disponible, el puntaje del organizador y
  sus reseñas.

**Compras y pago**

- **FR-011**: El comprador MUST poder comprar eligiendo un evento, un tipo de entrada y una cantidad entera
  mayor o igual a 1, sin superar el cupo disponible ni un máximo de 10 entradas por compra (configurable);
  el total MUST ser precio × cantidad. La compra MUST
  permitirse hasta el inicio del evento; si faltan menos de 30 minutos (límite de cancelación), el sistema
  MUST informar al comprador, antes de confirmar, que la compra no podrá cancelarse.
- **FR-012**: Un organizador MUST NOT poder comprar entradas de eventos propios.
- **FR-013**: El cupo disponible de un tipo de entrada MUST ser el cupo total menos las entradas de sus compras
  PENDIENTES, CONFIRMADAS y UTILIZADAS. El cupo MUST descontarse al crear la compra y liberarse cuando esta
  pasa a CANCELADA o REEMBOLSADA. Ante solicitudes simultáneas, la suma de entradas concedidas MUST NOT
  superar nunca el cupo disponible.
- **FR-014**: El estado de una compra MUST ser uno de PENDIENTE, CONFIRMADA, UTILIZADA, CANCELADA o
  REEMBOLSADA, con exclusivamente estas transiciones: PENDIENTE→CONFIRMADA, PENDIENTE→CANCELADA,
  CONFIRMADA→REEMBOLSADA y CONFIRMADA→UTILIZADA. UTILIZADA, CANCELADA y REEMBOLSADA son estados finales.
- **FR-015**: El comprador MUST poder pagar una compra PENDIENTE eligiendo un medio de pago simulado. El
  resultado MUST ser determinista según el medio elegido: al menos uno (por ejemplo "Tarjeta rechazada")
  MUST ser siempre rechazado y los demás MUST ser siempre aprobados. Si se aprueba, la compra pasa a
  CONFIRMADA; si falla, la compra sigue PENDIENTE y MUST poder reintentarse con cualquier medio.
- **FR-016**: Una compra PENDIENTE MUST pasar a CANCELADA automáticamente a los 15 minutos de su creación si
  no fue pagada, liberando el cupo.
- **FR-017**: Cada cambio de estado MUST registrarse con el nuevo estado, quién lo originó (comprador,
  organizador o sistema) y fecha y hora.

**Seguimiento**

- **FR-018**: El comprador MUST poder ver solo sus compras con estado claramente diferenciado y, para las
  CONFIRMADAS, los días que faltan para el evento (0 se muestra como "hoy").
- **FR-019**: El organizador MUST poder ver las compras de cada uno de sus eventos, con estado diferenciado,
  y las entradas disponibles por tipo de entrada.

**Cancelación y utilización**

- **FR-020**: El comprador MUST poder cancelar su compra PENDIENTE o CONFIRMADA siempre que falten más de 30
  minutos para el evento; PENDIENTE→CANCELADA y CONFIRMADA→REEMBOLSADA. El límite MUST ser configurable.
- **FR-021**: El sistema MUST validar el límite de cancelación en el momento de la solicitud, no mediante un
  proceso periódico.
- **FR-022**: El organizador del evento MUST poder marcar una compra CONFIRMADA como UTILIZADA desde el límite
  de cancelación (30 minutos antes) en adelante, y MUST NOT poder hacerlo antes. Además, el sistema MUST
  pasar automáticamente a UTILIZADA toda compra CONFIRMADA que siga sin marcar 24 horas después del inicio
  del evento (plazo configurable), registrando el cambio como originado por el sistema.

**Chat**

- **FR-023**: Cada compra MUST tener una conversación entre su comprador y el organizador del evento, donde
  ambos pueden enviar mensajes en cualquier estado de la compra.
- **FR-024**: Los mensajes MUST mostrar autor y hora, y la conversación MUST actualizarse sola de forma
  periódica con un retraso no mayor a 10 segundos (SC-006).
- **FR-025**: El sistema MUST rechazar mensajes vacíos y el acceso al chat de personas que no son parte de
  la compra.

**Reseñas y reputación**

- **FR-026**: El comprador MUST poder reseñar una compra UTILIZADA propia con un puntaje entero de 1 a 5 y un
  comentario; MUST permitirse una sola reseña por compra.
- **FR-027**: El puntaje del organizador MUST ser el promedio de las reseñas de todos sus eventos y MUST
  mostrarse en el detalle de cada evento junto con sus reseñas.

**Favoritos**

- **FR-028**: El comprador MUST poder marcar y desmarcar eventos como favoritos, sin duplicados, y consultar
  su lista de favoritos; cada comprador solo ve los suyos.

**Datos de demostración**

- **FR-029**: El sistema MUST arrancar con datos de ejemplo: al menos 2 organizadores, 3 compradores,
  eventos en distintas categorías con fechas relativas al momento de arranque (uno que empieza en unos 20
  minutos, uno mañana, uno dentro de 20 días y varios ya pasados con compras UTILIZADAS y reseñas).

### Key Entities

- **Usuario**: persona que inicia sesión; tiene nombre, apellido y un rol fijo (Comprador u Organizador).
  Los compradores tienen una lista de eventos favoritos.
- **Categoria**: agrupación temática de eventos, con nombre y descripción.
- **Evento**: espectáculo publicado por un organizador; tiene nombre, descripción, categoría, fecha y hora,
  material multimedia (enlaces) y uno o más tipos de entrada.
- **TipoEntrada**: variante de entrada de un evento (por ejemplo General, Platea, VIP) con nombre,
  descripción, precio y cupo total; permite saber si hay cupo para una cantidad dada.
- **Compra**: adquisición de una cantidad de entradas de un tipo por un comprador; tiene total, estado y su
  conversación.
- **CambioEstadoCompra**: registro de cada cambio de estado de una compra: estado, quién y cuándo.
- **Mensaje**: texto enviado dentro de una compra por su comprador o por el organizador, con hora de envío.
- **Resenia**: calificación de un comprador sobre un evento tras una compra UTILIZADA: puntaje entero de 1 a
  5 y comentario; una por compra. Alimenta el puntaje del organizador.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un comprador con los datos de ejemplo puede, desde el inicio de sesión, encontrar un evento,
  comprar entradas y confirmar el pago en menos de 2 minutos sin ayuda.
- **SC-002**: Ante 50 solicitudes de compra simultáneas sobre un tipo de entrada con cupo 10, exactamente 10
  se aceptan y 40 se rechazan por falta de cupo, en el 100% de las ejecuciones.
- **SC-003**: El 100% de las transiciones de estado no permitidas (por ejemplo cancelar una compra UTILIZADA
  o pagar una compra CANCELADA) son rechazadas con un mensaje que explica el motivo.
- **SC-004**: El 100% de los cambios de estado de compra quedan registrados con quién y cuándo.
- **SC-005**: Las búsquedas, filtros y ordenamientos sobre los datos de ejemplo responden de forma que el
  comprador percibe como inmediata (menos de 1 segundo).
- **SC-006**: Un mensaje enviado en el chat es visible para la otra parte en menos de 10 segundos sin que
  esta realice ninguna acción manual.
- **SC-007**: Una compra PENDIENTE sin pagar libera su cupo dentro de 1 minuto posterior a cumplir los 15
  minutos de vida.
- **SC-008**: El flujo completo de la demo (comprar → pagar → chat → cancelar o reseñar) puede recorrerse de
  punta a punta con los datos de ejemplo sin preparar datos manualmente.
- **SC-009**: Cada uno de los 12 casos de uso de la consigna, más favoritos, es demostrable con al menos un
  escenario de aceptación verificable de esta especificación.

## Assumptions

- Los usuarios existen de antemano en los datos de ejemplo; el registro de cuentas nuevas está fuera del
  alcance. Cada usuario tiene un único rol fijo.
- El pago es completamente simulado (sin dinero ni pasarela real); el resultado depende únicamente del medio
  de pago simulado elegido, sin azar. El reembolso también es simulado: solo cambia el estado.
- Los datos viven únicamente en memoria: al reiniciar, vuelven a los datos de ejemplo. No hay recuperación
  de datos entre ejecuciones.
- Una compra es por un único tipo de entrada; para varios tipos se realizan varias compras.
- Las entradas no tienen código QR ni validación en puerta: UTILIZADA la marca el organizador a mano o el
  sistema automáticamente 24 horas después del inicio del evento (plazo configurable).
- Limitación conocida: el sistema no modela eventos cancelados a último momento ni cortados a mitad. Con el
  pasaje automático, los compradores de un evento así quedarían con compras UTILIZADA, sin reembolso y con
  derecho a reseñar. Queda como mejora futura (por ejemplo, cancelación de evento por el organizador con
  reembolso masivo) y se registra en `docs/ai-log.md`.
- Los eventos no se editan ni se cancelan una vez publicados; modificar o eliminar eventos está fuera del
  alcance.
- El límite de cancelación (30 minutos) y la expiración de compras pendientes (15 minutos) son valores
  configurables con esos valores por defecto. El límite de 30 minutos es una decisión propia del autor
  (la consigna solo exige que el evento aún no se haya realizado) y se justifica en `docs/ai-log.md`.
- Las fechas y los "días que faltan" se calculan en días calendario según la hora local del servidor.
- Se usa una sola moneda, sin conversión ni impuestos. Los precios se muestran con dos decimales.
- Los enlaces multimedia se muestran tal cual; no se suben ni se procesan archivos.
- La aplicación se usa desde un dispositivo móvil conectado en red local al servidor; el diseño visual
  debe estar pensado para pantallas móviles.
- Los requisitos técnicos (tecnologías, persistencia, ejecución local y herramientas permitidas) se
  definen en el plan, conforme a la constitution del proyecto.
