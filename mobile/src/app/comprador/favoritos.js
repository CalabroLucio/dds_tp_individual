import { FlatList, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useFavoritos } from '../../hooks/useFavoritos';
import { TarjetaEvento } from '../../components/TarjetaEvento';
import { BotonFavorito } from '../../components/BotonFavorito';
import { Cargando } from '../../components/Cargando';
import { MensajeError } from '../../components/MensajeError';
import { EstadoVacio } from '../../components/EstadoVacio';

export default function PantallaFavoritos() {
  const favoritos = useFavoritos();
  if (favoritos.isPending) return <Cargando />;
  if (favoritos.isError) return <MensajeError error={favoritos.error} onReintentar={favoritos.refetch} />;

  return (
    <FlatList
      data={favoritos.data}
      keyExtractor={(e) => e.id}
      contentContainerStyle={estilos.lista}
      refreshing={favoritos.isRefetching}
      onRefresh={favoritos.refetch}
      ListEmptyComponent={
        <EstadoVacio
          icono="heart-outline"
          titulo="Todavía no guardaste favoritos"
          descripcion="Tocá el corazón de un evento para guardarlo acá."
        />
      }
      renderItem={({ item }) => (
        <TarjetaEvento
          evento={item}
          onPress={() => router.push(`/evento/${item.id}`)}
          accion={<BotonFavorito eventoId={item.id} esFavorito={item.esFavorito} />}
        />
      )}
    />
  );
}

const estilos = StyleSheet.create({
  lista: { padding: 16, gap: 12, flexGrow: 1 },
});
