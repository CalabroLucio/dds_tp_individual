import { StyleSheet, View } from 'react-native';
import { Button, Icon, Text, useTheme } from 'react-native-paper';

export function MensajeError({ error, onReintentar }) {
  const { colors } = useTheme();
  const mensaje = error?.mensaje ?? error?.message ?? 'Ocurrió un error inesperado';
  return (
    <View style={estilos.contenedor} accessibilityRole="alert">
      <Icon source="alert-circle-outline" size={40} color={colors.error} />
      <Text variant="bodyLarge" style={estilos.texto}>
        {mensaje}
      </Text>
      {onReintentar ? (
        <Button mode="outlined" onPress={onReintentar}>
          Reintentar
        </Button>
      ) : null}
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
  texto: { textAlign: 'center' },
});
