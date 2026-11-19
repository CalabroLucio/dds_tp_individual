import { MaterialCommunityIcons } from '@expo/vector-icons';

// Devuelve el componente de ícono para una pestaña (con nombre, para que React lo identifique).
export function iconoTab(nombre) {
  function IconoTab({ color, size }) {
    return <MaterialCommunityIcons name={nombre} color={color} size={size} />;
  }
  return IconoTab;
}
