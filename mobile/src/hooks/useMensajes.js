import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { mensajesApi } from '../api/mensajes';

export const INTERVALO_CHAT_MS = 3000;

// Polling cada 3 s (R4, SC-006: la otra parte ve el mensaje en menos de 10 s). Sin WebSockets.
export function useMensajes(compraId, intervalo = INTERVALO_CHAT_MS) {
  return useQuery({
    queryKey: ['mensajes', compraId],
    queryFn: () => mensajesApi.listar(compraId),
    refetchInterval: intervalo,
    refetchIntervalInBackground: false,
  });
}

export function useEnviarMensaje(compraId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (texto) => mensajesApi.enviar(compraId, texto),
    onSuccess: (mensaje) =>
      queryClient.setQueryData(['mensajes', compraId], (actuales = []) =>
        actuales.some((m) => m.id === mensaje.id) ? actuales : [...actuales, mensaje],
      ),
  });
}
