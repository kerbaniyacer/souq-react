import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ordersApi } from '@souq/services/api';

const QUERY_KEYS = {
  orders: ['orders'] as const,
  order: (id: number | string) => ['orders', id] as const,
  merchantOrders: ['orders', 'merchant'] as const,
};

export function useOrders() {
  return useQuery({
    queryKey: QUERY_KEYS.orders,
    queryFn: () => ordersApi.list(),
    select: (res) => res.data,
  });
}

export function useOrder(id: number | string) {
  return useQuery({
    queryKey: QUERY_KEYS.order(id),
    queryFn: () => ordersApi.detail(id),
    select: (res) => res.data,
    enabled: Boolean(id),
  });
}

export function useMerchantOrders() {
  return useQuery({
    queryKey: QUERY_KEYS.merchantOrders,
    queryFn: () => ordersApi.merchantList(),
    select: (res) => res.data,
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: object) => ordersApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.orders });
    },
  });
}

export function useCancelOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number | string) => ordersApi.cancel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.orders });
    },
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: number | string; status: string }) =>
      ordersApi.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}
