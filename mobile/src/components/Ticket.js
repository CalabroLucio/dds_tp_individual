import { StyleSheet, View } from 'react-native';
import { colores, radios } from '../theme/tema';

const MUESCA = 18;

// Línea punteada con segmentos: los bordes `dashed` de un solo lado no se dibujan bien en Android.
export function LineaPunteada({ vertical = false, segmentos = 14 }) {
  return (
    <View style={vertical ? estilos.lineaVertical : estilos.lineaHorizontal} pointerEvents="none">
      {Array.from({ length: segmentos }, (_, i) => (
        <View key={i} style={vertical ? estilos.segmentoVertical : estilos.segmentoHorizontal} />
      ))}
    </View>
  );
}

const Muesca = ({ style }) => <View pointerEvents="none" style={[estilos.muesca, style]} />;

/**
 * Contenedor troquelado con la forma de una entrada.
 * - `talon`: contenido a la izquierda (talón) separado del cuerpo por una línea vertical, con muescas arriba y abajo.
 * - `superior`: contenido arriba separado del inferior por una línea horizontal, con muescas a los costados.
 */
export function Ticket({
  talon,
  superior,
  children,
  anchoTalon = 84,
  style,
  colorFondo = colores.superficie,
}) {
  if (superior) {
    return (
      <View style={[estilos.ticket, { backgroundColor: colorFondo }, style]}>
        <View style={estilos.superior}>{superior}</View>
        <View style={estilos.divisorHorizontal}>
          <Muesca style={estilos.muescaIzquierda} />
          <LineaPunteada segmentos={22} />
          <Muesca style={estilos.muescaDerecha} />
        </View>
        <View style={estilos.inferior}>{children}</View>
      </View>
    );
  }
  return (
    <View style={[estilos.ticket, estilos.fila, { backgroundColor: colorFondo }, style]}>
      <View style={[estilos.talon, { width: anchoTalon }]}>{talon}</View>
      <View style={estilos.divisorVertical}>
        <Muesca style={estilos.muescaArriba} />
        <LineaPunteada vertical segmentos={9} />
        <Muesca style={estilos.muescaAbajo} />
      </View>
      <View style={estilos.cuerpo}>{children}</View>
    </View>
  );
}

const estilos = StyleSheet.create({
  ticket: { borderRadius: radios.tarjeta },
  fila: { flexDirection: 'row' },
  talon: { alignItems: 'center', justifyContent: 'center', paddingVertical: 16 },
  cuerpo: { flex: 1, paddingVertical: 14, paddingHorizontal: 14, gap: 4 },
  superior: { padding: 18, gap: 6 },
  inferior: { padding: 18, gap: 10 },
  divisorVertical: { width: 1, alignItems: 'center', justifyContent: 'center' },
  divisorHorizontal: { height: MUESCA, justifyContent: 'center', paddingHorizontal: MUESCA / 2 + 4 },
  muesca: {
    position: 'absolute',
    width: MUESCA,
    height: MUESCA,
    borderRadius: MUESCA / 2,
    backgroundColor: colores.fondo,
  },
  muescaArriba: { top: -MUESCA / 2, left: -MUESCA / 2 },
  muescaAbajo: { bottom: -MUESCA / 2, left: -MUESCA / 2 },
  muescaIzquierda: { left: -MUESCA / 2, top: 0 },
  muescaDerecha: { right: -MUESCA / 2, top: 0 },
  lineaVertical: { flex: 1, justifyContent: 'space-evenly', paddingVertical: 14 },
  lineaHorizontal: { flexDirection: 'row', justifyContent: 'space-between' },
  segmentoVertical: { width: 1, height: 6, backgroundColor: colores.borde },
  segmentoHorizontal: { width: 7, height: 1, backgroundColor: colores.borde },
});
