// URL de la API fija para los tests (el cliente HTTP se mockea con fetch).
process.env.EXPO_PUBLIC_API_URL = 'http://api.test';

// expo-secure-store no existe en el entorno de Jest: se reemplaza por un almacenamiento en memoria.
jest.mock('expo-secure-store', () => {
  const datos = new Map();
  return {
    getItemAsync: jest.fn(async (clave) => (datos.has(clave) ? datos.get(clave) : null)),
    setItemAsync: jest.fn(async (clave, valor) => {
      datos.set(clave, valor);
    }),
    deleteItemAsync: jest.fn(async (clave) => {
      datos.delete(clave);
    }),
    __reiniciar: () => datos.clear(),
  };
});
