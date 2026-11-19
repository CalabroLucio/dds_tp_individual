// Pantalla inicial según el rol del usuario.
export function rutaInicial(usuario) {
  if (!usuario) return '/login';
  return usuario.rol === 'ORGANIZADOR' ? '/organizador/mis-eventos' : '/comprador/explorar';
}
