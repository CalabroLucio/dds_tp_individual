import { randomUUID } from 'node:crypto';
import { compraAbierta } from '../domain/evento.js';
import {
  crearCompra,
  dentroDelPlazoDeCancelacion,
  esFinal,
  estaVencida,
  QUIEN_SISTEMA,
  quienDe,
  rotuloEstado,
  transicionar,
} from '../domain/compra.js';
import { MEDIOS_PAGO, procesarPago } from '../domain/pagos.js';
import { errores } from '../errors/index.js';

export function crearComprasService({ repos, reloj, reglas, presentacion }) {
  function obtener(compraId) {
    const compra = repos.compras.porId(compraId);
    if (!compra) throw errores.noEncontrado('La compra');
    return compra;
  }

  function obtenerDelComprador(compraId, usuario) {
    const compra = obtener(compraId);
    if (compra.compradorId !== usuario.id) throw errores.noAutorizado('Esta compra no es tuya');
    return compra;
  }

  // Una PENDIENTE vencida se cancela en el momento aunque el job todavía no haya pasado (análisis U1).
  function cancelarSiVencio(compra, ahora) {
    if (!estaVencida(compra, ahora)) return false;
    transicionar(compra, 'CANCELADA', QUIEN_SISTEMA, ahora);
    return true;
  }

  // Comprador de la compra u organizador del evento: los únicos que pueden verla (FR-002).
  function obtenerComoParticipante(compraId, usuario) {
    const compra = obtener(compraId);
    const evento = repos.eventos.porId(compra.eventoId);
    if (compra.compradorId !== usuario.id && evento.organizadorId !== usuario.id) {
      throw errores.noAutorizado('Solo el comprador y el organizador del evento pueden ver esta compra');
    }
    return compra;
  }

  return {
    obtener,
    obtenerComoParticipante,
    cancelarSiVencio,

    listarMias(usuario) {
      const ahora = reloj.ahora();
      return repos.compras
        .listarPorComprador(usuario.id)
        .map((c) => {
          cancelarSiVencio(c, ahora);
          return c;
        })
        .sort((a, b) => b.creadaEn - a.creadaEn)
        .map((c) => presentacion.compra(c, usuario));
    },

    detalle(usuario, compraId) {
      const compra = obtenerComoParticipante(compraId, usuario);
      cancelarSiVencio(compra, reloj.ahora());
      return presentacion.compraDetalle(compra, usuario);
    },

    mediosPago: () => MEDIOS_PAGO.map(({ id, nombre }) => ({ id, nombre })),

    crearCompra(usuario, { eventoId, tipoEntradaId, cantidad }) {
      const ahora = reloj.ahora();
      const evento = repos.eventos.porId(eventoId);
      if (!evento) throw errores.noEncontrado('El evento');

      // Roles fijos: un organizador nunca compra; si es su propio evento se le explica el motivo (FR-012).
      if (usuario.rol !== 'COMPRADOR') {
        throw evento.organizadorId === usuario.id
          ? errores.organizadorNoPuedeComprar()
          : errores.rolNoPermitido();
      }

      const tipoEntrada = evento.tiposEntrada.find((t) => t.id === tipoEntradaId);
      if (!tipoEntrada) throw errores.noEncontrado('El tipo de entrada');
      if (!compraAbierta(evento, ahora)) throw errores.eventoNoDisponible();
      if (cantidad > reglas.MAX_ENTRADAS_POR_COMPRA) {
        throw errores.cantidadExcedeMaximo(reglas.MAX_ENTRADAS_POR_COMPRA);
      }

      const compra = crearCompra({
        id: randomUUID(),
        comprador: usuario,
        evento,
        tipoEntrada,
        cantidad,
        ahora,
        reglas,
      });
      const reserva = repos.compras.crearCompraReservandoCupo({ compra, tipoEntrada });
      if (!reserva.ok) throw errores.cupoInsuficiente(reserva.disponible);
      return presentacion.compra(compra, usuario);
    },

    // FR-020/FR-021: el plazo se valida en el momento del pedido, no con un proceso periódico.
    cancelar(usuario, compraId) {
      const ahora = reloj.ahora();
      const compra = obtenerDelComprador(compraId, usuario);
      const evento = repos.eventos.porId(compra.eventoId);
      // Si ya había vencido, quedó CANCELADA por el sistema: el pedido se cumple igual.
      if (cancelarSiVencio(compra, ahora)) return presentacion.compra(compra, usuario);
      if (esFinal(compra.estado)) {
        throw errores.estadoInvalido(
          `La compra está ${rotuloEstado(compra.estado)} y ya no se puede cancelar`,
        );
      }
      if (!dentroDelPlazoDeCancelacion(evento, ahora, reglas)) {
        throw errores.fueraDePlazo(reglas.LIMITE_CANCELACION_MIN);
      }
      const destino = compra.estado === 'PENDIENTE' ? 'CANCELADA' : 'REEMBOLSADA';
      transicionar(compra, destino, quienDe(usuario), ahora);
      return presentacion.compra(compra, usuario);
    },

    pagar(usuario, compraId, medioPago) {
      const ahora = reloj.ahora();
      const compra = obtenerDelComprador(compraId, usuario);
      if (cancelarSiVencio(compra, ahora)) {
        throw errores.estadoInvalido(
          'La compra venció: pasaron 15 minutos sin pago y las entradas se liberaron. Podés volver a comprar',
        );
      }
      if (compra.estado !== 'PENDIENTE') {
        throw errores.estadoInvalido(`La compra está ${rotuloEstado(compra.estado)} y no se puede pagar`);
      }
      const resultado = procesarPago(medioPago);
      if (!resultado.aprobado) throw errores.pagoRechazado(resultado.medio.nombre);

      transicionar(compra, 'CONFIRMADA', quienDe(usuario), ahora);
      return presentacion.compra(compra, usuario);
    },
  };
}
