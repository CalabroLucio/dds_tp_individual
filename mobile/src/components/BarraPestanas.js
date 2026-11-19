import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colores, fuentes, radios } from '../theme/tema';

// Tab bar flotante tipo píldora: la pestaña activa se expande en verde con su rótulo; las otras muestran el ícono.
export function BarraPestanas({ state, descriptors, navigation }) {
  const { bottom } = useSafeAreaInsets();
  return (
    <View style={[estilos.contenedor, { bottom: Math.max(bottom, 12) + 4 }]}>
      {state.routes.map((ruta, indice) => {
        const { options } = descriptors[ruta.key];
        if (options.href === null) return null;
        const activa = state.index === indice;
        const titulo = options.title ?? ruta.name;
        const color = activa ? colores.sobreMarca : colores.textoSecundario;

        const presionar = () => {
          const evento = navigation.emit({ type: 'tabPress', target: ruta.key, canPreventDefault: true });
          if (!activa && !evento.defaultPrevented) navigation.navigate(ruta.name, ruta.params);
        };

        return (
          <Pressable
            key={ruta.key}
            onPress={presionar}
            accessibilityRole="tab"
            accessibilityState={{ selected: activa }}
            accessibilityLabel={titulo}
            style={[estilos.pestana, activa && estilos.activa]}
          >
            {options.tabBarIcon?.({ color, size: 22, focused: activa })}
            {activa ? (
              <Text numberOfLines={1} style={estilos.rotulo}>
                {titulo}
              </Text>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 6,
    borderRadius: radios.pildora,
    backgroundColor: colores.superficieAlta,
    borderWidth: 1,
    borderColor: colores.borde,
    elevation: 12,
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
  },
  pestana: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 46,
    minWidth: 46,
    paddingHorizontal: 14,
    borderRadius: radios.pildora,
  },
  activa: { backgroundColor: colores.marca, flexGrow: 1 },
  rotulo: { color: colores.sobreMarca, fontFamily: fuentes.semi, fontSize: 13 },
});
