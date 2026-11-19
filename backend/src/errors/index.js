import { ErrorApp } from './ErrorApp.js';

export { ErrorApp };

// Un constructor por código del contrato (R14). Los mensajes están listos para mostrarse al usuario.
export const errores = {
  validacion: (detalles, mensaje = 'Hay datos inválidos en la solicitud') =>
    new ErrorApp('VALIDACION', mensaje, 400, detalles),

  noAutenticado: (mensaje = 'Iniciá sesión para continuar') => new ErrorApp('NO_AUTENTICADO', mensaje, 401),
  credencialesInvalidas: () => new ErrorApp('CREDENCIALES_INVALIDAS', 'Email o contraseña incorrectos', 401),

  pagoRechazado: (medio) =>
    new ErrorApp(
      'PAGO_RECHAZADO',
      `El pago con ${medio} fue rechazado. La compra sigue pendiente: podés reintentar con otro medio de pago`,
      402,
    ),

  rolNoPermitido: () => new ErrorApp('ROL_NO_PERMITIDO', 'Tu rol no permite realizar esta acción', 403),
  noAutorizado: (mensaje = 'No tenés acceso a este recurso') => new ErrorApp('NO_AUTORIZADO', mensaje, 403),
  organizadorNoPuedeComprar: () =>
    new ErrorApp('ORGANIZADOR_NO_PUEDE_COMPRAR', 'No podés comprar entradas de tus propios eventos', 403),

  noEncontrado: (recurso = 'El recurso') => new ErrorApp('NO_ENCONTRADO', `${recurso} no existe`, 404),
  rutaInexistente: () => new ErrorApp('RUTA_INEXISTENTE', 'La ruta solicitada no existe', 404),

  cupoInsuficiente: (disponible) =>
    new ErrorApp(
      'CUPO_INSUFICIENTE',
      disponible === 0
        ? 'No quedan entradas de este tipo'
        : `Solo quedan ${disponible} entradas de este tipo`,
      409,
    ),
  cantidadExcedeMaximo: (maximo) =>
    new ErrorApp('CANTIDAD_EXCEDE_MAXIMO', `El máximo por compra es de ${maximo} entradas`, 409),
  eventoNoDisponible: () =>
    new ErrorApp('EVENTO_NO_DISPONIBLE', 'El evento ya comenzó y no admite nuevas compras', 409),
  estadoInvalido: (mensaje) => new ErrorApp('ESTADO_INVALIDO', mensaje, 409),
  fueraDePlazo: (minutos) =>
    new ErrorApp(
      'FUERA_DE_PLAZO',
      `Ya no se puede cancelar: el límite es ${minutos} minutos antes del evento`,
      409,
    ),
  aunNoHabilitada: (minutos) =>
    new ErrorApp(
      'AUN_NO_HABILITADA',
      `Las entradas se pueden marcar como utilizadas desde ${minutos} minutos antes del evento`,
      409,
    ),
  yaReseniada: () => new ErrorApp('YA_RESENIADA', 'Ya dejaste una reseña para esta compra', 409),
};
