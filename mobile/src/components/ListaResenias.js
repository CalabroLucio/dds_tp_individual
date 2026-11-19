import { StyleSheet, View } from 'react-native';
import { Avatar, Card, Text } from 'react-native-paper';
import { Estrellas } from './Puntaje';

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
        <Card key={r.id} mode="contained">
          <Card.Title
            title={`${r.comprador.nombre} ${r.comprador.apellido[0]}.`}
            subtitle={`en ${r.evento.nombre}`}
            left={(props) => (
              <Avatar.Text
                {...props}
                size={36}
                label={`${r.comprador.nombre[0]}${r.comprador.apellido[0]}`}
              />
            )}
            right={() => (
              <View style={estilos.estrellas}>
                <Estrellas puntaje={r.puntaje} />
              </View>
            )}
          />
          <Card.Content>
            <Text variant="bodyMedium">{r.comentario}</Text>
          </Card.Content>
        </Card>
      ))}
    </View>
  );
}

const estilos = StyleSheet.create({
  lista: { gap: 8 },
  estrellas: { paddingRight: 16 },
  vacio: { opacity: 0.7 },
});
