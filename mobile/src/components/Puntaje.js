import { StyleSheet, View } from 'react-native';
import { Icon, Text } from 'react-native-paper';

const AMARILLO = '#F5A623';

// Puntaje del organizador (promedio de sus reseñas), tal como lo calcula el backend.
export function Puntaje({ puntaje, cantidad, tamano = 'chico' }) {
  if (puntaje === null || puntaje === undefined) {
    return (
      <Text variant="bodySmall" style={estilos.sin}>
        Sin reseñas
      </Text>
    );
  }
  const valor = puntaje.toFixed(1);
  const etiqueta = `Puntaje del organizador: ${valor} de 5 (${cantidad} ${cantidad === 1 ? 'reseña' : 'reseñas'})`;
  return (
    <View style={estilos.fila} accessible accessibilityLabel={etiqueta}>
      <Icon source="star" size={tamano === 'grande' ? 20 : 16} color={AMARILLO} />
      <Text variant={tamano === 'grande' ? 'titleMedium' : 'bodyMedium'} style={estilos.valor}>
        {valor}
      </Text>
      <Text variant="bodySmall" style={estilos.sin}>
        ({cantidad})
      </Text>
    </View>
  );
}

export function Estrellas({ puntaje }) {
  return (
    <View style={estilos.fila} accessible accessibilityLabel={`${puntaje} de 5 estrellas`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Icon key={n} source={n <= puntaje ? 'star' : 'star-outline'} size={14} color={AMARILLO} />
      ))}
    </View>
  );
}

const estilos = StyleSheet.create({
  fila: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  valor: { fontWeight: '700' },
  sin: { opacity: 0.6 },
});
