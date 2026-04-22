import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@shared/services/api';
import { queryKeys } from '@shared/lib/queryKeys';
import { MerchantStats, Order, Product, Review, SubOrder } from '@shared/types';

export const useMerchantStats = () => {
  return useQuery<MerchantStats>({
    queryKey: queryKeys.merchant.stats,
    queryFn: async () => {
      const { data } = await api.get('/merchant/stats/');
      return data;
    },
  });
};

export const useMerchantOrders = () => {
  return useQuery<SubOrder[]>({
    queryKey: queryKeys.merchant.orders,
    queryFn: async () => {
      const { data } = await api.get('/merchant/suborders/');
      return data.results ?? data;
    },
  });
};

export const useUpdateOrderStatus = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, status }: { id: string | number; status: string }) => {
      const { data } = await api.patch(`/merchant/suborders/${id}/status/`, { status });
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.merchant.orders });
      queryClient.invalidateQueries({ queryKey: queryKeys.merchant.orderDetail(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.merchant.stats });
    },
  });
};

export const useProductDetail = (slug: string) => {
  return useQuery<Product>({
    queryKey: queryKeys.products.detail(slug),
    queryFn: async () => {
      const { data } = await api.get(`/products/${slug}/`);
      return data;
    },
    enabled: !!slug,
  });
};

export const useProductReviews = (productId: number | string) => {
  return useQuery<Review[]>({
    queryKey: queryKeys.reviews(productId),
    queryFn: async () => {
      const { data } = await api.get('/reviews/products/', { params: { product: productId } });
      return data.results ?? data;
    },
    enabled: !!productId,
  });
};

export const useMerchantOrderDetail = (id: string | number) => {
  return useQuery<SubOrder>({
    queryKey: queryKeys.merchant.orderDetail(id),
    queryFn: async () => {
      const { data } = await api.get(`/merchant/suborders/${id}/`);
      return data;
    },
    enabled: !!id,
  });
};

export const useApprovePaymentProof = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (proofId: number) => {
      const { data } = await api.post(`/merchant/payments/${proofId}/approve/`);
      return data;
    },
    onSuccess: (data) => {
       queryClient.invalidateQueries({ queryKey: queryKeys.merchant.orders });
       if (data.id) queryClient.invalidateQueries({ queryKey: queryKeys.merchant.orderDetail(data.id) });
    }
  });
};

export const useRejectPaymentProof = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ proofId, reason }: { proofId: number, reason: string }) => {
      const { data } = await api.post(`/merchant/payments/${proofId}/reject/`, { reason });
      return data;
    },
    onSuccess: (data) => {
       queryClient.invalidateQueries({ queryKey: queryKeys.merchant.orders });
       if (data.id) queryClient.invalidateQueries({ queryKey: queryKeys.merchant.orderDetail(data.id) });
    }
  });
};
