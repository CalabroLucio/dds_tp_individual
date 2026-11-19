import { StyleSheet, View } from 'react-native';
import { Icon, Surface, Text, useTheme } from 'react-native-paper';
import { describirCampo } from '../utils/formato';

// Muestra el error del backend tal cual (el front no decide reglas) y sus detalles campo por campo.
export function ErroresFormulario({ error }) {
  const { colors } = useTheme();
  if (!error) return null;
  return (
    <Surface style={[estilos.caja, { backgroundColor: colors.errorContainer }]} elevation={0}>
      <View style={estilos.fila} accessibilityRole="alert">
        <Icon source="alert-circle-outline" size={20} color={colors.onErrorContainer} />
        <Text style={{ color: colors.onErrorContainer, flex: 1 }}>{error.mensaje}</Text>
      </View>
      {(error.detalles ?? []).map((d, i) => (
        <Text key={`${d.campo}-${i}`} style={{ color: colors.onErrorContainer }}>
          {`${describirCampo(d.campo)}: ${d.mensaje}`}
        </Text>
      ))}
    </Surface>
  );
}

const estilos = StyleSheet.create({
  caja: { borderRadius: 12, padding: 12, gap: 4 },
  fila: { flexDirection: 'row', gap: 8, alignItems: 'center' },
});
