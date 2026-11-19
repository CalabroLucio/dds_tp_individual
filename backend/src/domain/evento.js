import { minutosEntre } from '../utils/fechas.js';

// Estados de compra que ocupan cupo (data-model.md · TipoEntrada, derivado cupoDisponible; FR-013).
export const ESTADOS_QUE_OCUPAN_CUPO = new Set(['PENDIENTE', 'CONFIRMADA', 'UTILIZADA']);

export function precioDesde(evento) {
  return Math.min(...evento.tiposEntrada.map((t) => t.precio));
}

export function entradasOcupadas(tipoEntradaId, compras) {
  return compras
    .filter((c) => c.tipoEntradaId === tipoEntradaId && ESTADOS_QUE_OCUPAN_CUPO.has(c.estado))
    .reduce((total, c) => total + c.cantidad, 0);
}

// data-model.md · TipoEntrada.cupo es el cupo total; lo disponible descuenta las compras activas.
export function cupoDisponible(tipoEntrada, compras) {
  return Math.max(0, tipoEntrada.cupo - entradasOcupadas(tipoEntrada.id, compras));
}

export function hayCupoPara(tipoEntrada, compras, cantidad) {
  return cantidad <= cupoDisponible(tipoEntrada, compras);
}

// Se puede comprar hasta el inicio del evento (clarificación 3).
export function compraAbierta(evento, ahora) {
  return ahora.getTime() < evento.fecha.getTime();
}

// Faltan 30 minutos o menos: la compra ya no se podrá cancelar y la app avisa antes de confirmar.
export function avisoNoCancelable(evento, ahora, limiteCancelacionMin) {
  return compraAbierta(evento, ahora) && minutosEntre(ahora, evento.fecha) <= limiteCancelacionMin;
}

// data-model.md · Evento.fecha debe ser futura al crear (FR-004). El resto lo valida el schema de Zod.
export function validarFechaFutura(fecha, ahora) {
  return fecha.getTime() > ahora.getTime();
}
