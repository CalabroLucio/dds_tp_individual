import { StyleSheet, View } from 'react-native';
import { Card, Icon, Text } from 'react-native-paper';
import { ESTADOS } from './ChipEstado';
import { formatearFechaHoraCorta } from '../utils/formato';

const QUIEN = { SISTEMA: 'Sistema (automático)' };

// Cada cambio de estado con quién lo hizo y cuándo (CambioEstadoCompra, FR-017).
export function Historial({ historial }) {
  return (
    <Card mode="outlined">
      <Card.Title title="Historial" />
      <Card.Content style={estilos.lista}>
        {historial.map((h, i) => {
          const info = ESTADOS[h.estado];
          return (
            <View key={`${h.estado}-${i}`} style={estilos.fila}>
              <Icon source={info.icono} size={18} color={info.color} />
              <Text variant="bodyMedium" style={estilos.flex}>
                {`${info.rotulo} · ${QUIEN[h.quien.tipo] ?? h.quien.nombre}`}
              </Text>
              <Text variant="bodySmall" style={estilos.fecha}>
                {formatearFechaHoraCorta(h.fechaHora)}
              </Text>
            </View>
          );
        })}
      </Card.Content>
    </Card>
  );
}

const estilos = StyleSheet.create({
  lista: { gap: 8 },
  fila: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  flex: { flex: 1 },
  fecha: { opacity: 0.6 },
});
