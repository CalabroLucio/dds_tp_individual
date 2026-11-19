const MS_POR_MINUTO = 60_000;
const MS_POR_DIA = 86_400_000;

export const sumarMinutos = (fecha, minutos) => new Date(fecha.getTime() + minutos * MS_POR_MINUTO);
export const sumarHoras = (fecha, horas) => sumarMinutos(fecha, horas * 60);
export const minutosEntre = (desde, hasta) => (hasta.getTime() - desde.getTime()) / MS_POR_MINUTO;

// Días calendario entre dos instantes según la zona horaria del proceso (TZ, por defecto Buenos Aires; R13).
// Se comparan las fechas locales, no bloques de 24 horas: 23:50 → 00:10 del día siguiente es 1 día.
export function diasCalendario(desde, hasta) {
  const diaLocal = (fecha) => Date.UTC(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
  return Math.round((diaLocal(hasta) - diaLocal(desde)) / MS_POR_DIA);
}
