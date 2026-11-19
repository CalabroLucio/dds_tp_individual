import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { eventosApi } from '../api/eventos';

export const claves = {
  categorias: ['categorias'],
  eventos: ['eventos'],
  misEventos: ['eventos', 'mios'],
  evento: (id) => ['eventos', 'detalle', id],
};

export const useCategorias = () =>
  useQuery({ queryKey: claves.categorias, queryFn: eventosApi.categorias, staleTime: Infinity });

export const useMisEventos = () => useQuery({ queryKey: claves.misEventos, queryFn: eventosApi.misEventos });

export const useEvento = (id) =>
  useQuery({ queryKey: claves.evento(id), queryFn: () => eventosApi.detalle(id), enabled: Boolean(id) });

export function useCrearEvento() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: eventosApi.crear,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: claves.eventos }),
  });
}
