import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { comprasApi } from '../api/compras';
import { claves as clavesEventos } from './useEventos';

export const clavesCompras = {
  compras: ['compras'],
  compra: (id) => ['compras', 'detalle', id],
  mediosPago: ['medios-pago'],
};

export const useMisCompras = () => useQuery({ queryKey: ['compras', 'mias'], queryFn: comprasApi.mias });

export const useCompra = (id) =>
  useQuery({
    queryKey: clavesCompras.compra(id),
    queryFn: () => comprasApi.detalle(id),
    enabled: Boolean(id),
  });

export const useMediosPago = () =>
  useQuery({ queryKey: clavesCompras.mediosPago, queryFn: comprasApi.mediosPago, staleTime: Infinity });

// Toda mutación sobre compras invalida compras y eventos: cambian estados y cupos disponibles.
function useInvalidarCompras() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: clavesCompras.compras }),
      queryClient.invalidateQueries({ queryKey: clavesEventos.eventos }),
    ]);
}

export function useCrearCompra() {
  const invalidar = useInvalidarCompras();
  return useMutation({ mutationFn: comprasApi.crear, onSuccess: invalidar });
}

export function useCancelar(id) {
  const invalidar = useInvalidarCompras();
  return useMutation({ mutationFn: () => comprasApi.cancelar(id), onSettled: invalidar });
}

export function useMarcarUtilizada(id) {
  const invalidar = useInvalidarCompras();
  return useMutation({ mutationFn: () => comprasApi.marcarUtilizada(id), onSettled: invalidar });
}

export function useReseniar(id) {
  const invalidar = useInvalidarCompras();
  return useMutation({ mutationFn: (resenia) => comprasApi.reseniar(id, resenia), onSuccess: invalidar });
}

export function usePagar(id) {
  const invalidar = useInvalidarCompras();
  return useMutation({ mutationFn: (medioPago) => comprasApi.pagar(id, medioPago), onSettled: invalidar });
}
