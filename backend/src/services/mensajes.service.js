import { randomUUID } from 'node:crypto';

// Chat dentro de la compra (FR-023 a FR-025): solo comprador y organizador del evento, en cualquier estado.
export function crearMensajesService({ repos, reloj, comprasService }) {
  function serializar(mensaje) {
    const autor = repos.usuarios.porId(mensaje.autorId);
    return {
      id: mensaje.id,
      autor: { id: autor.id, nombre: autor.nombre, apellido: autor.apellido, rol: autor.rol },
      texto: mensaje.texto,
      enviadoEn: mensaje.enviadoEn.toISOString(),
    };
  }

  return {
    listar(usuario, compraId, { desde } = {}) {
      const compra = comprasService.obtenerComoParticipante(compraId, usuario);
      return compra.mensajes.filter((m) => !desde || m.enviadoEn.getTime() > desde.getTime()).map(serializar);
    },

    enviar(usuario, compraId, texto) {
      const compra = comprasService.obtenerComoParticipante(compraId, usuario);
      const mensaje = { id: randomUUID(), autorId: usuario.id, texto, enviadoEn: reloj.ahora() };
      compra.mensajes.push(mensaje);
      return serializar(mensaje);
    },
  };
}
