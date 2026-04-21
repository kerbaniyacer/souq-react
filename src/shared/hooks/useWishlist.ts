import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { wishlistApi } from '@shared/services/api';
import { queryKeys } from '@shared/lib/queryKeys';
import { WishlistItem } from '@shared/types';
import { useToast } from '@shared/stores/toastStore';

export const useWishlist = () => {
  return useQuery<WishlistItem[]>({
    queryKey: queryKeys.wishlist,
    queryFn: async () => {
      const { data } = await wishlistApi.get();
      return data;
    },
  });
};

export const useToggleWishlist = () => {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: async ({ productId, isAdded }: { productId: number; isAdded: boolean }) => {
      if (isAdded) {
        return wishlistApi.remove(productId);
      } else {
        return wishlistApi.add(productId);
      }
    },
    // Optimistic Update
    onMutate: async ({ productId, isAdded }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.wishlist });
      const previousWishlist = queryClient.getQueryData<WishlistItem[]>(queryKeys.wishlist);

      if (previousWishlist) {
        queryClient.setQueryData<WishlistItem[]>(queryKeys.wishlist, (old) => {
          if (!old) return [];
          if (isAdded) {
            return old.filter(item => item.product?.id !== productId);
          } else {
            // We don't have the full product object here, but we can add a placeholder
            // or just rely on the refetch. For a true optimistic update, we might need the product.
            return [...old, { id: Date.now(), product: { id: productId } } as WishlistItem];
          }
        });
      }

      return { previousWishlist };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousWishlist) {
        queryClient.setQueryData(queryKeys.wishlist, context.previousWishlist);
      }
      toast.error('حدث خطأ أثناء تحديث قائمة المفضلة');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.wishlist });
    },
  });
};
