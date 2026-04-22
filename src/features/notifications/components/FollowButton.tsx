import React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { followApi } from '../services/notificationApi';
import { UserPlus, UserCheck } from 'lucide-react';
import { useAuthStore } from '@features/auth/stores/authStore';

interface FollowButtonProps {
  sellerId: number;
  sellerName?: string;
}

export const FollowButton: React.FC<FollowButtonProps> = ({ sellerId, sellerName }) => {
  const { isAuthenticated, user } = useAuthStore();
  const queryClient = useQueryClient();

  // If viewing own profile, hide button
  if (user?.id === sellerId) return null;

  const { data: followStatus, isLoading } = useQuery({
    queryKey: ['follow-status', sellerId],
    queryFn: async () => {
      // We can use a check endpoint or just rely on initial state if provided
      // For now, toggle follow also returns the state, but we need initial check.
      // Let's assume the API returns whether current user follows this seller.
      const res = await followApi.getFollows();
      const follows = res.data as any[];
      return follows.some(f => f.following === sellerId);
    },
    enabled: isAuthenticated,
  });

  const mutation = useMutation({
    mutationFn: () => followApi.toggleFollow(sellerId),
    onSuccess: (res) => {
      queryClient.setQueryData(['follow-status', sellerId], res.data.is_following);
    }
  });

  if (!isAuthenticated) return null;

  return (
    <button
      onClick={() => mutation.mutate()}
      disabled={isLoading || mutation.isPending}
      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold font-arabic transition-all active:scale-95 ${
        followStatus 
          ? 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700' 
          : 'bg-primary-400 text-white hover:bg-primary-500 shadow-md shadow-primary-400/20'
      }`}
    >
      {followStatus ? (
        <>
          <UserCheck className="w-4 h-4" />
          متابع
        </>
      ) : (
        <>
          <UserPlus className="w-4 h-4" />
          متابعة
        </>
      )}
    </button>
  );
};
