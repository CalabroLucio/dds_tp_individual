import * as SecureStore from 'expo-secure-store';
import { render } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PaperProvider } from 'react-native-paper';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SessionProvider } from '../../src/session/SessionProvider';
import { tema } from '../../src/theme/tema';

// Clientes creados en el test actual: se limpian al terminar cada test (jest.despues.js).
export const clientesActivos = new Set();

const METRICAS = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 0, left: 0, right: 0, bottom: 0 },
};

// Renderiza con los mismos providers que la app (sin reintentos para que los errores se vean al instante).
// Con `usuario`, la app arranca con esa sesión guardada (el test debe responder GET /auth/me, ver conSesion).
export async function renderConProviders(ui, { usuario } = {}) {
  SecureStore.__reiniciar();
  if (usuario) await SecureStore.setItemAsync('sesion', JSON.stringify({ token: 'tkn', usuario }));
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { retry: false } },
  });
  clientesActivos.add(queryClient);
  const resultado = await render(
    <SafeAreaProvider initialMetrics={METRICAS}>
      <QueryClientProvider client={queryClient}>
        <PaperProvider theme={tema}>
          <SessionProvider>{ui}</SessionProvider>
        </PaperProvider>
      </QueryClientProvider>
    </SafeAreaProvider>,
  );
  return { ...resultado, queryClient };
}
