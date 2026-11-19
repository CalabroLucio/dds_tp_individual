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
