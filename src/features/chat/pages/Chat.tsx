import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { 
  Send, 
  Search, 
  User, 
  MoreVertical, 
  ChevronRight,
  MessageSquare
} from 'lucide-react';
import { useConversations, useMessages, useSendMessage } from '../hooks/useChat';
import { useAuthStore } from '@features/auth/stores/authStore';
import { Conversation } from '@shared/types';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

export default function Chat() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeId = searchParams.get('conversationId');
  const { data: conversations = [], isLoading: loadingConversations } = useConversations();
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const { data: messages = [], isLoading: loadingMessages } = useMessages(Number(activeId));
  const { mutate: sendMessage } = useSendMessage();
  const [newMessage, setNewMessage] = useState('');
  const { user } = useAuthStore();
  const scrollRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (activeId && conversations.length > 0) {
      const found = conversations.find(c => String(c.id) === activeId);
      if (found) setSelectedConversation(found);
    }
  }, [activeId, conversations]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeId) return;

    sendMessage({ conversationId: Number(activeId), content: newMessage });
    setNewMessage('');
  };

  const selectConversation = (id: number) => {
    setSearchParams({ conversationId: String(id) });
  };

  return (
    <div className="flex h-[calc(100vh-80px)] bg-page-bg dark:bg-gray-950 overflow-hidden">
      {/* Sidebar - Conversations List */}
      <div className={`w-full md:w-80 lg:w-96 flex-shrink-0 bg-white dark:bg-[#1A1A1A] border-l border-gray-100 dark:border-gray-800 flex flex-col ${activeId ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-xl font-bold font-arabic mb-4 text-right">المحادثات</h2>
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="بحث في المحادثات..."
              className="w-full bg-gray-50 dark:bg-[#252525] border-none rounded-xl py-2.5 pr-10 text-sm font-arabic focus:ring-2 focus:ring-primary-400/30 text-right"
              dir="rtl"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar">
          {loadingConversations ? (
            <div className="flex justify-center p-8">
              <span className="w-8 h-8 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center p-12">
              <MessageSquare className="w-12 h-12 text-gray-200 dark:text-gray-800 mx-auto mb-4" />
              <p className="text-sm text-gray-400 font-arabic">لا توجد محادثات بعد</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50 dark:divide-gray-800/50">
              {conversations.map((conv) => {
                const otherUser = conv.customer === user?.id ? conv.seller_details : conv.customer_details;
                const isActive = String(conv.id) === activeId;
                
                return (
                  <button
                    key={conv.id}
                    onClick={() => selectConversation(conv.id)}
                    className={`w-full p-4 flex gap-3 items-start transition-colors hover:bg-gray-50 dark:hover:bg-[#222222] ${isActive ? 'bg-primary-50/50 dark:bg-primary-900/10 border-r-4 border-primary-400' : ''}`}
                  >
                    <div className="relative flex-shrink-0">
                      {otherUser?.photo ? (
                        <img src={otherUser.photo} className="w-12 h-12 rounded-full object-cover" />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-[#252525] flex items-center justify-center text-gray-400">
                          <User className="w-6 h-6" />
                        </div>
                      )}
                      {conv.unread_count > 0 && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white dark:border-[#1A1A1A]">
                          {conv.unread_count}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 text-right overflow-hidden">
                      <div className="flex justify-between items-baseline mb-1 gap-2">
                        <span className="text-[10px] text-gray-400 flex-shrink-0">
                          {conv.last_message ? format(new Date(conv.last_message.created_at), 'HH:mm', { locale: ar }) : ''}
                        </span>
                        <h3 className="font-bold text-sm truncate font-arabic">
                          {otherUser?.full_name || otherUser?.username}
                        </h3>
                      </div>
                      <p className={`text-xs truncate font-arabic ${conv.unread_count > 0 ? 'text-gray-900 dark:text-gray-100 font-bold' : 'text-gray-500'}`}>
                        {conv.last_message?.content || 'ابدأ المحادثة الآن...'}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className={`flex-1 flex flex-col bg-white dark:bg-[#121212] ${!activeId ? 'hidden md:flex' : 'flex'}`}>
        {activeId ? (
          <>
            {/* Chat Header */}
            <div className="p-3 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <button className="p-2 hover:bg-gray-100 dark:hover:bg-[#252525] rounded-full transition-colors">
                  <MoreVertical className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="flex items-center gap-3 text-right">
                <div className="hidden sm:block">
                  <h3 className="font-bold text-sm font-arabic">
                    {selectedConversation?.customer === user?.id 
                      ? (selectedConversation?.seller_details?.full_name || selectedConversation?.seller_details?.username)
                      : (selectedConversation?.customer_details?.full_name || selectedConversation?.customer_details?.username)}
                  </h3>
                  <p className="text-[10px] text-green-500 font-arabic">متصل الآن</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-[#252525] flex items-center justify-center overflow-hidden">
                   {(selectedConversation?.customer === user?.id 
                      ? selectedConversation?.seller_details?.photo 
                      : selectedConversation?.customer_details?.photo) ? (
                        <img 
                          src={selectedConversation?.customer === user?.id 
                            ? selectedConversation?.seller_details?.photo 
                            : selectedConversation?.customer_details?.photo} 
                          className="w-full h-full object-cover" 
                        />
                      ) : <User className="w-5 h-5 text-gray-400" />}
                </div>
                <button 
                  onClick={() => navigate('/chat')}
                  className="md:hidden p-2 hover:bg-gray-100 dark:hover:bg-[#252525] rounded-full transition-colors"
                >
                  <ChevronRight className="w-6 h-6 text-gray-500" />
                </button>
              </div>
            </div>

            {/* Product Preview Bar (If exists) */}
            {selectedConversation?.product_details && (
              <div className="px-4 py-2 bg-gray-50 dark:bg-gray-900/30 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between gap-4">
                <Link 
                  to={`/products/${selectedConversation.product_details.slug}`}
                  className="text-xs text-primary-600 hover:underline font-arabic flex items-center gap-1"
                >
                   <ChevronRight className="w-3 h-3 rotate-180" /> عرض المنتج
                </Link>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-xs font-bold font-arabic truncate max-w-[200px]">{selectedConversation.product_details.name}</p>
                    <p className="text-[10px] text-gray-500 font-mono">{Number(selectedConversation.product_details.variants?.[0]?.price || 0).toLocaleString('ar-DZ')} د.ج</p>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 overflow-hidden flex-shrink-0">
                    <img 
                      src={selectedConversation.product_details.main_image || ''} 
                      className="w-full h-full object-cover" 
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Messages Area */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-fixed"
            >
              {loadingMessages ? (
                <div className="flex justify-center p-8">
                  <span className="w-8 h-8 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center py-20 opacity-20 grayscale">
                  <MessageSquare className="w-20 h-20 mx-auto mb-4" />
                  <p className="font-arabic">أرسل رسالة لبدء المحادثة</p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isMine = msg.sender === user?.id;
                  return (
                    <div 
                      key={msg.id} 
                      className={`flex ${isMine ? 'justify-start' : 'justify-end'}`}
                    >
                      <div className={`max-w-[80%] sm:max-w-[70%] rounded-2xl p-3 shadow-sm ${
                        isMine 
                          ? 'bg-primary-500 text-white rounded-tr-none' 
                          : 'bg-white dark:bg-[#1A1A1A] text-gray-800 dark:text-gray-200 border border-gray-100 dark:border-gray-800 rounded-tl-none'
                      }`}>
                        <p className="text-sm font-arabic whitespace-pre-wrap leading-relaxed text-right">{msg.content}</p>
                        <div className={`text-[9px] mt-1 flex items-center gap-1 ${isMine ? 'text-primary-100' : 'text-gray-400'}`}>
                          {format(new Date(msg.created_at), 'HH:mm', { locale: ar })}
                          {isMine && (
                             <span className="ml-1 opacity-70">
                               {msg.is_read ? '✓✓' : '✓'}
                             </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-100 dark:border-gray-800">
              <form onSubmit={handleSend} className="flex gap-2 items-center bg-gray-50 dark:bg-[#1A1A1A] p-1 rounded-2xl border border-gray-100 dark:border-gray-800">
                <button 
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="w-10 h-10 flex-shrink-0 bg-primary-500 text-white rounded-xl flex items-center justify-center hover:bg-primary-600 transition-all disabled:opacity-50 disabled:grayscale"
                >
                  <Send className="w-5 h-5 rotate-180" />
                </button>
                <textarea 
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend(e);
                    }
                  }}
                  placeholder="اكتب رسالتك هنا..."
                  className="flex-1 bg-transparent border-none text-right font-arabic py-2.5 px-3 focus:ring-0 text-sm resize-none max-h-32 min-h-[44px]"
                  dir="rtl"
                />
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center opacity-40 grayscale">
            <div className="w-32 h-32 bg-gray-100 dark:bg-[#1A1A1A] rounded-full flex items-center justify-center mb-6">
              <MessageSquare className="w-16 h-16 text-gray-300 dark:text-gray-700" />
            </div>
            <h2 className="text-2xl font-bold font-arabic mb-2">مرحباً بك في المحادثات</h2>
            <p className="text-sm font-arabic max-w-xs">اختر محادثة من القائمة الجانبية للتواصل مع البائعين أو الزبائن</p>
          </div>
        )}
      </div>
    </div>
  );
}
