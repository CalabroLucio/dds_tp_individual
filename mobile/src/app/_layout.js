import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  useFonts,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from '@expo-google-fonts/poppins';
import { SessionProvider, useSession } from '../session/SessionProvider';
import { Cargando } from '../components/Cargando';
import { colores, fuentes, tema } from '../theme/tema';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [queryClient] = useState(
    () => new QueryClient({ defaultOptions: { queries: { retry: 1, staleTime: 10_000 } } }),
  );
  const [fuentesListas] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  useEffect(() => {
    if (fuentesListas) SplashScreen.hideAsync().catch(() => {});
  }, [fuentesListas]);

  if (!fuentesListas) return null;

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <PaperProvider theme={tema}>
          <SessionProvider>
            <StatusBar style="light" />
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
        headerStyle: { backgroundColor: colores.fondo },
        headerTintColor: colores.texto,
        headerTitleStyle: { fontFamily: fuentes.semi, fontSize: 17 },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colores.fondo },
        animation: 'slide_from_right',
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
        <Stack.Screen name="evento/[id]/compras" options={{ title: 'Ventas del evento' }} />
      </Stack.Protected>
      <Stack.Protected guard={Boolean(usuario)}>
        <Stack.Screen name="evento/[id]" options={{ headerTransparent: true, title: '' }} />
        <Stack.Screen name="compra/[id]" options={{ title: 'Mi entrada' }} />
        <Stack.Screen name="compra/[id]/chat" options={{ title: 'Chat' }} />
      </Stack.Protected>
    </Stack>
  );
}
