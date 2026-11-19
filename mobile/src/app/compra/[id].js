import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, RadioButton, Text } from 'react-native-paper';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useCompra, useMarcarUtilizada, useMediosPago, usePagar } from '../../hooks/useCompras';
import { useSession } from '../../session/SessionProvider';
import { Cargando } from '../../components/Cargando';
import { MensajeError } from '../../components/MensajeError';
import { ChipEstado } from '../../components/ChipEstado';
import { CuentaRegresiva } from '../../components/CuentaRegresiva';
import { ErroresFormulario } from '../../components/ErroresFormulario';
import { AccionCancelar } from '../../components/AccionCancelar';
import { Historial } from '../../components/Historial';
import { Chat } from '../../components/Chat';
import { FormularioResenia, ReseniaPropia } from '../../components/FormularioResenia';
import { formatearFecha, formatearPrecio, textoSeguimiento } from '../../utils/formato';

// Detalle de una compra. Cada historia agrega su sección (pago, cancelación, historial, chat, reseña) y cada
// acción aparece solo si el backend la habilita en `acciones`.
export default function PantallaCompra() {
  const { id } = useLocalSearchParams();
  const compra = useCompra(id);
  const { usuario } = useSession();

  if (compra.isPending) return <Cargando />;
  if (compra.isError) return <MensajeError error={compra.error} onReintentar={compra.refetch} />;
  const c = compra.data;

  return (
    <ScrollView contentContainerStyle={estilos.contenido}>
      <Stack.Screen options={{ title: 'Mi compra' }} />
      <Card mode="elevated">
        <Card.Content style={estilos.resumen}>
          <ChipEstado estado={c.estado} />
          {usuario?.rol === 'ORGANIZADOR' ? (
            <Text variant="titleMedium" accessibilityLabel="Comprador">
              {`${c.comprador.nombre} ${c.comprador.apellido}`}
            </Text>
          ) : null}
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
      {c.acciones.puedeCancelar ? <AccionCancelar compra={c} /> : null}
      {c.acciones.puedeMarcarUtilizada ? <AccionUtilizar compraId={c.id} /> : null}
      {c.acciones.puedeResenar ? <FormularioResenia compraId={c.id} /> : null}
      {c.resenia ? <ReseniaPropia resenia={c.resenia} /> : null}
      <Historial historial={c.historial} />
      <Chat compraId={c.id} />
    </ScrollView>
  );
}

function AccionUtilizar({ compraId }) {
  const marcar = useMarcarUtilizada(compraId);
  return (
    <View style={estilos.pago}>
      <ErroresFormulario error={marcar.error} />
      <Button
        mode="contained"
        icon="ticket-confirmation"
        loading={marcar.isPending}
        disabled={marcar.isPending}
        onPress={() => marcar.mutate()}
      >
        Marcar como utilizada
      </Button>
    </View>
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
