import { StyleSheet, View } from 'react-native';
import { Text, TouchableRipple } from 'react-native-paper';
import { Ticket } from './Ticket';
import { ChipEstado } from './ChipEstado';
import { colores, radios } from '../theme/tema';
import { formatearPrecio, partesFecha, textoSeguimiento } from '../utils/formato';

// Una compra como entrada chica: talón con la fecha del evento y cuerpo con estado y seguimiento.
export function TarjetaCompra({ compra, onPress, mostrarComprador = false }) {
  const seguimiento = textoSeguimiento(compra);
  const f = partesFecha(compra.evento.fecha);
  return (
    <TouchableRipple
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Compra de ${compra.evento.nombre}`}
      borderless
      style={estilos.toque}
    >
      <Ticket
        anchoTalon={72}
        talon={
          <View style={estilos.talon}>
            <Text variant="labelSmall" style={estilos.dia}>
              {f.dia}
            </Text>
            <Text variant="titleLarge">{f.numero}</Text>
            <Text variant="labelSmall" style={estilos.mes}>
              {f.mes}
            </Text>
          </View>
        }
      >
        <View style={estilos.fila}>
          <ChipEstado estado={compra.estado} compacto />
          {seguimiento ? (
            <Text variant="labelMedium" style={estilos.seguimiento}>
              {seguimiento}
            </Text>
          ) : null}
        </View>
        <Text variant="titleMedium" numberOfLines={1}>
          {mostrarComprador
            ? `${compra.comprador.nombre} ${compra.comprador.apellido}`
            : compra.evento.nombre}
        </Text>
        <Text variant="bodySmall" style={estilos.secundario}>
          {`${compra.cantidad} × ${compra.tipoEntrada.nombre} · Total ${formatearPrecio(compra.total)}`}
        </Text>
      </Ticket>
    </TouchableRipple>
  );
}

const estilos = StyleSheet.create({
  toque: { borderRadius: radios.tarjeta },
  talon: { alignItems: 'center' },
  dia: { color: colores.textoSecundario, letterSpacing: 1 },
  mes: { color: colores.marca, letterSpacing: 1 },
  fila: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  seguimiento: { color: colores.marca },
  secundario: { color: colores.textoSecundario },
});
