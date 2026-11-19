// Persistencia en memoria: una colección Map por entidad. Se pierde al reiniciar el proceso.
export function crearStore() {
  const store = {
    usuarios: new Map(),
    categorias: new Map(),
    eventos: new Map(),
    compras: new Map(),
    resenias: new Map(),
    reiniciar() {
      for (const coleccion of [
        store.usuarios,
        store.categorias,
        store.eventos,
        store.compras,
        store.resenias,
      ]) {
        coleccion.clear();
      }
    },
  };
  return store;
}
