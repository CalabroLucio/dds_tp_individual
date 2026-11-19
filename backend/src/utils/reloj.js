// Única fuente de "ahora" de la aplicación. En tests se reemplaza por un reloj controlable (R10).
export const relojSistema = {
  ahora: () => new Date(),
};
