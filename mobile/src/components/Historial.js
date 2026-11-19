import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { ESTADOS } from './ChipEstado';
import { colores, radios } from '../theme/tema';
import { formatearFechaHoraCorta } from '../utils/formato';

const QUIEN = { SISTEMA: 'Sistema (automático)' };

// Línea de tiempo de los cambios de estado, con quién y cuándo (CambioEstadoCompra, FR-017).
export function Historial({ historial }) {
  return (
    <View style={estilos.panel}>
      <Text variant="titleMedium">Historial</Text>
      {historial.map((h, i) => {
        const info = ESTADOS[h.estado];
        const ultimo = i === historial.length - 1;
        return (
          <View key={`${h.estado}-${i}`} style={estilos.fila}>
            <View style={estilos.linea}>
              <View style={[estilos.punto, { backgroundColor: info.color }]} />
              {!ultimo ? <View style={estilos.conector} /> : null}
            </View>
            <View style={[estilos.flex, !ultimo && estilos.separacion]}>
              <Text variant="bodyMedium">{`${info.rotulo} · ${QUIEN[h.quien.tipo] ?? h.quien.nombre}`}</Text>
              <Text variant="bodySmall" style={estilos.fecha}>
                {formatearFechaHoraCorta(h.fechaHora)}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const estilos = StyleSheet.create({
  panel: { gap: 12, padding: 16, borderRadius: radios.tarjeta, backgroundColor: colores.superficie },
  fila: { flexDirection: 'row', gap: 12 },
  linea: { alignItems: 'center', width: 12 },
  punto: { width: 10, height: 10, borderRadius: 5, marginTop: 5 },
  conector: { flex: 1, width: 2, backgroundColor: colores.borde, marginTop: 4 },
  flex: { flex: 1 },
  separacion: { paddingBottom: 12 },
  fecha: { color: colores.textoSecundario },
});
