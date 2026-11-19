import { StyleSheet, View } from 'react-native';
import { Card, Chip, Text } from 'react-native-paper';
import { Image } from 'expo-image';
import { Puntaje } from './Puntaje';
import { formatearFecha, formatearPrecio } from '../utils/formato';

export function TarjetaEvento({ evento, onPress, accion }) {
  return (
    <Card mode="elevated" onPress={onPress} accessibilityLabel={`Evento ${evento.nombre}`}>
      {evento.imagenPrincipal ? (
        <Image
          source={{ uri: evento.imagenPrincipal }}
          style={estilos.imagen}
          contentFit="cover"
          transition={200}
        />
      ) : null}
      <Card.Content style={estilos.contenido}>
        <View style={estilos.encabezado}>
          <Chip compact icon="tag-outline" style={estilos.chip}>
            {evento.categoria.nombre}
          </Chip>
          {accion}
        </View>
        <Text variant="titleMedium" style={estilos.nombre}>
          {evento.nombre}
        </Text>
        <Text variant="bodyMedium" style={estilos.secundario}>
          {formatearFecha(evento.fecha)}
        </Text>
        <View style={estilos.pie}>
          <Text variant="titleSmall">Desde {formatearPrecio(evento.precioDesde)}</Text>
          <View style={estilos.organizador}>
            <Text variant="bodySmall" style={estilos.secundario}>
              {evento.organizador.nombre} {evento.organizador.apellido}
            </Text>
            <Puntaje puntaje={evento.organizador.puntaje} cantidad={evento.organizador.cantidadResenias} />
          </View>
        </View>
      </Card.Content>
    </Card>
  );
}

const estilos = StyleSheet.create({
  imagen: { height: 140, borderTopLeftRadius: 12, borderTopRightRadius: 12 },
  contenido: { gap: 4, paddingTop: 12 },
  encabezado: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  chip: { alignSelf: 'flex-start' },
  nombre: { fontWeight: '700' },
  secundario: { opacity: 0.7 },
  pie: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 4 },
  organizador: { alignItems: 'flex-end', gap: 2 },
});
