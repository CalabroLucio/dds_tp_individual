import { StyleSheet, View } from 'react-native';
import { ActivityIndicator, Text } from 'react-native-paper';

export function Cargando({ mensaje = 'Cargando…' }) {
  return (
    <View style={estilos.contenedor} accessibilityLabel={mensaje}>
      <ActivityIndicator size="large" />
      <Text style={estilos.texto}>{mensaje}</Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
  texto: { opacity: 0.7 },
});
