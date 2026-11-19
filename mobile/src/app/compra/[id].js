import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Icon, RadioButton, Text, TouchableRipple } from 'react-native-paper';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useCompra, useMarcarUtilizada, useMediosPago, usePagar } from '../../hooks/useCompras';
import { useSession } from '../../session/SessionProvider';
import { Cargando } from '../../components/Cargando';
import { MensajeError } from '../../components/MensajeError';
import { EntradaDigital } from '../../components/EntradaDigital';
import { CuentaRegresiva } from '../../components/CuentaRegresiva';
import { ErroresFormulario } from '../../components/ErroresFormulario';
import { AccionCancelar } from '../../components/AccionCancelar';
import { Historial } from '../../components/Historial';
import { FormularioResenia, ReseniaPropia } from '../../components/FormularioResenia';
import { colores, radios } from '../../theme/tema';
import { formatearPrecio } from '../../utils/formato';

// Detalle de una compra como entrada digital. Cada acción aparece solo si el backend la habilita en `acciones`.
export default function PantallaCompra() {
  const { id } = useLocalSearchParams();
  const compra = useCompra(id);
  const { usuario } = useSession();

  if (compra.isPending) return <Cargando />;
  if (compra.isError) return <MensajeError error={compra.error} onReintentar={compra.refetch} />;
  const c = compra.data;
  const esOrganizador = usuario?.rol === 'ORGANIZADOR';

  return (
    <ScrollView contentContainerStyle={estilos.contenido}>
      <Stack.Screen options={{ title: esOrganizador ? 'Compra' : 'Mi entrada' }} />
      <EntradaDigital compra={c} mostrarComprador={esOrganizador} />

      {c.acciones.puedePagar ? <SeccionPago compra={c} /> : null}
      {c.acciones.puedeMarcarUtilizada ? <AccionUtilizar compraId={c.id} /> : null}
      {c.acciones.puedeResenar ? <FormularioResenia compraId={c.id} /> : null}
      {c.resenia ? <ReseniaPropia resenia={c.resenia} /> : null}

      <TouchableRipple
        onPress={() => router.push(`/compra/${c.id}/chat`)}
        accessibilityRole="button"
        accessibilityLabel="Abrir chat"
        borderless
        style={estilos.filaChat}
      >
        <View style={estilos.filaChatContenido}>
          <View style={estilos.iconoChat}>
            <Icon source="chat-outline" size={20} color={colores.marca} />
          </View>
          <View style={estilos.flex}>
            <Text variant="titleSmall">
              {esOrganizador ? 'Chat con el comprador' : 'Chat con el organizador'}
            </Text>
            <Text variant="bodySmall" style={estilos.secundario}>
              Consultas sobre el evento, el acceso o cambios
            </Text>
          </View>
          <Icon source="chevron-right" size={22} color={colores.textoSecundario} />
        </View>
      </TouchableRipple>

      {c.acciones.puedeCancelar ? <AccionCancelar compra={c} /> : null}
      <Historial historial={c.historial} />
    </ScrollView>
  );
}

function AccionUtilizar({ compraId }) {
  const marcar = useMarcarUtilizada(compraId);
  return (
    <View style={estilos.seccion}>
      <ErroresFormulario error={marcar.error} />
      <Button
        mode="contained"
        icon="ticket-confirmation"
        loading={marcar.isPending}
        disabled={marcar.isPending}
        onPress={() => marcar.mutate()}
        contentStyle={estilos.botonGrande}
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
    <View style={[estilos.seccion, estilos.panel]}>
      <Text variant="titleMedium">Pagar</Text>
      <Text variant="bodySmall" style={estilos.secundario}>
        Pago simulado: no se cobra dinero real
      </Text>
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
              style={estilos.itemRadio}
            />
          ))}
        </RadioButton.Group>
      )}
      <ErroresFormulario error={pagar.error} />
      <Button
        mode="contained"
        icon="credit-card-check-outline"
        disabled={!medio || pagar.isPending}
        loading={pagar.isPending}
        onPress={() => pagar.mutate(medio)}
        contentStyle={estilos.botonGrande}
      >
        {`Pagar ${formatearPrecio(compra.total)}`}
      </Button>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenido: { padding: 16, gap: 16, paddingBottom: 48 },
  flex: { flex: 1 },
  seccion: { gap: 8 },
  panel: { backgroundColor: colores.superficie, borderRadius: radios.tarjeta, padding: 16 },
  secundario: { color: colores.textoSecundario },
  opcion: { textAlign: 'left' },
  itemRadio: { paddingHorizontal: 0 },
  botonGrande: { paddingVertical: 6 },
  filaChat: { borderRadius: radios.tarjeta },
  filaChatContenido: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: radios.tarjeta,
    backgroundColor: colores.superficie,
  },
  iconoChat: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colores.marcaSuave,
  },
});
