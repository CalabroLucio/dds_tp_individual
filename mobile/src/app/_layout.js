import { useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SessionProvider, useSession } from '../session/SessionProvider';
import { Cargando } from '../components/Cargando';
import { tema } from '../theme/tema';

export default function RootLayout() {
  const [queryClient] = useState(
    () => new QueryClient({ defaultOptions: { queries: { retry: 1, staleTime: 10_000 } } }),
  );

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <PaperProvider theme={tema}>
          <SessionProvider>
            <StatusBar style="dark" />
            <Navegacion />
          </SessionProvider>
        </PaperProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

// Rutas protegidas por rol (R2): cada grupo solo existe para el rol que corresponde.
function Navegacion() {
  const { estado, usuario } = useSession();
  if (estado === 'cargando') return <Cargando mensaje="Abriendo AI Ticket It…" />;

  const esComprador = usuario?.rol === 'COMPRADOR';
  const esOrganizador = usuario?.rol === 'ORGANIZADOR';

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: tema.colors.surface },
        headerTintColor: tema.colors.primary,
        headerTitleStyle: { color: tema.colors.onSurface },
        contentStyle: { backgroundColor: tema.colors.background },
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Protected guard={!usuario}>
        <Stack.Screen name="login" options={{ headerShown: false }} />
      </Stack.Protected>
      <Stack.Protected guard={esComprador}>
        <Stack.Screen name="comprador" options={{ headerShown: false }} />
      </Stack.Protected>
      <Stack.Protected guard={esOrganizador}>
        <Stack.Screen name="organizador" options={{ headerShown: false }} />
        <Stack.Screen name="evento/nuevo" options={{ title: 'Nuevo evento' }} />
      </Stack.Protected>
      <Stack.Protected guard={Boolean(usuario)}>
        <Stack.Screen name="evento/[id]" options={{ title: 'Evento' }} />
      </Stack.Protected>
    </Stack>
  );
}
