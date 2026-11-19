import { StyleSheet, View } from 'react-native';
import { ProgressBar, Text } from 'react-native-paper';
import { colores, radios } from '../theme/tema';

// Entradas disponibles por tipo, tal como las calcula el backend (FR-019).
export function ResumenCupos({ tiposEntrada }) {
  return (
    <View style={estilos.panel}>
      <Text variant="titleMedium">Disponibilidad</Text>
      {tiposEntrada.map((t) => {
        const vendidas = t.cupoTotal - t.cupoDisponible;
        return (
          <View key={t.id} style={estilos.tipo}>
            <View style={estilos.fila}>
              <Text variant="titleSmall">{t.nombre}</Text>
              <Text variant="bodyMedium" style={t.agotado ? estilos.agotado : estilos.secundario}>
                {t.agotado
                  ? `Agotado · 0 de ${t.cupoTotal}`
                  : `${t.cupoDisponible} de ${t.cupoTotal} disponibles`}
              </Text>
            </View>
            <ProgressBar
              progress={t.cupoTotal > 0 ? vendidas / t.cupoTotal : 0}
              color={t.agotado ? colores.error : colores.marca}
              style={estilos.barra}
            />
          </View>
        );
      })}
    </View>
  );
}

const estilos = StyleSheet.create({
  panel: { gap: 14, padding: 16, borderRadius: radios.tarjeta, backgroundColor: colores.superficie },
  tipo: { gap: 8 },
  fila: { flexDirection: 'row', justifyContent: 'space-between' },
  secundario: { color: colores.textoSecundario },
  agotado: { color: colores.error },
  barra: { height: 6, borderRadius: 3, backgroundColor: colores.borde },
});
