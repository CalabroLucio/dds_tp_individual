import { StyleSheet, View } from 'react-native';
import { Card, ProgressBar, Text } from 'react-native-paper';

// Entradas disponibles por tipo, tal como las calcula el backend (FR-019).
export function ResumenCupos({ tiposEntrada }) {
  return (
    <Card mode="outlined">
      <Card.Title title="Disponibilidad" />
      <Card.Content style={estilos.lista}>
        {tiposEntrada.map((t) => {
          const vendidas = t.cupoTotal - t.cupoDisponible;
          return (
            <View key={t.id} style={estilos.tipo}>
              <View style={estilos.fila}>
                <Text variant="titleSmall">{t.nombre}</Text>
                <Text variant="bodyMedium">
                  {t.agotado
                    ? `Agotado · 0 de ${t.cupoTotal}`
                    : `${t.cupoDisponible} de ${t.cupoTotal} disponibles`}
                </Text>
              </View>
              <ProgressBar progress={t.cupoTotal > 0 ? vendidas / t.cupoTotal : 0} />
            </View>
          );
        })}
      </Card.Content>
    </Card>
  );
}

const estilos = StyleSheet.create({
  lista: { gap: 12 },
  tipo: { gap: 6 },
  fila: { flexDirection: 'row', justifyContent: 'space-between' },
});
