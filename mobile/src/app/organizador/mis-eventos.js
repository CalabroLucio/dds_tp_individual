import { FlatList, StyleSheet, View } from 'react-native';
import { FAB } from 'react-native-paper';
import { router } from 'expo-router';
import { useMisEventos } from '../../hooks/useEventos';
import { TarjetaEvento } from '../../components/TarjetaEvento';
import { Encabezado } from '../../components/Encabezado';
import { Cargando } from '../../components/Cargando';
import { MensajeError } from '../../components/MensajeError';
import { EstadoVacio } from '../../components/EstadoVacio';
import { colores, ESPACIO_TAB } from '../../theme/tema';

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
        ListHeaderComponent={<Encabezado antetitulo="Panel del organizador" titulo="Mis eventos" />}
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
          <TarjetaEvento evento={item} onPress={() => router.push(`/evento/${item.id}/compras`)} />
        )}
      />
      <FAB
        icon="plus"
        label="Nuevo evento"
        style={estilos.fab}
        color={colores.sobreMarca}
        onPress={() => router.push('/evento/nuevo')}
      />
    </View>
  );
}

const estilos = StyleSheet.create({
  flex: { flex: 1 },
  lista: { paddingHorizontal: 16, gap: 12, flexGrow: 1, paddingBottom: ESPACIO_TAB + 72 },
  fab: { position: 'absolute', right: 16, bottom: ESPACIO_TAB - 8, backgroundColor: colores.marca },
});
