import { StyleSheet } from 'react-native';
import { Chip } from 'react-native-paper';

// Un color y rótulo por EstadoCompra, para diferenciarlos "con claridad" (consigna, casos de uso 1 y 2).
export const ESTADOS = {
  PENDIENTE: { rotulo: 'Pendiente de pago', color: '#B26A00', fondo: '#FFF1D6', icono: 'clock-outline' },
  CONFIRMADA: { rotulo: 'Confirmada', color: '#1E6B12', fondo: '#D9F5CC', icono: 'check-circle-outline' },
  UTILIZADA: {
    rotulo: 'Utilizada',
    color: '#245C8A',
    fondo: '#DCEBF7',
    icono: 'ticket-confirmation-outline',
  },
  CANCELADA: { rotulo: 'Cancelada', color: '#5F5F5F', fondo: '#ECECEC', icono: 'close-circle-outline' },
  REEMBOLSADA: { rotulo: 'Reembolsada', color: '#6B3FA0', fondo: '#EDE3F7', icono: 'cash-refund' },
};

export function ChipEstado({ estado, compacto = false }) {
  const info = ESTADOS[estado] ?? ESTADOS.CANCELADA;
  return (
    <Chip
      icon={info.icono}
      compact={compacto}
      style={[estilos.chip, { backgroundColor: info.fondo }]}
      textStyle={{ color: info.color, fontWeight: '600' }}
      accessibilityLabel={`Estado: ${info.rotulo}`}
    >
      {info.rotulo}
    </Chip>
  );
}

const estilos = StyleSheet.create({
  chip: { alignSelf: 'flex-start' },
});
