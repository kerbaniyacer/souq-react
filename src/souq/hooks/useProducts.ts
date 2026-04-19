import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productsApi, categoriesApi, brandsApi, reviewsApi } from '@souq/services/api';

export const QUERY_KEYS = {
  products: (params?: Record<string, string | number>) => ['products', params] as const,
  product: (slug: string) => ['products', slug] as const,
  categories: ['categories'] as const,
  brands: ['brands'] as const,
  reviews: (productId: number | string) => ['reviews', productId] as const,
  myProducts: ['products', 'mine'] as const,
};

export function useProducts(params?: Record<string, string | number>) {
  return useQuery({
    queryKey: QUERY_KEYS.products(params),
    queryFn: () => productsApi.list(params),
    select: (res) => res.data,
  });
}

export function useProduct(slug: string) {
  return useQuery({
    queryKey: QUERY_KEYS.product(slug),
    queryFn: () => productsApi.detail(slug),
    select: (res) => res.data,
    enabled: Boolean(slug),
  });
}

export function useCategories() {
  return useQuery({
    queryKey: QUERY_KEYS.categories,
    queryFn: () => categoriesApi.list(),
    select: (res) => res.data,
    staleTime: 1000 * 60 * 30,
  });
}

export function useBrands() {
  return useQuery({
    queryKey: QUERY_KEYS.brands,
    queryFn: () => brandsApi.list(),
    select: (res) => res.data,
    staleTime: 1000 * 60 * 30,
  });
}

export function useReviews(productId: number | string) {
  return useQuery({
    queryKey: QUERY_KEYS.reviews(productId),
    queryFn: () => reviewsApi.list(productId),
    select: (res) => res.data,
    enabled: Boolean(productId),
  });
}

export function useMyProducts() {
  return useQuery({
    queryKey: QUERY_KEYS.myProducts,
    queryFn: () => productsApi.myProducts(),
    select: (res) => res.data,
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: FormData) => productsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: FormData }) => productsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => productsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

export function useCreateReview(productId: number | string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: object) => reviewsApi.create(productId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.reviews(productId) });
    },
  });
}
