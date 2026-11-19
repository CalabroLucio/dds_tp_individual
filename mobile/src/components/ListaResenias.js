import { StyleSheet, View } from 'react-native';
import { Avatar, Text } from 'react-native-paper';
import { Estrellas } from './Puntaje';
import { colores, radios } from '../theme/tema';

// Reseñas de eventos anteriores del organizador (consigna: "conocer experiencias previas antes de comprar").
export function ListaResenias({ resenias }) {
  if (resenias.length === 0) {
    return (
      <Text variant="bodyMedium" style={estilos.vacio}>
        Este organizador todavía no tiene reseñas
      </Text>
    );
  }
  return (
    <View style={estilos.lista}>
      {resenias.map((r) => (
        <View key={r.id} style={estilos.resenia}>
          <View style={estilos.fila}>
            <Avatar.Text
              size={34}
              label={`${r.comprador.nombre[0]}${r.comprador.apellido[0]}`}
              style={estilos.avatar}
              color={colores.texto}
            />
            <View style={estilos.flex}>
              <Text variant="titleSmall">{`${r.comprador.nombre} ${r.comprador.apellido[0]}.`}</Text>
              <Text variant="bodySmall" style={estilos.secundario}>{`en ${r.evento.nombre}`}</Text>
            </View>
            <Estrellas puntaje={r.puntaje} />
          </View>
          <Text variant="bodyMedium">{r.comentario}</Text>
        </View>
      ))}
    </View>
  );
}

const estilos = StyleSheet.create({
  lista: { gap: 10 },
  resenia: { gap: 10, padding: 14, borderRadius: radios.tarjeta, backgroundColor: colores.superficie },
  fila: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  flex: { flex: 1 },
  avatar: { backgroundColor: colores.superficieAlta },
  secundario: { color: colores.textoSecundario },
  vacio: { color: colores.textoSecundario },
});
