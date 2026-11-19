import { useRef, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { HelperText, IconButton, Text, TextInput } from 'react-native-paper';
import { useEnviarMensaje, useMensajes, INTERVALO_CHAT_MS } from '../hooks/useMensajes';
import { useSession } from '../session/SessionProvider';
import { colores, fuentes, radios } from '../theme/tema';
import { formatearFechaHoraCorta } from '../utils/formato';

// Chat de la compra estilo mensajería (casos de uso 5 y 6): burbujas propias en verde a la derecha,
// ajenas a la izquierda e input fijo abajo. Se actualiza solo con polling.
export function Chat({ compraId, intervalo = INTERVALO_CHAT_MS }) {
  const { usuario } = useSession();
  const mensajes = useMensajes(compraId, intervalo);
  const enviar = useEnviarMensaje(compraId);
  const [texto, setTexto] = useState('');
  const lista = useRef(null);
  const vacio = texto.trim() === '';

  function mandar() {
    if (vacio) return;
    enviar.mutate(texto.trim(), { onSuccess: () => setTexto('') });
  }

  return (
    <View style={estilos.contenedor}>
      <FlatList
        ref={lista}
        data={mensajes.data ?? []}
        keyExtractor={(m) => m.id}
        contentContainerStyle={estilos.lista}
        onContentSizeChange={() => lista.current?.scrollToEnd({ animated: true })}
        ListEmptyComponent={
          mensajes.isPending ? null : (
            <Text variant="bodyMedium" style={estilos.vacio}>
              Todavía no hay mensajes. Escribí tu consulta.
            </Text>
          )
        }
        renderItem={({ item: m }) => {
          const propio = m.autor.id === usuario?.id;
          return (
            <View
              accessible
              accessibilityLabel={
                propio ? `Mensaje tuyo: ${m.texto}` : `Mensaje de ${m.autor.nombre}: ${m.texto}`
              }
              style={[estilos.burbuja, propio ? estilos.propio : estilos.ajeno]}
            >
              {!propio ? (
                <Text style={estilos.autor}>
                  {`${m.autor.nombre} · ${m.autor.rol === 'ORGANIZADOR' ? 'Organizador' : 'Comprador'}`}
                </Text>
              ) : null}
              <Text variant="bodyMedium" style={propio ? estilos.textoPropio : null}>
                {m.texto}
              </Text>
              <Text style={[estilos.hora, propio && estilos.horaPropia]}>
                {formatearFechaHoraCorta(m.enviadoEn)}
              </Text>
            </View>
          );
        }}
      />
      {enviar.error ? <HelperText type="error">{enviar.error.mensaje}</HelperText> : null}
      <View style={estilos.barra}>
        <TextInput
          style={estilos.input}
          mode="outlined"
          dense
          placeholder="Escribí un mensaje…"
          accessibilityLabel="Escribir un mensaje"
          value={texto}
          onChangeText={setTexto}
          maxLength={500}
          multiline
          outlineStyle={estilos.contornoInput}
        />
        <IconButton
          icon="send"
          mode="contained"
          containerColor={colores.marca}
          iconColor={colores.sobreMarca}
          size={22}
          accessibilityLabel="Enviar mensaje"
          disabled={vacio || enviar.isPending}
          onPress={mandar}
        />
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: colores.fondo },
  lista: { padding: 16, gap: 8, flexGrow: 1 },
  vacio: { color: colores.textoSecundario, textAlign: 'center', marginTop: 32 },
  burbuja: { maxWidth: '80%', borderRadius: 18, paddingHorizontal: 14, paddingVertical: 8, gap: 2 },
  propio: { alignSelf: 'flex-end', backgroundColor: colores.marca, borderBottomRightRadius: 4 },
  ajeno: { alignSelf: 'flex-start', backgroundColor: colores.superficieAlta, borderBottomLeftRadius: 4 },
  autor: { fontFamily: fuentes.semi, fontSize: 12, color: colores.marca },
  textoPropio: { color: colores.sobreMarca },
  hora: { fontFamily: fuentes.regular, fontSize: 10, color: colores.textoSecundario, alignSelf: 'flex-end' },
  horaPropia: { color: colores.sobreMarca, opacity: 0.7 },
  barra: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: colores.borde,
    backgroundColor: colores.superficie,
  },
  input: { flex: 1, maxHeight: 120, backgroundColor: colores.superficieAlta },
  contornoInput: { borderRadius: radios.input },
});
