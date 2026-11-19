export function crearCategoriasService({ repos, presentacion }) {
  return {
    listar: () => repos.categorias.listar().map(presentacion.categoria),
  };
}
