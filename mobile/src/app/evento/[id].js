import { ScrollView, StyleSheet, View } from 'react-native';
import { Card, Chip, Divider, Text } from 'react-native-paper';
import { Image } from 'expo-image';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useEvento } from '../../hooks/useEventos';
import { Cargando } from '../../components/Cargando';
import { MensajeError } from '../../components/MensajeError';
import { Puntaje } from '../../components/Puntaje';
import { ListaResenias } from '../../components/ListaResenias';
import { SeccionCompra } from '../../components/SeccionCompra';
import { BotonFavorito } from '../../components/BotonFavorito';
import { useSession } from '../../session/SessionProvider';
import { formatearFecha, formatearPrecio } from '../../utils/formato';

export default function PantallaEvento() {
  const { id } = useLocalSearchParams();
  const evento = useEvento(id);
  const { usuario } = useSession();

  if (evento.isPending) return <Cargando />;
  if (evento.isError) return <MensajeError error={evento.error} onReintentar={evento.refetch} />;
  const e = evento.data;

  return (
    <ScrollView contentContainerStyle={estilos.contenido}>
      <Stack.Screen options={{ title: e.nombre }} />
      {e.multimedia.length > 0 ? (
        <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} style={estilos.galeria}>
          {e.multimedia.map((url) => (
            <Image key={url} source={{ uri: url }} style={estilos.imagen} contentFit="cover" />
          ))}
        </ScrollView>
      ) : null}

      <View style={estilos.bloque}>
        <View style={estilos.filaTitulo}>
          <Text variant="headlineSmall" style={[estilos.titulo, estilos.flex]}>
            {e.nombre}
          </Text>
          {usuario?.rol === 'COMPRADOR' ? (
            <BotonFavorito key={`${e.id}-${e.esFavorito}`} eventoId={e.id} esFavorito={e.esFavorito} />
          ) : null}
        </View>
        <View style={estilos.chips}>
          <Chip compact icon="tag-outline">
            {e.categoria.nombre}
          </Chip>
          <Chip compact icon="calendar">
            {formatearFecha(e.fecha)}
          </Chip>
        </View>
        <Text variant="bodyLarge">{e.descripcion}</Text>
      </View>

      <Card mode="contained">
        <Card.Title
          title={`${e.organizador.nombre} ${e.organizador.apellido}`}
          subtitle="Organizador"
          right={() => (
            <View style={estilos.derecha}>
              <Puntaje
                puntaje={e.organizador.puntaje}
                cantidad={e.organizador.cantidadResenias}
                tamano="grande"
              />
            </View>
          )}
        />
      </Card>

      <Text variant="titleMedium">Entradas</Text>
      <Card mode="outlined">
        {e.tiposEntrada.map((tipo, i) => (
          <View key={tipo.id}>
            {i > 0 ? <Divider /> : null}
            <View style={estilos.tipo}>
              <View style={estilos.flex}>
                <Text variant="titleSmall">{tipo.nombre}</Text>
                {tipo.descripcion ? (
                  <Text variant="bodySmall" style={estilos.secundario}>
                    {tipo.descripcion}
                  </Text>
                ) : null}
              </View>
              <View style={estilos.precio}>
                <Text variant="titleSmall">{formatearPrecio(tipo.precio)}</Text>
                {tipo.agotado ? (
                  <Chip compact style={estilos.agotado}>
                    Agotado
                  </Chip>
                ) : (
                  <Text
                    variant="bodySmall"
                    style={estilos.secundario}
                  >{`Quedan ${tipo.cupoDisponible}`}</Text>
                )}
              </View>
            </View>
          </View>
        ))}
      </Card>

      {usuario?.rol === 'COMPRADOR' ? <SeccionCompra evento={e} /> : null}

      <Text variant="titleMedium">Reseñas del organizador</Text>
      <ListaResenias resenias={e.organizador.resenias} />
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  contenido: { padding: 16, gap: 16, paddingBottom: 48 },
  galeria: { marginHorizontal: -16, marginTop: -16 },
  imagen: { width: 360, height: 200 },
  bloque: { gap: 8 },
  titulo: { fontWeight: '800' },
  filaTitulo: { flexDirection: 'row', alignItems: 'center' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  derecha: { paddingRight: 16 },
  tipo: { flexDirection: 'row', padding: 12, gap: 12, alignItems: 'center' },
  flex: { flex: 1 },
  precio: { alignItems: 'flex-end', gap: 2 },
  secundario: { opacity: 0.7 },
  agotado: { backgroundColor: '#ECECEC' },
});
