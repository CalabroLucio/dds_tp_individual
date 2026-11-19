import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Dialog, Icon, Portal, RadioButton, Text } from 'react-native-paper';
import { router } from 'expo-router';
import { useCrearCompra } from '../hooks/useCompras';
import { SelectorCantidad } from './SelectorCantidad';
import { ErroresFormulario } from './ErroresFormulario';
import { colores, radios } from '../theme/tema';
import { formatearPrecio } from '../utils/formato';

const Aviso = ({ icono, texto }) => (
  <View style={estilos.aviso}>
    <Icon source={icono} size={20} color={colores.textoSecundario} />
    <Text variant="bodyLarge" style={estilos.flex}>
      {texto}
    </Text>
  </View>
);

// Compra desde el detalle del evento. Todo lo que limita la compra (cupo, máximo, si está abierta, si se podrá
// cancelar) viene calculado del backend en el detalle del evento.
export function SeccionCompra({ evento }) {
  const disponibles = evento.tiposEntrada.filter((t) => !t.agotado);
  const [tipoId, setTipoId] = useState(null);
  const [cantidad, setCantidad] = useState(1);
  const [confirmar, setConfirmar] = useState(false);
  const crear = useCrearCompra();

  if (!evento.compraAbierta) {
    return <Aviso icono="calendar-remove-outline" texto="La venta de entradas para este evento terminó" />;
  }
  if (disponibles.length === 0) return <Aviso icono="ticket-outline" texto="Las entradas están agotadas" />;

  const tipo = disponibles.find((t) => t.id === tipoId) ?? null;
  const maximo = tipo ? Math.min(evento.maxEntradasPorCompra, tipo.cupoDisponible) : 1;

  function elegir(id) {
    setTipoId(id);
    setCantidad(1);
  }

  function comprar() {
    setConfirmar(false);
    crear.mutate(
      { eventoId: evento.id, tipoEntradaId: tipo.id, cantidad },
      { onSuccess: (compra) => router.push(`/compra/${compra.id}`) },
    );
  }

  return (
    <View style={estilos.panel}>
      <View>
        <Text variant="titleLarge">Comprar entradas</Text>
        <Text variant="bodySmall" style={estilos.secundario}>
          {`Máximo ${evento.maxEntradasPorCompra} por compra`}
        </Text>
      </View>
      <RadioButton.Group value={tipoId ?? ''} onValueChange={elegir}>
        {disponibles.map((t) => (
          <RadioButton.Item
            key={t.id}
            value={t.id}
            label={`${t.nombre} · ${formatearPrecio(t.precio)}`}
            accessibilityLabel={`Elegir ${t.nombre}`}
            position="leading"
            labelStyle={estilos.opcion}
            style={[estilos.item, t.id === tipoId && estilos.itemElegido]}
          />
        ))}
      </RadioButton.Group>
      {tipo ? (
        <View style={estilos.fila}>
          <SelectorCantidad valor={cantidad} maximo={maximo} onCambiar={setCantidad} />
          <View style={estilos.total}>
            <Text variant="labelMedium" style={estilos.secundario}>
              Total
            </Text>
            <Text variant="titleLarge" style={estilos.monto}>
              {formatearPrecio(tipo.precio * cantidad)}
            </Text>
          </View>
        </View>
      ) : null}
      <ErroresFormulario error={crear.error} />
      <Button
        mode="contained"
        icon="ticket"
        disabled={!tipo || crear.isPending}
        loading={crear.isPending}
        contentStyle={estilos.boton}
        onPress={() => (evento.avisoNoCancelable ? setConfirmar(true) : comprar())}
      >
        Comprar
      </Button>

      <Portal>
        <Dialog visible={confirmar} onDismiss={() => setConfirmar(false)} style={estilos.dialogo}>
          <Dialog.Icon icon="clock-alert-outline" color={colores.estrella} />
          <Dialog.Title style={estilos.centrado}>Atención</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium" style={estilos.centrado}>
              Faltan menos de 30 minutos para el evento: esta compra no se podrá cancelar.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setConfirmar(false)}>Volver</Button>
            <Button mode="contained" onPress={comprar}>
              Comprar igual
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const estilos = StyleSheet.create({
  flex: { flex: 1 },
  panel: {
    gap: 12,
    padding: 16,
    borderRadius: radios.tarjeta,
    backgroundColor: colores.superficie,
    marginTop: 12,
  },
  aviso: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: radios.tarjeta,
    backgroundColor: colores.superficie,
    marginTop: 12,
  },
  secundario: { color: colores.textoSecundario },
  opcion: { textAlign: 'left' },
  item: { borderRadius: radios.input, paddingHorizontal: 4 },
  itemElegido: { backgroundColor: colores.marcaSuave },
  fila: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  total: { alignItems: 'flex-end' },
  monto: { color: colores.marca },
  boton: { paddingVertical: 6 },
  dialogo: { backgroundColor: colores.superficieAlta },
  centrado: { textAlign: 'center' },
});
