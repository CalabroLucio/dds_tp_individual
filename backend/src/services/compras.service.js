import { randomUUID } from 'node:crypto';
import { compraAbierta } from '../domain/evento.js';
import {
  crearCompra,
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

  return {
    obtener,
    cancelarSiVencio,

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
