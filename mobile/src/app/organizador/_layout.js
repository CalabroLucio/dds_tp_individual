import { Tabs } from 'expo-router';
import { iconoTab as icono } from '../../components/iconoTab';
import { colores } from '../../theme/tema';
import { BarraPestanas } from '../../components/BarraPestanas';

// Pestañas del organizador. Cada historia agrega la suya al crear su pantalla.
export default function TabsOrganizador() {
  return (
    <Tabs
      tabBar={(props) => <BarraPestanas {...props} />}
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colores.fondo } }}
    >
      <Tabs.Screen
        name="mis-eventos"
        options={{ title: 'Mis eventos', tabBarIcon: icono('calendar-star') }}
      />
      <Tabs.Screen name="perfil" options={{ title: 'Perfil', tabBarIcon: icono('account-circle-outline') }} />
    </Tabs>
  );
}
