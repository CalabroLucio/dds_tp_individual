import { ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { Avatar, Icon, Text } from 'react-native-paper';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useEvento } from '../../hooks/useEventos';
import { Cargando } from '../../components/Cargando';
import { MensajeError } from '../../components/MensajeError';
import { Puntaje } from '../../components/Puntaje';
import { ListaResenias } from '../../components/ListaResenias';
import { SeccionCompra } from '../../components/SeccionCompra';
import { BotonFavorito } from '../../components/BotonFavorito';
import { useSession } from '../../session/SessionProvider';
import { colores, radios } from '../../theme/tema';
import { formatearFecha, formatearPrecio } from '../../utils/formato';

const ALTO_PORTADA = 320;

export default function PantallaEvento() {
  const { id } = useLocalSearchParams();
  const evento = useEvento(id);
  const { usuario } = useSession();
  const { width } = useWindowDimensions();

  if (evento.isPending) return <Cargando />;
  if (evento.isError) return <MensajeError error={evento.error} onReintentar={evento.refetch} />;
  const e = evento.data;

  return (
    <ScrollView contentContainerStyle={estilos.scroll}>
      <Stack.Screen options={{ headerTransparent: true, title: '' }} />

      {/* Portada a sangre con degradé hacia el fondo */}
      <View style={estilos.portada}>
        {e.multimedia.length > 0 ? (
          <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}>
            {e.multimedia.map((url) => (
              <Image
                key={url}
                source={{ uri: url }}
                style={{ width, height: ALTO_PORTADA }}
                contentFit="cover"
                transition={250}
              />
            ))}
          </ScrollView>
        ) : (
          <View style={[estilos.sinImagen, { width }]}>
            <Icon source="ticket-outline" size={64} color={colores.borde} />
          </View>
        )}
        <LinearGradient
          colors={['rgba(14,15,18,0.55)', 'transparent', colores.fondo]}
          locations={[0, 0.4, 1]}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
      </View>

      <View style={estilos.contenido}>
        <Text variant="labelMedium" style={estilos.categoria}>
          {e.categoria.nombre.toUpperCase()}
        </Text>
        <View style={estilos.filaTitulo}>
          <Text variant="headlineMedium" style={estilos.flex}>
            {e.nombre}
          </Text>
          {usuario?.rol === 'COMPRADOR' ? (
            <BotonFavorito key={`${e.id}-${e.esFavorito}`} eventoId={e.id} esFavorito={e.esFavorito} />
          ) : null}
        </View>
        <View style={estilos.filaIcono}>
          <Icon source="calendar-blank-outline" size={18} color={colores.marca} />
          <Text variant="bodyLarge">{formatearFecha(e.fecha)}</Text>
        </View>

        <View style={estilos.organizador}>
          <Avatar.Text
            size={40}
            label={`${e.organizador.nombre[0]}${e.organizador.apellido[0]}`}
            style={estilos.avatar}
            color={colores.sobreMarca}
          />
          <View style={estilos.flex}>
            <Text variant="labelMedium" style={estilos.secundario}>
              ORGANIZA
            </Text>
            <Text variant="titleSmall">{`${e.organizador.nombre} ${e.organizador.apellido}`}</Text>
          </View>
          <Puntaje
            puntaje={e.organizador.puntaje}
            cantidad={e.organizador.cantidadResenias}
            tamano="grande"
          />
        </View>

        <Text variant="bodyLarge" style={estilos.descripcion}>
          {e.descripcion}
        </Text>

        <Text variant="titleLarge" style={estilos.seccion}>
          Entradas
        </Text>
        <View style={estilos.tipos}>
          {e.tiposEntrada.map((tipo, i) => (
            <View key={tipo.id} style={[estilos.tipo, i > 0 && estilos.tipoSeparado]}>
              <View style={estilos.flex}>
                <Text variant="titleSmall">{tipo.nombre}</Text>
                {tipo.descripcion ? (
                  <Text variant="bodySmall" style={estilos.secundario}>
                    {tipo.descripcion}
                  </Text>
                ) : null}
              </View>
              <View style={estilos.precio}>
                <Text variant="titleSmall" style={tipo.agotado ? estilos.tachado : estilos.precioTexto}>
                  {formatearPrecio(tipo.precio)}
                </Text>
                {tipo.agotado ? (
                  <Text variant="labelSmall" style={estilos.agotado}>
                    Agotado
                  </Text>
                ) : (
                  <Text
                    variant="bodySmall"
                    style={estilos.secundario}
                  >{`Quedan ${tipo.cupoDisponible}`}</Text>
                )}
              </View>
            </View>
          ))}
        </View>

        {usuario?.rol === 'COMPRADOR' ? <SeccionCompra evento={e} /> : null}

        <Text variant="titleLarge" style={estilos.seccion}>
          Reseñas del organizador
        </Text>
        <ListaResenias resenias={e.organizador.resenias} />
      </View>
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  scroll: { paddingBottom: 48 },
  portada: { height: ALTO_PORTADA, backgroundColor: colores.superficie },
  sinImagen: { height: ALTO_PORTADA, alignItems: 'center', justifyContent: 'center' },
  contenido: { paddingHorizontal: 16, gap: 12, marginTop: -32 },
  flex: { flex: 1 },
  categoria: { color: colores.marca, letterSpacing: 1 },
  filaTitulo: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  filaIcono: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  organizador: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: radios.tarjeta,
    backgroundColor: colores.superficie,
  },
  avatar: { backgroundColor: colores.marca },
  secundario: { color: colores.textoSecundario },
  descripcion: { color: colores.texto },
  seccion: { marginTop: 12 },
  tipos: { borderRadius: radios.tarjeta, backgroundColor: colores.superficie, overflow: 'hidden' },
  tipo: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  tipoSeparado: { borderTopWidth: 1, borderTopColor: colores.borde },
  precio: { alignItems: 'flex-end', gap: 2 },
  precioTexto: { color: colores.marca },
  tachado: { color: colores.textoSecundario, textDecorationLine: 'line-through' },
  agotado: { color: colores.error, letterSpacing: 1 },
});
