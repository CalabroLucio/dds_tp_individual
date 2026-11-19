import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { fuentes, radios } from '../theme/tema';

// Un color y rótulo por EstadoCompra, para diferenciarlos "con claridad" (consigna, casos de uso 1 y 2).
// El estado se comunica con texto además del color (accesibilidad).
export const ESTADOS = {
  PENDIENTE: { rotulo: 'Pendiente de pago', color: '#FFB547', icono: 'clock-outline' },
  CONFIRMADA: { rotulo: 'Confirmada', color: '#6BD43F', icono: 'check-circle-outline' },
  UTILIZADA: { rotulo: 'Utilizada', color: '#5AA9FF', icono: 'ticket-confirmation-outline' },
  CANCELADA: { rotulo: 'Cancelada', color: '#8A9099', icono: 'close-circle-outline' },
  REEMBOLSADA: { rotulo: 'Reembolsada', color: '#B78CFF', icono: 'cash-refund' },
};

// Color al 16 % de opacidad para el fondo de la píldora.
const translucido = (hex) => `${hex}29`;

export function ChipEstado({ estado, compacto = false }) {
  const info = ESTADOS[estado] ?? ESTADOS.CANCELADA;
  return (
    <View
      accessible
      accessibilityLabel={`Estado: ${info.rotulo}`}
      style={[estilos.chip, compacto && estilos.compacto, { backgroundColor: translucido(info.color) }]}
    >
      <View style={[estilos.punto, { backgroundColor: info.color }]} />
      <Text style={[estilos.texto, { color: info.color }]}>{info.rotulo}</Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  chip: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radios.pildora,
  },
  compacto: { paddingVertical: 3, paddingHorizontal: 8 },
  punto: { width: 7, height: 7, borderRadius: 4 },
  texto: { fontFamily: fuentes.semi, fontSize: 12, letterSpacing: 0.3 },
});
