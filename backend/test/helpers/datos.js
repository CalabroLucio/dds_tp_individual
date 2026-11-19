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

// Inserta un evento directamente con el servicio (como lo haría el organizador desde la app).
export function publicarEvento(entorno, organizadorEmail, cambios = {}) {
  const organizador = entorno.contexto.repos.usuarios.buscarPorEmail(organizadorEmail);
  const categoriaId = cambios.categoriaId ?? entorno.datos.categorias['Música'].id;
  const datos = nuevoEventoValido(categoriaId, entorno.reloj.ahora(), cambios);
  return entorno.contexto.services.eventos.crear(organizador, {
    ...datos,
    fecha: new Date(datos.fecha),
    tiposEntrada: datos.tiposEntrada.map((t) => ({ descripcion: '', ...t })),
  });
}

// Carga una reseña directamente en el store (para preparar puntajes de organizador).
export function agregarResenia(
  entorno,
  { eventoId, compradorEmail = 'ana@tickets.test', puntaje, comentario = 'Muy bueno' },
) {
  const comprador = entorno.contexto.repos.usuarios.buscarPorEmail(compradorEmail);
  const id = crypto.randomUUID();
  entorno.contexto.store.resenias.set(id, {
    id,
    compraId: crypto.randomUUID(),
    compradorId: comprador.id,
    eventoId,
    puntaje,
    comentario,
    creadaEn: entorno.reloj.ahora(),
  });
}

export const enDias = (entorno, dias) =>
  new Date(entorno.reloj.ahora().getTime() + dias * 24 * 3_600_000).toISOString();
