// Cuerpos de solicitud válidos para los tests; cada test cambia solo lo que prueba.
export function nuevoEventoValido(categoriaId, ahora, cambios = {}) {
  return {
    nombre: 'Recital de Rock Nacional',
    descripcion: 'Una noche con las mejores bandas del rock argentino.',
    categoriaId,
    fecha: new Date(ahora.getTime() + 10 * 24 * 3_600_000).toISOString(),
    multimedia: ['https://picsum.photos/seed/rock/800/450'],
    tiposEntrada: [
      { nombre: 'General', descripcion: 'Campo', precio: 15000, cupo: 100 },
      { nombre: 'VIP', descripcion: 'Cerca del escenario', precio: 40000, cupo: 20 },
    ],
    ...cambios,
  };
}
