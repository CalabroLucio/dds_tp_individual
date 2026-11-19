// Normalización para búsquedas: minúsculas y sin tildes (R12).
export function normalizar(texto) {
  return String(texto ?? '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();
}

export function contiene(texto, buscado) {
  return normalizar(texto).includes(normalizar(buscado));
}
