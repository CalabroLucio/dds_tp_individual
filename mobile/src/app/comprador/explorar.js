import { useMemo, useState } from 'react';
import { FlatList, ScrollView, StyleSheet, View } from 'react-native';
import { IconButton, Searchbar, Text, TextInput } from 'react-native-paper';
import { router } from 'expo-router';
import { useBuscarEventos, useCategorias } from '../../hooks/useEventos';
import { useDemora } from '../../hooks/useDemora';
import { useSession } from '../../session/SessionProvider';
import { TarjetaEvento } from '../../components/TarjetaEvento';
import { BotonFavorito } from '../../components/BotonFavorito';
import { ChipFiltro } from '../../components/ChipFiltro';
import { Encabezado } from '../../components/Encabezado';
import { Cargando } from '../../components/Cargando';
import { MensajeError } from '../../components/MensajeError';
import { EstadoVacio } from '../../components/EstadoVacio';
import { colores, ESPACIO_TAB, radios } from '../../theme/tema';

const ORDENES = [
  { valor: 'fecha', etiqueta: 'Fecha', icono: 'calendar-blank-outline' },
  { valor: 'precio', etiqueta: 'Precio', icono: 'cash' },
  { valor: 'puntaje', etiqueta: 'Puntaje', icono: 'star-outline' },
];

export default function PantallaExplorar() {
  const { usuario } = useSession();
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
      <Encabezado antetitulo={usuario ? `Hola, ${usuario.nombre}` : undefined} titulo="¿A dónde vamos?" />
      <View style={estilos.fila}>
        <Searchbar
          style={estilos.buscador}
          inputStyle={estilos.inputBuscador}
          placeholder="Buscar eventos, artistas, categorías"
          accessibilityLabel="Buscar eventos"
          value={texto}
          onChangeText={setTexto}
        />
        <IconButton
          icon={mostrarPrecio ? 'filter-off-outline' : 'tune-variant'}
          mode="contained"
          containerColor={mostrarPrecio ? colores.marca : colores.superficie}
          iconColor={mostrarPrecio ? colores.sobreMarca : colores.texto}
          size={22}
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
            left={<TextInput.Affix text="$" />}
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
            left={<TextInput.Affix text="$" />}
            value={precioMax}
            onChangeText={setPrecioMax}
          />
        </View>
      ) : null}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={estilos.chips}>
        <ChipFiltro
          etiqueta="Todas"
          seleccionado={categoriaId === null}
          onPress={() => setCategoriaId(null)}
        />
        {(categorias.data ?? []).map((c) => (
          <ChipFiltro
            key={c.id}
            etiqueta={c.nombre}
            seleccionado={categoriaId === c.id}
            onPress={() => setCategoriaId(categoriaId === c.id ? null : c.id)}
          />
        ))}
      </ScrollView>
      <View style={estilos.orden}>
        <Text variant="labelMedium" style={estilos.secundario}>
          ORDENAR
        </Text>
        {ORDENES.map((o) => (
          <ChipFiltro
            key={o.valor}
            etiqueta={o.etiqueta}
            icono={o.icono}
            seleccionado={orden === o.valor}
            onPress={() => setOrden(o.valor)}
          />
        ))}
      </View>
    </View>
  );

  return (
    <FlatList
      data={eventos.data ?? []}
      keyExtractor={(e) => e.id}
      contentContainerStyle={estilos.lista}
      ListHeaderComponent={encabezado}
      keyboardShouldPersistTaps="handled"
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
  lista: { paddingHorizontal: 16, gap: 12, flexGrow: 1, paddingBottom: ESPACIO_TAB },
  filtros: { gap: 12, marginBottom: 4 },
  fila: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  buscador: { flex: 1, borderRadius: radios.pildora, backgroundColor: colores.superficie },
  inputBuscador: { fontSize: 14 },
  chips: { gap: 8 },
  orden: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  secundario: { color: colores.textoSecundario, letterSpacing: 1 },
});
