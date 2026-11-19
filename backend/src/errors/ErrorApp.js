// Error de aplicación con código estable (lo verifican los tests y lo usa el front) y estado HTTP.
export class ErrorApp extends Error {
  constructor(codigo, mensaje, status, detalles) {
    super(mensaje);
    this.name = 'ErrorApp';
    this.codigo = codigo;
    this.status = status;
    if (detalles) this.detalles = detalles;
  }

  toJSON() {
    const error = { codigo: this.codigo, mensaje: this.message };
    if (this.detalles) error.detalles = this.detalles;
    return { error };
  }
}
