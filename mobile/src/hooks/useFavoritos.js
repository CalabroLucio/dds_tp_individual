import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { favoritosApi } from '../api/favoritos';
import { claves as clavesEventos } from './useEventos';

export const useFavoritos = () => useQuery({ queryKey: ['favoritos'], queryFn: favoritosApi.listar });

export function useAlternarFavorito(eventoId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (marcar) => (marcar ? favoritosApi.agregar(eventoId) : favoritosApi.quitar(eventoId)),
    onSettled: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ['favoritos'] }),
        queryClient.invalidateQueries({ queryKey: clavesEventos.eventos }),
      ]),
  });
}
