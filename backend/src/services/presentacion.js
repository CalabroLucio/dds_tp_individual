import { avisoNoCancelable, compraAbierta, cupoDisponible, precioDesde } from '../domain/evento.js';
import { promedioPuntaje } from '../domain/puntaje.js';
import { calcularAcciones, seguimiento } from '../domain/compra.js';

// Traduce entidades del dominio a la forma del contrato (contracts/openapi.yaml). No decide reglas:
// usa las funciones del dominio para los campos derivados (R15).
export function crearPresentacion({ repos, reloj, reglas }) {
  const persona = (usuario) => ({ id: usuario.id, nombre: usuario.nombre, apellido: usuario.apellido });

  const categoria = (c) => ({ id: c.id, nombre: c.nombre, descripcion: c.descripcion });

  function reseniasDeOrganizador(organizadorId) {
    const eventoIds = repos.eventos.listarPorOrganizador(organizadorId).map((e) => e.id);
    return repos.resenias.listarPorEventos(eventoIds);
  }

  function resenia(r) {
    const evento = repos.eventos.porId(r.eventoId);
    return {
      id: r.id,
      compraId: r.compraId,
      comprador: persona(repos.usuarios.porId(r.compradorId)),
      evento: { id: evento.id, nombre: evento.nombre },
      puntaje: r.puntaje,
      comentario: r.comentario,
      creadaEn: r.creadaEn.toISOString(),
    };
  }

  function organizadorResumen(organizadorId, resenias = reseniasDeOrganizador(organizadorId)) {
    const organizador = repos.usuarios.porId(organizadorId);
    return {
      ...persona(organizador),
      puntaje: promedioPuntaje(resenias),
      cantidadResenias: resenias.length,
    };
  }

  function tipoEntrada(tipo, compras) {
    const disponible = cupoDisponible(tipo, compras);
    return {
      id: tipo.id,
      nombre: tipo.nombre,
      descripcion: tipo.descripcion,
      precio: tipo.precio,
      cupoTotal: tipo.cupo,
      cupoDisponible: disponible,
      agotado: disponible === 0,
    };
  }

  const esFavorito = (evento, usuario) =>
    usuario?.rol === 'COMPRADOR' && Boolean(usuario.favoritos?.has(evento.id));

  function eventoResumen(evento, usuario) {
    return {
      id: evento.id,
      nombre: evento.nombre,
      categoria: categoria(repos.categorias.porId(evento.categoriaId)),
      fecha: evento.fecha.toISOString(),
      imagenPrincipal: evento.multimedia[0] ?? null,
      precioDesde: precioDesde(evento),
      organizador: organizadorResumen(evento.organizadorId),
      esFavorito: esFavorito(evento, usuario),
    };
  }

  function eventoDetalle(evento, usuario) {
    const ahora = reloj.ahora();
    const compras = repos.compras.listarPorEvento(evento.id);
    const resenias = reseniasDeOrganizador(evento.organizadorId);
    return {
      id: evento.id,
      nombre: evento.nombre,
      descripcion: evento.descripcion,
      categoria: categoria(repos.categorias.porId(evento.categoriaId)),
      fecha: evento.fecha.toISOString(),
      multimedia: [...evento.multimedia],
      tiposEntrada: evento.tiposEntrada.map((t) => tipoEntrada(t, compras)),
      organizador: { ...organizadorResumen(evento.organizadorId, resenias), resenias: resenias.map(resenia) },
      esFavorito: esFavorito(evento, usuario),
      compraAbierta: compraAbierta(evento, ahora),
      avisoNoCancelable: avisoNoCancelable(evento, ahora, reglas.LIMITE_CANCELACION_MIN),
      maxEntradasPorCompra: reglas.MAX_ENTRADAS_POR_COMPRA,
    };
  }

  function compra(c, usuario) {
    const ahora = reloj.ahora();
    const evento = repos.eventos.porId(c.eventoId);
    const tipo = evento.tiposEntrada.find((t) => t.id === c.tipoEntradaId);
    const reseniaGuardada = repos.resenias.porCompra(c.id);
    return {
      id: c.id,
      evento: { id: evento.id, nombre: evento.nombre, fecha: evento.fecha.toISOString() },
      tipoEntrada: { id: tipo.id, nombre: tipo.nombre, precio: tipo.precio },
      comprador: persona(repos.usuarios.porId(c.compradorId)),
      cantidad: c.cantidad,
      total: c.total,
      estado: c.estado,
      creadaEn: c.creadaEn.toISOString(),
      expiraEn: c.estado === 'PENDIENTE' ? c.expiraEn.toISOString() : null,
      ...seguimiento(c, evento, ahora),
      acciones: calcularAcciones(c, evento, usuario, ahora, reglas, {
        tieneResenia: Boolean(reseniaGuardada),
      }),
    };
  }

  const cambioEstado = (h) => ({
    estado: h.estado,
    quien: { tipo: h.quien.tipo, id: h.quien.id, nombre: h.quien.nombre },
    fechaHora: h.fechaHora.toISOString(),
  });

  function compraDetalle(c, usuario) {
    const reseniaGuardada = repos.resenias.porCompra(c.id);
    return {
      ...compra(c, usuario),
      historial: c.historial.map(cambioEstado),
      resenia: reseniaGuardada ? resenia(reseniaGuardada) : null,
    };
  }

  return {
    persona,
    categoria,
    resenia,
    organizadorResumen,
    tipoEntrada,
    eventoResumen,
    eventoDetalle,
    compra,
    compraDetalle,
  };
}
