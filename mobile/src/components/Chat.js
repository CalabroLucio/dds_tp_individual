import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Card, HelperText, IconButton, Text, TextInput, useTheme } from 'react-native-paper';
import { useEnviarMensaje, useMensajes, INTERVALO_CHAT_MS } from '../hooks/useMensajes';
import { useSession } from '../session/SessionProvider';
import { formatearFechaHoraCorta } from '../utils/formato';

// Chat dentro de la compra: consultas sobre el evento, el acceso o cambios de fecha (casos de uso 5 y 6).
export function Chat({ compraId, intervalo = INTERVALO_CHAT_MS }) {
  const { colors } = useTheme();
  const { usuario } = useSession();
  const mensajes = useMensajes(compraId, intervalo);
  const enviar = useEnviarMensaje(compraId);
  const [texto, setTexto] = useState('');
  const vacio = texto.trim() === '';

  function mandar() {
    if (vacio) return;
    enviar.mutate(texto.trim(), { onSuccess: () => setTexto('') });
  }

  return (
    <Card mode="outlined">
      <Card.Title
        title={usuario?.rol === 'ORGANIZADOR' ? 'Chat con el comprador' : 'Chat con el organizador'}
        titleVariant="titleMedium"
      />
      <Card.Content style={estilos.contenido}>
        {(mensajes.data ?? []).length === 0 && !mensajes.isPending ? (
          <Text variant="bodyMedium" style={estilos.vacio}>
            Todavía no hay mensajes. Escribí tu consulta.
          </Text>
        ) : null}
        {(mensajes.data ?? []).map((m) => {
          const propio = m.autor.id === usuario?.id;
          return (
            <View
              key={m.id}
              accessible
              accessibilityLabel={
                propio ? `Mensaje tuyo: ${m.texto}` : `Mensaje de ${m.autor.nombre}: ${m.texto}`
              }
              style={[
                estilos.burbuja,
                propio
                  ? [estilos.propio, { backgroundColor: colors.primaryContainer }]
                  : [estilos.ajeno, { backgroundColor: colors.surfaceVariant }],
              ]}
            >
              {!propio ? (
                <Text variant="labelMedium" style={{ color: colors.primary }}>
                  {`${m.autor.nombre} · ${m.autor.rol === 'ORGANIZADOR' ? 'Organizador' : 'Comprador'}`}
                </Text>
              ) : null}
              <Text variant="bodyMedium">{m.texto}</Text>
              <Text variant="labelSmall" style={estilos.hora}>
                {formatearFechaHoraCorta(m.enviadoEn)}
              </Text>
            </View>
          );
        })}
        {enviar.error ? <HelperText type="error">{enviar.error.mensaje}</HelperText> : null}
        <View style={estilos.fila}>
          <TextInput
            style={estilos.flex}
            mode="outlined"
            dense
            placeholder="Escribí un mensaje…"
            accessibilityLabel="Escribir un mensaje"
            value={texto}
            onChangeText={setTexto}
            maxLength={500}
            multiline
          />
          <IconButton
            icon="send"
            mode="contained"
            accessibilityLabel="Enviar mensaje"
            disabled={vacio || enviar.isPending}
            onPress={mandar}
          />
        </View>
      </Card.Content>
    </Card>
  );
}

const estilos = StyleSheet.create({
  contenido: { gap: 8 },
  vacio: { opacity: 0.7 },
  burbuja: { maxWidth: '85%', borderRadius: 14, paddingHorizontal: 12, paddingVertical: 8, gap: 2 },
  propio: { alignSelf: 'flex-end', borderBottomRightRadius: 4 },
  ajeno: { alignSelf: 'flex-start', borderBottomLeftRadius: 4 },
  hora: { opacity: 0.6, alignSelf: 'flex-end' },
  fila: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  flex: { flex: 1 },
});
