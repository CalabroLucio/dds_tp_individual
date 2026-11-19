import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Card, Dialog, Portal, RadioButton, Text } from 'react-native-paper';
import { router } from 'expo-router';
import { useCrearCompra } from '../hooks/useCompras';
import { SelectorCantidad } from './SelectorCantidad';
import { ErroresFormulario } from './ErroresFormulario';
import { formatearPrecio } from '../utils/formato';

// Compra desde el detalle del evento. Todo lo que limita la compra (cupo, máximo, si está abierta, si se podrá
// cancelar) viene calculado del backend en el detalle del evento.
export function SeccionCompra({ evento }) {
  const disponibles = evento.tiposEntrada.filter((t) => !t.agotado);
  const [tipoId, setTipoId] = useState(null);
  const [cantidad, setCantidad] = useState(1);
  const [confirmar, setConfirmar] = useState(false);
  const crear = useCrearCompra();

  if (!evento.compraAbierta) {
    return (
      <Card mode="contained">
        <Card.Content>
          <Text variant="bodyLarge">La venta de entradas para este evento terminó</Text>
        </Card.Content>
      </Card>
    );
  }
  if (disponibles.length === 0) {
    return (
      <Card mode="contained">
        <Card.Content>
          <Text variant="bodyLarge">Las entradas están agotadas</Text>
        </Card.Content>
      </Card>
    );
  }

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
    <Card mode="outlined">
      <Card.Title title="Comprar entradas" subtitle={`Máximo ${evento.maxEntradasPorCompra} por compra`} />
      <Card.Content style={estilos.contenido}>
        <RadioButton.Group value={tipoId ?? ''} onValueChange={elegir}>
          {disponibles.map((t) => (
            <RadioButton.Item
              key={t.id}
              value={t.id}
              label={`${t.nombre} · ${formatearPrecio(t.precio)}`}
              accessibilityLabel={`Elegir ${t.nombre}`}
              position="leading"
              labelStyle={estilos.opcion}
            />
          ))}
        </RadioButton.Group>
        {tipo ? (
          <View style={estilos.fila}>
            <SelectorCantidad valor={cantidad} maximo={maximo} onCambiar={setCantidad} />
            <Text variant="titleMedium">Total {formatearPrecio(tipo.precio * cantidad)}</Text>
          </View>
        ) : null}
        <ErroresFormulario error={crear.error} />
        <Button
          mode="contained"
          icon="ticket"
          disabled={!tipo || crear.isPending}
          loading={crear.isPending}
          onPress={() => (evento.avisoNoCancelable ? setConfirmar(true) : comprar())}
        >
          Comprar
        </Button>
      </Card.Content>

      <Portal>
        <Dialog visible={confirmar} onDismiss={() => setConfirmar(false)}>
          <Dialog.Title>Atención</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">
              Faltan menos de 30 minutos para el evento: esta compra no se podrá cancelar.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setConfirmar(false)}>Volver</Button>
            <Button onPress={comprar}>Comprar igual</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </Card>
  );
}

const estilos = StyleSheet.create({
  contenido: { gap: 8 },
  opcion: { textAlign: 'left' },
  fila: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});
