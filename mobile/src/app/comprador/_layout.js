import { Tabs } from 'expo-router';
import { iconoTab as icono } from '../../components/iconoTab';
import { colores } from '../../theme/tema';
import { BarraPestanas } from '../../components/BarraPestanas';

// Pestañas del comprador. Cada historia agrega la suya al crear su pantalla.
export default function TabsComprador() {
  return (
    <Tabs
      tabBar={(props) => <BarraPestanas {...props} />}
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colores.fondo } }}
    >
      <Tabs.Screen name="explorar" options={{ title: 'Explorar', tabBarIcon: icono('compass-outline') }} />
      <Tabs.Screen name="favoritos" options={{ title: 'Favoritos', tabBarIcon: icono('heart-outline') }} />
      <Tabs.Screen
        name="mis-compras"
        options={{ title: 'Mis compras', tabBarIcon: icono('ticket-confirmation-outline') }}
      />
      <Tabs.Screen name="perfil" options={{ title: 'Perfil', tabBarIcon: icono('account-circle-outline') }} />
    </Tabs>
  );
}
