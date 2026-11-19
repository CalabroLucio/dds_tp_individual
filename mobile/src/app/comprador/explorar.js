import { useMemo, useState } from 'react';
import { FlatList, ScrollView, StyleSheet, View } from 'react-native';
import { Chip, IconButton, Searchbar, SegmentedButtons, TextInput } from 'react-native-paper';
import { router } from 'expo-router';
import { useBuscarEventos, useCategorias } from '../../hooks/useEventos';
import { useDemora } from '../../hooks/useDemora';
import { TarjetaEvento } from '../../components/TarjetaEvento';
import { BotonFavorito } from '../../components/BotonFavorito';
import { Cargando } from '../../components/Cargando';
import { MensajeError } from '../../components/MensajeError';
import { EstadoVacio } from '../../components/EstadoVacio';

const ORDENES = [
  { value: 'fecha', label: 'Fecha', icon: 'calendar' },
  { value: 'precio', label: 'Precio', icon: 'cash' },
  { value: 'puntaje', label: 'Puntaje', icon: 'star' },
];

export default function PantallaExplorar() {
  const categorias = useCategorias();
  const [texto, setTexto] = useState('');
  const [categoriaId, setCategoriaId] = useState(null);
  const [orden, setOrden] = useState('fecha');
  const [mostrarPrecio, setMostrarPrecio] = useState(false);
  const [precioMin, setPrecioMin] = useState('');
  const [precioMax, setPrecioMax] = useState('');

  const q = useDemora(texto.trim());
  const min = useDemora(precioMin.trim());
  const max = useDemora(precioMax.trim());
  // Los filtros se envían tal cual: el backend busca, filtra y ordena (el front no decide).
  const criterios = useMemo(
    () => ({ q, categoriaId, orden, precioMin: min, precioMax: max }),
    [q, categoriaId, orden, min, max],
  );
  const eventos = useBuscarEventos(criterios);

  const encabezado = (
    <View style={estilos.filtros}>
      <View style={estilos.fila}>
        <Searchbar
          style={estilos.flex}
          placeholder="Buscar por nombre, descripción o categoría"
          accessibilityLabel="Buscar eventos"
          value={texto}
          onChangeText={setTexto}
        />
        <IconButton
          icon={mostrarPrecio ? 'filter-off-outline' : 'filter-variant'}
          mode={mostrarPrecio ? 'contained' : 'outlined'}
          accessibilityLabel="Filtrar por precio"
          onPress={() => setMostrarPrecio((v) => !v)}
        />
      </View>
      {mostrarPrecio ? (
        <View style={estilos.fila}>
          <TextInput
            style={estilos.flex}
            dense
            mode="outlined"
            label="Precio mínimo"
            accessibilityLabel="Precio mínimo"
            keyboardType="number-pad"
            value={precioMin}
            onChangeText={setPrecioMin}
          />
          <TextInput
            style={estilos.flex}
            dense
            mode="outlined"
            label="Precio máximo"
            accessibilityLabel="Precio máximo"
            keyboardType="number-pad"
            value={precioMax}
            onChangeText={setPrecioMax}
          />
        </View>
      ) : null}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={estilos.chips}>
        <Chip selected={categoriaId === null} showSelectedOverlay onPress={() => setCategoriaId(null)}>
          Todas
        </Chip>
        {(categorias.data ?? []).map((c) => (
          <Chip
            key={c.id}
            selected={categoriaId === c.id}
            showSelectedOverlay
            onPress={() => setCategoriaId(categoriaId === c.id ? null : c.id)}
          >
            {c.nombre}
          </Chip>
        ))}
      </ScrollView>
      <SegmentedButtons value={orden} onValueChange={setOrden} buttons={ORDENES} density="small" />
    </View>
  );

  return (
    <FlatList
      data={eventos.data ?? []}
      keyExtractor={(e) => e.id}
      contentContainerStyle={estilos.lista}
      ListHeaderComponent={encabezado}
      refreshing={eventos.isRefetching}
      onRefresh={eventos.refetch}
      ListEmptyComponent={
        eventos.isPending ? (
          <Cargando />
        ) : eventos.isError ? (
          <MensajeError error={eventos.error} onReintentar={eventos.refetch} />
        ) : (
          <EstadoVacio
            icono="magnify-close"
            titulo="No encontramos eventos"
            descripcion="Probá con otro texto, otra categoría u otro rango de precio."
          />
        )
      }
      renderItem={({ item }) => (
        <TarjetaEvento
          evento={item}
          onPress={() => router.push(`/evento/${item.id}`)}
          accion={
            <BotonFavorito
              key={`${item.id}-${item.esFavorito}`}
              eventoId={item.id}
              esFavorito={item.esFavorito}
            />
          }
        />
      )}
    />
  );
}

const estilos = StyleSheet.create({
  flex: { flex: 1 },
  lista: { padding: 16, gap: 12, flexGrow: 1 },
  filtros: { gap: 12, marginBottom: 4 },
  fila: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  chips: { gap: 8 },
});
