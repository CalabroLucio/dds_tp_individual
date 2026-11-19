import { FlatList, StyleSheet, View } from 'react-native';
import { Card, FAB, Text } from 'react-native-paper';
import { router } from 'expo-router';
import { useMisEventos } from '../../hooks/useEventos';
import { Cargando } from '../../components/Cargando';
import { MensajeError } from '../../components/MensajeError';
import { EstadoVacio } from '../../components/EstadoVacio';
import { formatearFecha, formatearPrecio } from '../../utils/formato';

export default function PantallaMisEventos() {
  const eventos = useMisEventos();

  if (eventos.isPending) return <Cargando />;
  if (eventos.isError) return <MensajeError error={eventos.error} onReintentar={eventos.refetch} />;

  return (
    <View style={estilos.flex}>
      <FlatList
        data={eventos.data}
        keyExtractor={(e) => e.id}
        contentContainerStyle={estilos.lista}
        refreshing={eventos.isRefetching}
        onRefresh={eventos.refetch}
        ListEmptyComponent={
          <EstadoVacio
            icono="calendar-plus"
            titulo="Todavía no publicaste eventos"
            descripcion="Creá tu primer evento con sus tipos de entrada."
          />
        }
        renderItem={({ item }) => (
          <Card
            mode="elevated"
            onPress={() => router.push(`/evento/${item.id}/compras`)}
            accessibilityLabel={`Evento ${item.nombre}`}
          >
            <Card.Title
              title={item.nombre}
              subtitle={`${item.categoria.nombre} · ${formatearFecha(item.fecha)}`}
            />
            <Card.Content>
              <Text variant="bodyMedium">Desde {formatearPrecio(item.precioDesde)}</Text>
            </Card.Content>
          </Card>
        )}
      />
      <FAB
        icon="plus"
        label="Nuevo evento"
        style={estilos.fab}
        onPress={() => router.push('/evento/nuevo')}
      />
    </View>
  );
}

const estilos = StyleSheet.create({
  flex: { flex: 1 },
  lista: { padding: 16, gap: 12, paddingBottom: 96, flexGrow: 1 },
  fab: { position: 'absolute', right: 16, bottom: 16 },
});
