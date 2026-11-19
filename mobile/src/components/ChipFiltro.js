import { Pressable, StyleSheet } from 'react-native';
import { Icon, Text } from 'react-native-paper';
import { colores, fuentes, radios } from '../theme/tema';

// Píldora seleccionable para filtros, orden y categorías.
export function ChipFiltro({ etiqueta, seleccionado = false, onPress, icono }) {
  const color = seleccionado ? colores.sobreMarca : colores.texto;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: seleccionado }}
      style={[estilos.chip, seleccionado ? estilos.seleccionado : estilos.normal]}
    >
      {icono ? <Icon source={icono} size={16} color={color} /> : null}
      <Text style={[estilos.texto, { color }]}>{etiqueta}</Text>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 36,
    paddingHorizontal: 14,
    borderRadius: radios.pildora,
    borderWidth: 1,
  },
  normal: { backgroundColor: colores.superficie, borderColor: colores.borde },
  seleccionado: { backgroundColor: colores.marca, borderColor: colores.marca },
  texto: { fontFamily: fuentes.media, fontSize: 13 },
});
