import { StyleSheet, View } from 'react-native';
import { Text, TouchableRipple } from 'react-native-paper';
import { Ticket } from './Ticket';
import { Puntaje } from './Puntaje';
import { colores, radios } from '../theme/tema';
import { formatearPrecio, partesFecha } from '../utils/formato';

// Tarjeta del catálogo con forma de entrada: talón con la fecha grande y cuerpo con los datos del evento.
export function TarjetaEvento({ evento, onPress, accion }) {
  const f = partesFecha(evento.fecha);
  return (
    <TouchableRipple
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Evento ${evento.nombre}`}
      borderless
      style={estilos.toque}
    >
      <Ticket
        talon={
          <View style={estilos.talon}>
            <Text variant="labelMedium" style={estilos.dia}>
              {f.dia}
            </Text>
            <Text variant="headlineMedium" style={estilos.numero}>
              {f.numero}
            </Text>
            <Text variant="labelMedium" style={estilos.mes}>
              {f.mes}
            </Text>
            <Text variant="labelSmall" style={estilos.hora}>
              {f.hora}
            </Text>
          </View>
        }
      >
        <View style={estilos.fila}>
          <Text variant="labelSmall" style={estilos.categoria} numberOfLines={1}>
            {evento.categoria.nombre.toUpperCase()}
          </Text>
          {accion}
        </View>
        <Text variant="titleMedium" numberOfLines={2} style={estilos.nombre}>
          {evento.nombre}
        </Text>
        <Text variant="bodySmall" style={estilos.secundario} numberOfLines={1}>
          {`${evento.organizador.nombre} ${evento.organizador.apellido}`}
        </Text>
        <View style={[estilos.fila, estilos.pie]}>
          <Text variant="titleSmall" style={estilos.precio}>
            {evento.precioDesde === 0 ? 'Gratis' : `Desde ${formatearPrecio(evento.precioDesde)}`}
          </Text>
          <Puntaje puntaje={evento.organizador.puntaje} cantidad={evento.organizador.cantidadResenias} />
        </View>
      </Ticket>
    </TouchableRipple>
  );
}

const estilos = StyleSheet.create({
  toque: { borderRadius: radios.tarjeta },
  talon: { alignItems: 'center' },
  dia: { color: colores.textoSecundario, letterSpacing: 1 },
  numero: { color: colores.texto, lineHeight: 34 },
  mes: { color: colores.marca, letterSpacing: 1 },
  hora: { color: colores.textoSecundario, marginTop: 4 },
  fila: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 28 },
  categoria: { color: colores.marca, letterSpacing: 1, flex: 1 },
  nombre: { color: colores.texto },
  secundario: { color: colores.textoSecundario },
  pie: { marginTop: 6 },
  precio: { color: colores.texto },
});
