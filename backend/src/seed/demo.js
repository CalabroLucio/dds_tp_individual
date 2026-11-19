import { randomUUID } from 'node:crypto';
import { crearCompra, quienDe, transicionar } from '../domain/compra.js';
import { sumarHoras, sumarMinutos } from '../utils/fechas.js';

// Datos de demostración (FR-029) con fechas relativas al arranque, para que el flujo del video funcione siempre:
// un evento que empieza en ~20 minutos, uno mañana, uno en 20 días y eventos pasados con reseñas.
// Se cargan directo en los repositorios: las reglas de alta (fecha futura) no aplican a datos históricos.

const imagen = (semilla) => `https://picsum.photos/seed/${semilla}/800/450`;

function mananaALas(ahora, hora) {
  const fecha = new Date(ahora);
  fecha.setDate(fecha.getDate() + 1);
  fecha.setHours(hora, 0, 0, 0);
  return fecha;
}

function enDiasALas(ahora, dias, hora) {
  const fecha = new Date(ahora);
  fecha.setDate(fecha.getDate() + dias);
  fecha.setHours(hora, 0, 0, 0);
  return fecha;
}

export function cargarSeedDemo(contexto, { categorias, usuarios }) {
  const { repos, reloj, reglas } = contexto;
  const ahora = reloj.ahora();
  const { martina, joaquin, ana, bruno, carla } = usuarios;

  function evento(organizador, categoria, datos) {
    return repos.eventos.guardar({
      id: randomUUID(),
      organizadorId: organizador.id,
      categoriaId: categorias[categoria].id,
      creadoEn: sumarHoras(ahora, -24 * 40),
      multimedia: [],
      ...datos,
      tiposEntrada: datos.tiposEntrada.map(([nombre, precio, cupo, descripcion = '']) => ({
        id: randomUUID(),
        nombre,
        descripcion,
        precio,
        cupo,
      })),
    });
  }

  // Crea una compra con su historial real: pasos = [[estado, usuario|null(sistema), fecha], ...].
  function compra(comprador, ev, indiceTipo, cantidad, creadaEn, pasos = []) {
    const tipoEntrada = ev.tiposEntrada[indiceTipo];
    const nueva = crearCompra({
      id: randomUUID(),
      comprador,
      evento: ev,
      tipoEntrada,
      cantidad,
      ahora: creadaEn,
      reglas,
    });
    const reserva = repos.compras.crearCompraReservandoCupo({ compra: nueva, tipoEntrada });
    if (!reserva.ok) throw new Error(`Seed inválido: sin cupo en ${ev.nombre}`);
    for (const [estado, quien, fecha] of pasos) {
      transicionar(
        nueva,
        estado,
        quien ? quienDe(quien) : { tipo: 'SISTEMA', id: null, nombre: null },
        fecha,
      );
    }
    return nueva;
  }

  const pagada = (comprador, creadaEn) => [['CONFIRMADA', comprador, sumarMinutos(creadaEn, 3)]];

  function resenia(c, puntaje, comentario, creadaEn) {
    repos.resenias.guardar({
      id: randomUUID(),
      compraId: c.id,
      compradorId: c.compradorId,
      eventoId: c.eventoId,
      puntaje,
      comentario,
      creadaEn,
    });
  }

  // --- Martina Ruiz ---
  const rock = evento(martina, 'Música', {
    nombre: 'Noche de Rock Nacional',
    descripcion:
      'Tres bandas, un solo escenario: los clásicos del rock argentino en vivo. Apertura de puertas una hora antes.',
    fecha: sumarMinutos(ahora, 20),
    multimedia: [imagen('rock-nacional'), imagen('escenario')],
    tiposEntrada: [
      ['Campo', 15000, 200, 'De pie, frente al escenario'],
      ['Platea', 28000, 60, 'Asiento numerado'],
    ],
  });
  const standup = evento(martina, 'Stand-up', {
    nombre: 'Risas sin filtro',
    descripcion: 'Cuatro comediantes, una noche de stand-up sin censura. Mayores de 16.',
    fecha: mananaALas(ahora, 21),
    multimedia: [imagen('standup')],
    tiposEntrada: [['General', 9000, 120]],
  });
  const festival = evento(martina, 'Festivales', {
    nombre: 'Festival Verano Indie',
    descripcion: 'Dos días de música independiente al aire libre, food trucks y feria de diseño.',
    fecha: enDiasALas(ahora, 20, 16),
    multimedia: [imagen('festival-indie'), imagen('publico')],
    tiposEntrada: [
      ['Día 1', 25000, 500],
      ['Abono 2 días', 42000, 300],
      ['VIP', 80000, 40, 'Sector preferencial y barra exclusiva'],
    ],
  });
  const tributo = evento(martina, 'Música', {
    nombre: 'Tributo a Soda Stereo',
    descripcion: 'La banda tributo más fiel recorre la discografía completa.',
    fecha: enDiasALas(ahora, -30, 21),
    multimedia: [imagen('soda')],
    tiposEntrada: [['General', 12000, 300]],
  });

  // --- Joaquín Pérez ---
  const clasico = evento(joaquin, 'Deportes', {
    nombre: 'Clásico de barrio: Atlético vs. Sportivo',
    descripcion: 'El partido más esperado del torneo regional. Llegá temprano.',
    fecha: enDiasALas(ahora, 5, 17),
    multimedia: [imagen('futbol')],
    tiposEntrada: [
      ['Popular', 6000, 800],
      ['Platea', 12000, 300],
    ],
  });
  const hamlet = evento(joaquin, 'Teatro', {
    nombre: 'Hamlet',
    descripcion: 'Versión contemporánea del clásico de Shakespeare, con elenco joven.',
    fecha: enDiasALas(ahora, 8, 20),
    multimedia: [imagen('teatro')],
    tiposEntrada: [
      ['Platea', 18000, 150],
      ['Pullman', 11000, 100],
    ],
  });
  evento(joaquin, 'Conferencias', {
    nombre: 'IA en el desarrollo de software',
    descripcion:
      'Charla abierta sobre herramientas de IA para programar: ventajas, riesgos y buenas prácticas.',
    fecha: enDiasALas(ahora, 12, 19),
    multimedia: [imagen('conferencia')],
    tiposEntrada: [['Entrada libre', 0, 200, 'Gratuita con inscripción']],
  });
  const jazz = evento(joaquin, 'Música', {
    nombre: 'Jazz en el Patio',
    descripcion: 'Cuarteto de jazz en un patio con mesas, bajo las estrellas.',
    fecha: enDiasALas(ahora, -10, 21),
    multimedia: [imagen('jazz')],
    tiposEntrada: [['Mesa', 8000, 80]],
  });

  // Evento en ~20 minutos: compras CONFIRMADAS para mostrar "Marcar como utilizada" y la ventana no cancelable.
  const hace2dias = sumarHoras(ahora, -48);
  compra(ana, rock, 0, 2, hace2dias, pagada(ana, hace2dias));
  compra(bruno, rock, 1, 1, sumarHoras(ahora, -30), pagada(bruno, sumarHoras(ahora, -30)));

  // Mañana: compra CONFIRMADA de Ana (se puede cancelar con reembolso) con una conversación iniciada.
  const ayer = sumarHoras(ahora, -20);
  const anaStandup = compra(ana, standup, 0, 2, ayer, pagada(ana, ayer));
  anaStandup.mensajes.push(
    {
      id: randomUUID(),
      autorId: ana.id,
      texto: '¡Hola! ¿Hay que llevar el DNI para entrar?',
      enviadoEn: sumarHoras(ayer, 1),
    },
    {
      id: randomUUID(),
      autorId: martina.id,
      texto: 'Hola Ana, sí: DNI y la entrada en el celular.',
      enviadoEn: sumarHoras(ayer, 2),
    },
  );
  compra(carla, standup, 0, 1, sumarHoras(ahora, -6), [
    ['CONFIRMADA', carla, sumarHoras(ahora, -6)],
    ['REEMBOLSADA', carla, sumarHoras(ahora, -2)],
  ]);

  // Próximos días: variedad de estados.
  compra(bruno, festival, 1, 2, sumarHoras(ahora, -72), pagada(bruno, sumarHoras(ahora, -72)));
  compra(carla, clasico, 0, 4, sumarHoras(ahora, -26), pagada(carla, sumarHoras(ahora, -26)));
  compra(ana, hamlet, 0, 2, sumarHoras(ahora, -90), [['CANCELADA', null, sumarHoras(ahora, -89.75)]]);

  // Eventos pasados: compras UTILIZADAS (por el organizador o por el sistema) y reseñas → puntajes distintos.
  const antesTributo = sumarHoras(tributo.fecha, -24 * 7);
  const anaTributo = compra(ana, tributo, 0, 2, antesTributo, [
    ...pagada(ana, antesTributo),
    ['UTILIZADA', martina, sumarMinutos(tributo.fecha, -10)],
  ]);
  const brunoTributo = compra(bruno, tributo, 0, 1, antesTributo, [
    ...pagada(bruno, antesTributo),
    ['UTILIZADA', null, sumarHoras(tributo.fecha, reglas.AUTO_UTILIZADA_HORAS)],
  ]);
  resenia(
    anaTributo,
    5,
    'Impecable: sonido, puntualidad y una banda increíble.',
    sumarHoras(tributo.fecha, 26),
  );
  resenia(brunoTributo, 4, 'Muy buen show, la entrada fue un poco lenta.', sumarHoras(tributo.fecha, 30));

  const antesJazz = sumarHoras(jazz.fecha, -24 * 3);
  const carlaJazz = compra(carla, jazz, 0, 2, antesJazz, [
    ...pagada(carla, antesJazz),
    ['UTILIZADA', joaquin, sumarMinutos(jazz.fecha, -5)],
  ]);
  const anaJazz = compra(ana, jazz, 0, 1, antesJazz, [
    ...pagada(ana, antesJazz),
    ['UTILIZADA', joaquin, sumarMinutos(jazz.fecha, -15)],
  ]);
  resenia(carlaJazz, 3, 'Linda música, pero hacía frío y faltaban mesas.', sumarHoras(jazz.fecha, 20));
  resenia(anaJazz, 4, 'Muy lindo ambiente.', sumarHoras(jazz.fecha, 22));

  // Favoritos de Ana.
  repos.usuarios.agregarFavorito(ana.id, festival.id);
  repos.usuarios.agregarFavorito(ana.id, hamlet.id);

  return { eventos: repos.eventos.listar().length, compras: repos.compras.listar().length };
}
