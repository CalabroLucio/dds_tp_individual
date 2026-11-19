import { StyleSheet, View } from 'react-native';
import { Icon, Text, useTheme } from 'react-native-paper';

export function EstadoVacio({ icono = 'calendar-blank-outline', titulo, descripcion, children }) {
  const { colors } = useTheme();
  return (
    <View style={estilos.contenedor}>
      <Icon source={icono} size={48} color={colors.outline} />
      <Text variant="titleMedium" style={estilos.centrado}>
        {titulo}
      </Text>
      {descripcion ? (
        <Text variant="bodyMedium" style={[estilos.centrado, estilos.descripcion]}>
          {descripcion}
        </Text>
      ) : null}
      {children}
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 8 },
  centrado: { textAlign: 'center' },
  descripcion: { opacity: 0.7 },
});
