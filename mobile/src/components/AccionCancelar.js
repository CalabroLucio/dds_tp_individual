import { useState } from 'react';
import { Button, Dialog, Portal, Text } from 'react-native-paper';
import { useCancelar } from '../hooks/useCompras';
import { ErroresFormulario } from './ErroresFormulario';

export function AccionCancelar({ compra }) {
  const [abierto, setAbierto] = useState(false);
  const cancelar = useCancelar(compra.id);
  const conReembolso = compra.estado === 'CONFIRMADA';

  return (
    <>
      <ErroresFormulario error={cancelar.error} />
      <Button
        mode="outlined"
        icon="close-circle-outline"
        textColor="#B3261E"
        loading={cancelar.isPending}
        disabled={cancelar.isPending}
        onPress={() => setAbierto(true)}
      >
        Cancelar compra
      </Button>
      <Portal>
        <Dialog visible={abierto} onDismiss={() => setAbierto(false)}>
          <Dialog.Title>¿Cancelar la compra?</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">
              {conReembolso
                ? 'Vas a recibir el reembolso del total y las entradas quedan libres para otras personas.'
                : 'La compra todavía no está pagada: se cancela sin reembolso y se liberan las entradas.'}
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setAbierto(false)}>Volver</Button>
            <Button
              onPress={() => {
                setAbierto(false);
                cancelar.mutate();
              }}
            >
              Sí, cancelar
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </>
  );
}
