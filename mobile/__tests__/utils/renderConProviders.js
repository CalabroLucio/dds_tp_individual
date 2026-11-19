import { render } from '@testing-library/react-native';
import { PaperProvider } from 'react-native-paper';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SessionProvider } from '../../src/session/SessionProvider';
import { tema } from '../../src/theme/tema';

// Renderiza con los mismos providers que la app (sin reintentos para que los errores se vean al instante).
export async function renderConProviders(ui) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { retry: false } },
  });
  const resultado = await render(
    <QueryClientProvider client={queryClient}>
      <PaperProvider theme={tema}>
        <SessionProvider>{ui}</SessionProvider>
      </PaperProvider>
    </QueryClientProvider>,
  );
  return { ...resultado, queryClient };
}
