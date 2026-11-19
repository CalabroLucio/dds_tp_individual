import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, RadioButton, Text } from 'react-native-paper';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useCompra, useMediosPago, usePagar } from '../../hooks/useCompras';
import { Cargando } from '../../components/Cargando';
import { MensajeError } from '../../components/MensajeError';
import { ChipEstado } from '../../components/ChipEstado';
import { CuentaRegresiva } from '../../components/CuentaRegresiva';
import { ErroresFormulario } from '../../components/ErroresFormulario';
import { formatearFecha, formatearPrecio, textoSeguimiento } from '../../utils/formato';

// Detalle de una compra. Cada historia agrega su sección (pago, cancelación, historial, chat, reseña) y cada
// acción aparece solo si el backend la habilita en `acciones`.
export default function PantallaCompra() {
  const { id } = useLocalSearchParams();
  const compra = useCompra(id);

  if (compra.isPending) return <Cargando />;
  if (compra.isError) return <MensajeError error={compra.error} onReintentar={compra.refetch} />;
  const c = compra.data;

  return (
    <ScrollView contentContainerStyle={estilos.contenido}>
      <Stack.Screen options={{ title: 'Mi compra' }} />
      <Card mode="elevated">
        <Card.Content style={estilos.resumen}>
          <ChipEstado estado={c.estado} />
          <Text variant="titleLarge" style={estilos.titulo}>
            {c.evento.nombre}
          </Text>
          <Text variant="bodyMedium">{formatearFecha(c.evento.fecha)}</Text>
          <Text variant="bodyMedium">
            {`${c.cantidad} × ${c.tipoEntrada.nombre} · ${formatearPrecio(c.tipoEntrada.precio)}`}
          </Text>
          <Text variant="titleMedium">Total {formatearPrecio(c.total)}</Text>
          {textoSeguimiento(c) ? (
            <Text variant="titleSmall" style={estilos.seguimiento}>
              {textoSeguimiento(c)}
            </Text>
          ) : null}
        </Card.Content>
      </Card>

      {c.acciones.puedePagar ? <SeccionPago compra={c} /> : null}
    </ScrollView>
  );
}

function SeccionPago({ compra }) {
  const medios = useMediosPago();
  const pagar = usePagar(compra.id);
  const [medio, setMedio] = useState(null);

  return (
    <Card mode="outlined">
      <Card.Title title="Pagar" subtitle="Pago simulado: no se cobra dinero real" />
      <Card.Content style={estilos.pago}>
        {compra.expiraEn ? <CuentaRegresiva hasta={compra.expiraEn} /> : null}
        {medios.isPending ? (
          <Cargando mensaje="Cargando medios de pago…" />
        ) : (
          <RadioButton.Group value={medio ?? ''} onValueChange={setMedio}>
            {(medios.data ?? []).map((m) => (
              <RadioButton.Item
                key={m.id}
                value={m.id}
                label={m.nombre}
                position="leading"
                labelStyle={estilos.opcion}
              />
            ))}
          </RadioButton.Group>
        )}
        <ErroresFormulario error={pagar.error} />
        <View>
          <Button
            mode="contained"
            icon="credit-card-check-outline"
            disabled={!medio || pagar.isPending}
            loading={pagar.isPending}
            onPress={() => pagar.mutate(medio)}
          >
            {`Pagar ${formatearPrecio(compra.total)}`}
          </Button>
        </View>
      </Card.Content>
    </Card>
  );
}

const estilos = StyleSheet.create({
  contenido: { padding: 16, gap: 16, paddingBottom: 48 },
  resumen: { gap: 6 },
  titulo: { fontWeight: '800' },
  seguimiento: { color: '#1E6B12' },
  pago: { gap: 8 },
  opcion: { textAlign: 'left' },
});
