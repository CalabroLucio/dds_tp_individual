import { StyleSheet, View } from 'react-native';
import { Icon, Text } from 'react-native-paper';
import { Ticket } from './Ticket';
import { ChipEstado } from './ChipEstado';
import { colores } from '../theme/tema';
import { codigoCompra, formatearFecha, formatearPrecio, textoSeguimiento } from '../utils/formato';

const Dato = ({ etiqueta, valor, destacado }) => (
  <View style={estilos.dato}>
    <Text variant="labelMedium" style={estilos.etiqueta}>
      {etiqueta}
    </Text>
    <Text variant={destacado ? 'titleMedium' : 'bodyLarge'} style={destacado && estilos.destacado}>
      {valor}
    </Text>
  </View>
);

// La compra como entrada digital troquelada. No hay QR: no existe validación en puerta (ver skill ticketit-ui).
export function EntradaDigital({ compra, mostrarComprador = false }) {
  const seguimiento = textoSeguimiento(compra);
  return (
    <Ticket
      superior={
        <>
          <View style={estilos.fila}>
            <ChipEstado estado={compra.estado} />
            {seguimiento ? (
              <Text variant="labelLarge" style={estilos.seguimiento}>
                {seguimiento}
              </Text>
            ) : null}
          </View>
          <Text variant="headlineSmall" style={estilos.evento}>
            {compra.evento.nombre}
          </Text>
          <View style={estilos.filaIcono}>
            <Icon source="calendar-blank-outline" size={16} color={colores.textoSecundario} />
            <Text variant="bodyMedium" style={estilos.secundario}>
              {formatearFecha(compra.evento.fecha)}
            </Text>
          </View>
          {mostrarComprador ? (
            <View style={estilos.filaIcono}>
              <Icon source="account-outline" size={16} color={colores.textoSecundario} />
              <Text variant="titleMedium" accessibilityLabel="Comprador">
                {`${compra.comprador.nombre} ${compra.comprador.apellido}`}
              </Text>
            </View>
          ) : null}
        </>
      }
    >
      <View style={estilos.fila}>
        <Dato etiqueta="ENTRADAS" valor={`${compra.cantidad} × ${compra.tipoEntrada.nombre}`} />
        <Dato etiqueta="TOTAL" valor={formatearPrecio(compra.total)} destacado />
      </View>
      <Dato etiqueta="CÓDIGO DE COMPRA" valor={codigoCompra(compra.id)} />
      {compra.estado === 'CONFIRMADA' ? (
        <View style={estilos.aviso}>
          <Icon source="email-outline" size={18} color={colores.marca} />
          <Text variant="bodySmall" style={estilos.textoAviso}>
            El QR de acceso se envía al mail de tu cuenta (envío simulado en esta demo).
          </Text>
        </View>
      ) : null}
    </Ticket>
  );
}

const estilos = StyleSheet.create({
  fila: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  filaIcono: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  evento: { marginTop: 4 },
  secundario: { color: colores.textoSecundario },
  seguimiento: { color: colores.marca },
  dato: { gap: 2 },
  etiqueta: { color: colores.textoSecundario, letterSpacing: 1 },
  destacado: { color: colores.marca },
  aviso: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 12,
    backgroundColor: colores.marcaSuave,
  },
  textoAviso: { flex: 1, color: colores.texto },
});
