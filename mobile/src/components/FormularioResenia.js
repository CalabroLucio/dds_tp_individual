import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, IconButton, Text, TextInput } from 'react-native-paper';
import { useReseniar } from '../hooks/useCompras';
import { ErroresFormulario } from './ErroresFormulario';
import { Estrellas } from './Puntaje';
import { colores, radios } from '../theme/tema';

const AMARILLO = colores.estrella;

// Reseña tras asistir (caso de uso 9). Las reglas (UTILIZADA, una sola, 1 a 5) las valida el backend.
export function FormularioResenia({ compraId }) {
  const reseniar = useReseniar(compraId);
  const [puntaje, setPuntaje] = useState(0);
  const [comentario, setComentario] = useState('');

  return (
    <View style={estilos.panel}>
      <View>
        <Text variant="titleMedium">¿Cómo estuvo el evento?</Text>
        <Text variant="bodySmall" style={estilos.secundario}>
          Tu reseña ayuda a otros compradores
        </Text>
      </View>
      <View style={estilos.contenido}>
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
      </View>
    </View>
  );
}

export function ReseniaPropia({ resenia }) {
  return (
    <View style={estilos.panel}>
      <View style={estilos.fila}>
        <Text variant="titleMedium">Tu reseña</Text>
        <Estrellas puntaje={resenia.puntaje} />
      </View>
      <Text variant="bodyMedium">{resenia.comentario}</Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  panel: { gap: 12, padding: 16, borderRadius: radios.tarjeta, backgroundColor: colores.superficie },
  secundario: { color: colores.textoSecundario },
  fila: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  contenido: { gap: 8 },
  estrellas: { flexDirection: 'row', justifyContent: 'center' },
});
