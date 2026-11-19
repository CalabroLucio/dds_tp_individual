// Puntaje del organizador = promedio de las reseñas de sus eventos, con un decimal; null sin reseñas (FR-027).
export function promedioPuntaje(resenias) {
  if (resenias.length === 0) return null;
  const suma = resenias.reduce((total, r) => total + r.puntaje, 0);
  return Math.round((suma / resenias.length) * 10) / 10;
}
