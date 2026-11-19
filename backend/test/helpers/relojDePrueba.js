// Reloj controlable para tests: el dominio nunca llama a Date.now(), siempre recibe `ahora` (R10).
export function crearRelojDePrueba(inicial = new Date('2026-12-01T15:00:00-03:00')) {
  let actual = new Date(inicial);
  return {
    ahora: () => new Date(actual),
    fijar: (fecha) => {
      actual = new Date(fecha);
    },
    avanzarMinutos: (minutos) => {
      actual = new Date(actual.getTime() + minutos * 60_000);
    },
    avanzarHoras: (horas) => {
      actual = new Date(actual.getTime() + horas * 3_600_000);
    },
  };
}
