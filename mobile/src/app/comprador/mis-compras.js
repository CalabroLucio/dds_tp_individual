import { FlatList, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useMisCompras } from '../../hooks/useCompras';
import { TarjetaCompra } from '../../components/TarjetaCompra';
import { Encabezado } from '../../components/Encabezado';
import { Cargando } from '../../components/Cargando';
import { MensajeError } from '../../components/MensajeError';
import { EstadoVacio } from '../../components/EstadoVacio';
import { ESPACIO_TAB } from '../../theme/tema';

export default function PantallaMisCompras() {
  const compras = useMisCompras();
  if (compras.isPending) return <Cargando />;
  if (compras.isError) return <MensajeError error={compras.error} onReintentar={compras.refetch} />;

  return (
    <FlatList
      data={compras.data}
      keyExtractor={(c) => c.id}
      contentContainerStyle={estilos.lista}
      ListHeaderComponent={<Encabezado antetitulo="Tus entradas" titulo="Mis compras" />}
      refreshing={compras.isRefetching}
      onRefresh={compras.refetch}
      ListEmptyComponent={
        <EstadoVacio
          icono="ticket-outline"
          titulo="Todavía no compraste entradas"
          descripcion="Explorá el catálogo y elegí tu próximo evento."
        />
      }
      renderItem={({ item }) => (
        <TarjetaCompra compra={item} onPress={() => router.push(`/compra/${item.id}`)} />
      )}
    />
  );
}

const estilos = StyleSheet.create({
  lista: { paddingHorizontal: 16, gap: 12, flexGrow: 1, paddingBottom: ESPACIO_TAB },
});
