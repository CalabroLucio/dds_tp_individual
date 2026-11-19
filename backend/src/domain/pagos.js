// Pago simulado y determinista (clarificación 1, R19): como las "tarjetas de prueba" de una pasarela real,
// el resultado depende solo del medio elegido. No hay azar ni dinero.
export const MEDIOS_PAGO = Object.freeze([
  { id: 'TARJETA_VISA', nombre: 'Tarjeta Visa de prueba', aprueba: true },
  { id: 'TARJETA_MASTERCARD', nombre: 'Tarjeta Mastercard de prueba', aprueba: true },
  { id: 'DINERO_EN_CUENTA', nombre: 'Dinero en cuenta de prueba', aprueba: true },
  { id: 'TARJETA_RECHAZADA', nombre: 'Tarjeta rechazada (siempre falla)', aprueba: false },
]);

export const IDS_MEDIOS_PAGO = MEDIOS_PAGO.map((m) => m.id);

export function procesarPago(medioPagoId) {
  const medio = MEDIOS_PAGO.find((m) => m.id === medioPagoId);
  return { aprobado: Boolean(medio?.aprueba), medio };
}
