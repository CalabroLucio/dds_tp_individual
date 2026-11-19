import { Tabs } from 'expo-router';
import { iconoTab as icono } from '../../components/iconoTab';
import { tema } from '../../theme/tema';

// Pestañas del organizador. Cada historia agrega la suya al crear su pantalla.
export default function TabsOrganizador() {
  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: tema.colors.primary }}>
      <Tabs.Screen name="perfil" options={{ title: 'Perfil', tabBarIcon: icono('account-circle-outline') }} />
    </Tabs>
  );
}
