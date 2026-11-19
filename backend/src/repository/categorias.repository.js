import { normalizar } from '../utils/texto.js';

// data-model.md · Categoria.nombre es único.
export function crearCategoriasRepository(store) {
  return {
    guardar(categoria) {
      for (const existente of store.categorias.values()) {
        if (normalizar(existente.nombre) === normalizar(categoria.nombre) && existente.id !== categoria.id) {
          throw new Error(`Ya existe la categoría ${categoria.nombre}`);
        }
      }
      store.categorias.set(categoria.id, { ...categoria });
      return store.categorias.get(categoria.id);
    },

    porId(id) {
      return store.categorias.get(id) ?? null;
    },

    listar() {
      return [...store.categorias.values()].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
    },
  };
}
