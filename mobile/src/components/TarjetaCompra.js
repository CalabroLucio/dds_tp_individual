import { StyleSheet, View } from 'react-native';
import { Card, Text } from 'react-native-paper';
import { ChipEstado } from './ChipEstado';
import { formatearFecha, formatearPrecio, textoSeguimiento } from '../utils/formato';

export function TarjetaCompra({ compra, onPress, mostrarComprador = false }) {
  const seguimiento = textoSeguimiento(compra);
  return (
    <Card mode="elevated" onPress={onPress} accessibilityLabel={`Compra de ${compra.evento.nombre}`}>
      <Card.Content style={estilos.contenido}>
        <View style={estilos.fila}>
          <ChipEstado estado={compra.estado} compacto />
          {seguimiento ? (
            <Text variant="labelLarge" style={estilos.seguimiento}>
              {seguimiento}
            </Text>
          ) : null}
        </View>
        <Text variant="titleMedium" style={estilos.nombre}>
          {mostrarComprador
            ? `${compra.comprador.nombre} ${compra.comprador.apellido}`
            : compra.evento.nombre}
        </Text>
        {!mostrarComprador ? <Text variant="bodyMedium">{formatearFecha(compra.evento.fecha)}</Text> : null}
        <Text variant="bodyMedium" style={estilos.secundario}>
          {`${compra.cantidad} × ${compra.tipoEntrada.nombre} · Total ${formatearPrecio(compra.total)}`}
        </Text>
      </Card.Content>
    </Card>
  );
}

const estilos = StyleSheet.create({
  contenido: { gap: 4 },
  fila: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  seguimiento: { color: '#1E6B12', fontWeight: '700' },
  nombre: { fontWeight: '700' },
  secundario: { opacity: 0.7 },
});
