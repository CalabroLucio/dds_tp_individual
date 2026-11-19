import { errores } from '../errors/index.js';
import { diasCalendario, minutosEntre, sumarHoras, sumarMinutos } from '../utils/fechas.js';

// Máquina de estados de Compra (data-model.md §Máquina de estados; FR-014).
const TRANSICIONES = {
  PENDIENTE: ['CONFIRMADA', 'CANCELADA'],
  CONFIRMADA: ['REEMBOLSADA', 'UTILIZADA'],
  UTILIZADA: [],
  CANCELADA: [],
  REEMBOLSADA: [],
};

const ROTULOS = {
  PENDIENTE: 'pendiente de pago',
  CONFIRMADA: 'confirmada',
  UTILIZADA: 'utilizada',
  CANCELADA: 'cancelada',
  REEMBOLSADA: 'reembolsada',
};

export const rotuloEstado = (estado) => ROTULOS[estado];
export const esFinal = (estado) => TRANSICIONES[estado].length === 0;
export const puedeTransicionar = (desde, hacia) => TRANSICIONES[desde].includes(hacia);

// data-model.md · CambioEstadoCompra.quien: { tipo, id, nombre }.
export const QUIEN_SISTEMA = Object.freeze({ tipo: 'SISTEMA', id: null, nombre: null });
export const quienDe = (usuario) => ({
  tipo: usuario.rol,
  id: usuario.id,
  nombre: `${usuario.nombre} ${usuario.apellido}`,
});

const redondearMonto = (monto) => Math.round(monto * 100) / 100;

// data-model.md · Compra.total (precio × cantidad, fijado al crear), Compra.estado (nace PENDIENTE) y
// Compra.expiraEn (creadaEn + 15 min). El historial guarda cada CambioEstadoCompra desde el inicial.
export function crearCompra({ id, comprador, evento, tipoEntrada, cantidad, ahora, reglas }) {
  return {
    id,
    compradorId: comprador.id,
    eventoId: evento.id,
    tipoEntradaId: tipoEntrada.id,
    cantidad,
    total: redondearMonto(tipoEntrada.precio * cantidad),
    estado: 'PENDIENTE',
    creadaEn: ahora,
    expiraEn: sumarMinutos(ahora, reglas.EXPIRACION_PENDIENTE_MIN),
    historial: [{ estado: 'PENDIENTE', quien: quienDe(comprador), fechaHora: ahora }],
    mensajes: [],
  };
}

export function transicionar(compra, hacia, quien, ahora) {
  if (!puedeTransicionar(compra.estado, hacia)) {
    throw errores.estadoInvalido(
      `La compra está ${rotuloEstado(compra.estado)} y no puede pasar a ${rotuloEstado(hacia)}`,
    );
  }
  compra.estado = hacia;
  compra.historial.push({ estado: hacia, quien, fechaHora: ahora });
  return compra;
}

export const estaVencida = (compra, ahora) =>
  compra.estado === 'PENDIENTE' && ahora.getTime() >= compra.expiraEn.getTime();

// Faltan más de LIMITE_CANCELACION_MIN minutos para el evento (FR-020).
export const dentroDelPlazoDeCancelacion = (evento, ahora, reglas) =>
  minutosEntre(ahora, evento.fecha) > reglas.LIMITE_CANCELACION_MIN;

// Desde LIMITE_CANCELACION_MIN minutos antes del evento se habilita marcar como UTILIZADA (FR-022).
export const habilitadaParaUtilizar = (evento, ahora, reglas) =>
  minutosEntre(ahora, evento.fecha) <= reglas.LIMITE_CANCELACION_MIN;

// Si nadie la marcó, una CONFIRMADA pasa sola a UTILIZADA 24 h después del inicio (clarificación 2).
export const autoUtilizable = (compra, evento, ahora, reglas) =>
  compra.estado === 'CONFIRMADA' &&
  ahora.getTime() >= sumarHoras(evento.fecha, reglas.AUTO_UTILIZADA_HORAS).getTime();

// Seguimiento (FR-018): días calendario hasta el evento solo en CONFIRMADA y antes de que empiece.
export function seguimiento(compra, evento, ahora) {
  const confirmada = compra.estado === 'CONFIRMADA';
  const empezo = ahora.getTime() >= evento.fecha.getTime();
  return {
    diasParaEvento: confirmada && !empezo ? diasCalendario(ahora, evento.fecha) : null,
    eventoRealizado: confirmada && empezo,
  };
}

// Qué puede hacer este usuario con esta compra ahora (R15): el front solo muestra lo que viene en true.
export function calcularAcciones(compra, evento, usuario, ahora, reglas, { tieneResenia = false } = {}) {
  const esComprador = usuario?.id === compra.compradorId;
  const esOrganizador = usuario?.id === evento.organizadorId;
  return {
    puedePagar: esComprador && compra.estado === 'PENDIENTE' && !estaVencida(compra, ahora),
    puedeCancelar:
      esComprador &&
      ['PENDIENTE', 'CONFIRMADA'].includes(compra.estado) &&
      !estaVencida(compra, ahora) &&
      dentroDelPlazoDeCancelacion(evento, ahora, reglas),
    puedeMarcarUtilizada:
      esOrganizador && compra.estado === 'CONFIRMADA' && habilitadaParaUtilizar(evento, ahora, reglas),
    puedeResenar: esComprador && compra.estado === 'UTILIZADA' && !tieneResenia,
  };
}
