import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { chatApi } from '@shared/services/api';
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
    refetchInterval: 3000, // Polling every 3 seconds
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
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: chatQueryKeys.messages(data.conversation) });
      queryClient.invalidateQueries({ queryKey: chatQueryKeys.conversations() });
    },
  });
};
