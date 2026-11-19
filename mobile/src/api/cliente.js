// Cliente HTTP de la app. Las reglas de negocio viven en el backend: acá solo se traduce HTTP ↔ datos
// y se validan las respuestas con Zod (constitution I).
export class ErrorApi extends Error {
  constructor(codigo, mensaje, status, detalles) {
    super(mensaje);
    this.name = 'ErrorApi';
    this.codigo = codigo;
    this.mensaje = mensaje;
    this.status = status;
    this.detalles = detalles;
  }
}

export function crearCliente({ baseUrl, obtenerToken = () => null, alSesionVencida }) {
  async function solicitar(metodo, ruta, { body, schema } = {}) {
    const token = obtenerToken();
    const headers = { Accept: 'application/json' };
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    if (token) headers.Authorization = `Bearer ${token}`;

    let respuesta;
    try {
      respuesta = await fetch(`${baseUrl}${ruta}`, {
        method: metodo,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });
    } catch {
      throw new ErrorApi('SIN_CONEXION', 'No se pudo conectar con el servidor. Revisá tu conexión', 0);
    }

    const texto = await respuesta.text();
    let datos = null;
    if (texto) {
      try {
        datos = JSON.parse(texto);
      } catch {
        datos = null;
      }
    }

    if (!respuesta.ok) {
      if (respuesta.status === 401 && token && alSesionVencida) alSesionVencida();
      const error = datos?.error;
      throw new ErrorApi(
        error?.codigo ?? 'ERROR_DESCONOCIDO',
        error?.mensaje ?? 'Ocurrió un error inesperado',
        respuesta.status,
        error?.detalles,
      );
    }

    if (schema) {
      const resultado = schema.safeParse(datos);
      if (!resultado.success) {
        throw new ErrorApi(
          'RESPUESTA_INVALIDA',
          'La respuesta del servidor no tiene el formato esperado',
          respuesta.status,
        );
      }
      return resultado.data;
    }
    return datos;
  }

  return {
    get: (ruta, opciones) => solicitar('GET', ruta, opciones),
    post: (ruta, opciones) => solicitar('POST', ruta, opciones),
    put: (ruta, opciones) => solicitar('PUT', ruta, opciones),
    delete: (ruta, opciones) => solicitar('DELETE', ruta, opciones),
  };
}

// Cliente compartido: el SessionProvider le informa el token y qué hacer cuando la sesión vence.
const sesionCliente = { token: null, alVencer: null };

export function configurarSesionCliente(cambios) {
  Object.assign(sesionCliente, cambios);
}

export const api = crearCliente({
  baseUrl: process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000',
  obtenerToken: () => sesionCliente.token,
  alSesionVencida: () => sesionCliente.alVencer?.(),
});
