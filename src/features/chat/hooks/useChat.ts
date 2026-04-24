import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { chatApi } from '@shared/services/api';
import { useAuthStore } from '@features/auth/stores/authStore';
import { Conversation, Message } from '@shared/types';

export const chatQueryKeys = {
  all: ['chat'] as const,
  conversations: () => [...chatQueryKeys.all, 'conversations'] as const,
  messages: (id: number) => [...chatQueryKeys.all, 'messages', id] as const,
};

export const useConversations = () => {
  return useQuery<Conversation[]>({
    queryKey: chatQueryKeys.conversations(),
    queryFn: async () => {
      const { data } = await chatApi.getConversations();
      return data;
    },
    refetchInterval: 3000,
    refetchIntervalInBackground: false, // pause when tab is hidden
    refetchOnWindowFocus: true,         // immediate refetch on tab focus
    staleTime: 0,
  });
};

export const useMessages = (conversationId: number) => {
  return useQuery<Message[]>({
    queryKey: chatQueryKeys.messages(conversationId),
    queryFn: async () => {
      const { data } = await chatApi.getMessages(conversationId);
      return data;
    },
    enabled: !!conversationId,
    refetchInterval: 1500,              // 1.5 seconds — near real-time
    refetchIntervalInBackground: false, // pause when tab is hidden
    refetchOnWindowFocus: true,         // immediate refetch on tab focus
    staleTime: 0,
  });
};

export const useGetOrCreateConversation = () => {
  return useMutation({
    mutationFn: async ({ sellerId, productId }: { sellerId: number; productId?: number }) => {
      const { data } = await chatApi.getOrCreateConversation(sellerId, productId);
      return data as Conversation;
    },
  });
};

export const useSendMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ conversationId, content }: { conversationId: number; content: string }) => {
      const { data } = await chatApi.sendMessage(conversationId, content);
      return data as Message;
    },

    // Optimistic update — message appears instantly
    onMutate: async ({ conversationId, content }) => {
      // Cancel in-flight refetches to avoid overwriting the optimistic entry
      await queryClient.cancelQueries({ queryKey: chatQueryKeys.messages(conversationId) });

      const previousMessages = queryClient.getQueryData<Message[]>(
        chatQueryKeys.messages(conversationId)
      );

      const currentUser = useAuthStore.getState().user;

      const optimistic: Message = {
        id: -Date.now(),        // negative temporary id to identify optimistic messages
        conversation: conversationId,
        sender: currentUser?.id ?? 0,
        sender_name: currentUser?.username ?? '',
        content,
        is_read: false,
        created_at: new Date().toISOString(),
      };

      queryClient.setQueryData<Message[]>(
        chatQueryKeys.messages(conversationId),
        (old = []) => [...old, optimistic]
      );

      return { previousMessages, conversationId };
    },

    // On error: rollback to previous messages
    onError: (_err, _vars, context) => {
      if (context?.previousMessages !== undefined) {
        queryClient.setQueryData(
          chatQueryKeys.messages(context.conversationId),
          context.previousMessages
        );
      }
    },

    // Always sync with server after mutation (success or error)
    onSettled: (_data, _err, { conversationId }) => {
      queryClient.invalidateQueries({ queryKey: chatQueryKeys.messages(conversationId) });
      queryClient.invalidateQueries({ queryKey: chatQueryKeys.conversations() });
    },
  });
};

export const useDeleteConversation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (conversationId: number) => {
      const { data } = await chatApi.deleteConversation(conversationId);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: chatQueryKeys.conversations() });
    },
  });
};
