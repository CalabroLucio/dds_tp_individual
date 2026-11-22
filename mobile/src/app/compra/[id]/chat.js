import { KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Chat } from '../../../components/Chat';
import { useAlturaTeclado } from '../../../hooks/useAlturaTeclado';
import { useCompra } from '../../../hooks/useCompras';
import { useSession } from '../../../session/SessionProvider';
import { colores } from '../../../theme/tema';

// Chat a pantalla completa (decisión de diseño): más cómodo con el teclado que dentro del detalle de la compra.
export default function PantallaChat() {
  const { id } = useLocalSearchParams();
  const compra = useCompra(id);
  const { usuario } = useSession();
  const { bottom } = useSafeAreaInsets();
  const tecladoAndroid = useAlturaTeclado();
  const conQuien = usuario?.rol === 'ORGANIZADOR' ? 'el comprador' : 'el organizador';

  return (
    <KeyboardAvoidingView
      style={[estilos.flex, { paddingBottom: tecladoAndroid > 0 ? 0 : bottom }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <Stack.Screen options={{ title: compra.data ? `Chat con ${conQuien}` : 'Chat' }} />
      <Chat compraId={id} />
    </KeyboardAvoidingView>
  );
}

const estilos = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colores.fondo },
});
