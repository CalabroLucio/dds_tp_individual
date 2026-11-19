import { FlatList, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useComprasDeEvento } from '../../../hooks/useEventos';
import { ResumenCupos } from '../../../components/ResumenCupos';
import { TarjetaCompra } from '../../../components/TarjetaCompra';
import { Cargando } from '../../../components/Cargando';
import { MensajeError } from '../../../components/MensajeError';
import { EstadoVacio } from '../../../components/EstadoVacio';
import { formatearFecha } from '../../../utils/formato';

export default function PantallaComprasDeEvento() {
  const { id } = useLocalSearchParams();
  const datos = useComprasDeEvento(id);
  if (datos.isPending) return <Cargando />;
  if (datos.isError) return <MensajeError error={datos.error} onReintentar={datos.refetch} />;
  const { evento, tiposEntrada, compras } = datos.data;

  return (
    <FlatList
      data={compras}
      keyExtractor={(c) => c.id}
      contentContainerStyle={estilos.lista}
      refreshing={datos.isRefetching}
      onRefresh={datos.refetch}
      ListHeaderComponent={
        <View style={estilos.encabezado}>
          <Stack.Screen options={{ title: evento.nombre }} />
          <Text variant="titleLarge" style={estilos.titulo}>
            {evento.nombre}
          </Text>
          <Text variant="bodyMedium">{formatearFecha(evento.fecha)}</Text>
          <ResumenCupos tiposEntrada={tiposEntrada} />
          <Text variant="titleMedium">{`Compras (${compras.length})`}</Text>
        </View>
      }
      ListEmptyComponent={
        <EstadoVacio icono="ticket-outline" titulo="Todavía no hay compras para este evento" />
      }
      renderItem={({ item }) => (
        <TarjetaCompra compra={item} mostrarComprador onPress={() => router.push(`/compra/${item.id}`)} />
      )}
    />
  );
}

const estilos = StyleSheet.create({
  lista: { padding: 16, gap: 12, flexGrow: 1 },
  encabezado: { gap: 8, marginBottom: 4 },
  titulo: { fontWeight: '800' },
});
