// Formatos de presentación (solo cómo se muestra; los cálculos los hace el backend).
const moneda = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 2,
});

export function formatearPrecio(valor) {
  return valor === 0 ? 'Gratis' : moneda.format(valor);
}

export function formatearFecha(iso) {
  const fecha = new Date(iso);
  const dia = fecha.toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' });
  const hora = fecha.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false });
  return `${dia} · ${hora} h`;
}

export function formatearFechaHoraCorta(iso) {
  const fecha = new Date(iso);
  return fecha.toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

// Seguimiento de la compra con los datos que calcula el backend (diasParaEvento, eventoRealizado).
export function textoSeguimiento(compra) {
  if (compra.eventoRealizado) return 'Evento realizado';
  if (compra.diasParaEvento === null || compra.diasParaEvento === undefined) return null;
  if (compra.diasParaEvento === 0) return '¡Es hoy!';
  return compra.diasParaEvento === 1 ? 'Falta 1 día' : `Faltan ${compra.diasParaEvento} días`;
}

// Traduce el `campo` de un detalle de validación del backend a un texto para el usuario.
const ROTULOS = {
  nombre: 'Nombre',
  descripcion: 'Descripción',
  categoriaId: 'Categoría',
  fecha: 'Fecha',
  multimedia: 'Imágenes',
  tiposEntrada: 'Tipos de entrada',
  precio: 'Precio',
  cupo: 'Cupo',
  cantidad: 'Cantidad',
  texto: 'Mensaje',
  puntaje: 'Puntaje',
  comentario: 'Comentario',
};

export function describirCampo(campo = '') {
  const partes = campo.split('.');
  if (partes[0] === 'tiposEntrada' && partes.length === 3) {
    return `Tipo de entrada ${Number(partes[1]) + 1} · ${ROTULOS[partes[2]] ?? partes[2]}`;
  }
  if (partes[0] === 'multimedia' && partes.length === 2) return `Imagen ${Number(partes[1]) + 1}`;
  return ROTULOS[partes[0]] ?? campo;
}

// Partes de la fecha para el talón de las entradas: VIE / 20 / NOV / 21:00 (solo presentación).
export function partesFecha(iso) {
  const fecha = new Date(iso);
  const limpiar = (texto) => texto.replace('.', '').toUpperCase();
  return {
    dia: limpiar(fecha.toLocaleDateString('es-AR', { weekday: 'short' })),
    numero: String(fecha.getDate()),
    mes: limpiar(fecha.toLocaleDateString('es-AR', { month: 'short' })),
    hora: fecha.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false }),
  };
}

// Código corto y legible para mostrar en la entrada (derivado del id de la compra).
export const codigoCompra = (id) =>
  `#${id
    .replace(/-/g, '')
    .slice(0, 8)
    .toUpperCase()
    .replace(/(.{4})/, '$1-')}`;
