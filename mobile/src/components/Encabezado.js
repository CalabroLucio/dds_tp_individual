import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colores } from '../theme/tema';

// Encabezado grande de las pantallas con pestañas (sin el header del Stack).
export function Encabezado({ antetitulo, titulo, derecha, conMargenSuperior = true }) {
  const { top } = useSafeAreaInsets();
  return (
    <View style={[estilos.contenedor, conMargenSuperior && { paddingTop: top + 12 }]}>
      <View style={estilos.flex}>
        {antetitulo ? (
          <Text variant="labelLarge" style={estilos.antetitulo}>
            {antetitulo}
          </Text>
        ) : null}
        <Text variant="headlineMedium" accessibilityRole="header">
          {titulo}
        </Text>
      </View>
      {derecha}
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: { flexDirection: 'row', alignItems: 'flex-end', gap: 12, paddingBottom: 8 },
  flex: { flex: 1 },
  antetitulo: { color: colores.textoSecundario },
});
