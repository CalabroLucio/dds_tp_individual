// data-model.md · Usuario.email es único y se guarda en minúsculas.
export function crearUsuariosRepository(store) {
  const normalizarEmail = (email) => String(email).trim().toLowerCase();

  return {
    guardar(usuario) {
      const email = normalizarEmail(usuario.email);
      for (const existente of store.usuarios.values()) {
        if (existente.email === email && existente.id !== usuario.id) {
          throw new Error(`Ya existe un usuario con el email ${email}`);
        }
      }
      const guardado = { ...usuario, email, favoritos: usuario.favoritos ?? new Set() };
      store.usuarios.set(guardado.id, guardado);
      return guardado;
    },

    porId(id) {
      return store.usuarios.get(id) ?? null;
    },

    buscarPorEmail(email) {
      const buscado = normalizarEmail(email);
      for (const usuario of store.usuarios.values()) {
        if (usuario.email === buscado) return usuario;
      }
      return null;
    },
  };
}
