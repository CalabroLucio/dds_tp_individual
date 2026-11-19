import { StyleSheet, View } from 'react-native';
import { IconButton, Text } from 'react-native-paper';

// Los límites (máximo por compra y cupo) los manda el backend; acá solo se respetan al elegir.
export function SelectorCantidad({ valor, maximo, onCambiar }) {
  return (
    <View style={estilos.fila}>
      <IconButton
        icon="minus"
        mode="outlined"
        disabled={valor <= 1}
        onPress={() => onCambiar(valor - 1)}
        accessibilityLabel="Restar una entrada"
      />
      <Text variant="titleLarge" style={estilos.valor} accessibilityLabel={`Cantidad: ${valor}`}>
        {valor}
      </Text>
      <IconButton
        icon="plus"
        mode="outlined"
        disabled={valor >= maximo}
        onPress={() => onCambiar(Math.min(maximo, valor + 1))}
        accessibilityLabel="Sumar una entrada"
      />
    </View>
  );
}

const estilos = StyleSheet.create({
  fila: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  valor: { minWidth: 32, textAlign: 'center', fontWeight: '700' },
});
