import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Card, IconButton, Text, TextInput } from 'react-native-paper';
import { useReseniar } from '../hooks/useCompras';
import { ErroresFormulario } from './ErroresFormulario';
import { Estrellas } from './Puntaje';

const AMARILLO = '#F5A623';

// Reseña tras asistir (caso de uso 9). Las reglas (UTILIZADA, una sola, 1 a 5) las valida el backend.
export function FormularioResenia({ compraId }) {
  const reseniar = useReseniar(compraId);
  const [puntaje, setPuntaje] = useState(0);
  const [comentario, setComentario] = useState('');

  return (
    <Card mode="outlined">
      <Card.Title title="¿Cómo estuvo el evento?" subtitle="Tu reseña ayuda a otros compradores" />
      <Card.Content style={estilos.contenido}>
        <View style={estilos.estrellas}>
          {[1, 2, 3, 4, 5].map((n) => (
            <IconButton
              key={n}
              icon={n <= puntaje ? 'star' : 'star-outline'}
              iconColor={AMARILLO}
              size={32}
              accessibilityLabel={`Puntaje ${n} de 5`}
              onPress={() => setPuntaje(n)}
            />
          ))}
        </View>
        <TextInput
          mode="outlined"
          label="Comentario"
          accessibilityLabel="Comentario"
          value={comentario}
          onChangeText={setComentario}
          multiline
          maxLength={500}
        />
        <ErroresFormulario error={reseniar.error} />
        <Button
          mode="contained"
          icon="send"
          disabled={puntaje === 0 || reseniar.isPending}
          loading={reseniar.isPending}
          onPress={() => reseniar.mutate({ puntaje, comentario })}
        >
          Enviar reseña
        </Button>
      </Card.Content>
    </Card>
  );
}

export function ReseniaPropia({ resenia }) {
  return (
    <Card mode="contained">
      <Card.Title
        title="Tu reseña"
        right={() => (
          <View style={estilos.derecha}>
            <Estrellas puntaje={resenia.puntaje} />
          </View>
        )}
      />
      <Card.Content>
        <Text variant="bodyMedium">{resenia.comentario}</Text>
      </Card.Content>
    </Card>
  );
}

const estilos = StyleSheet.create({
  contenido: { gap: 8 },
  estrellas: { flexDirection: 'row', justifyContent: 'center' },
  derecha: { paddingRight: 16 },
});
