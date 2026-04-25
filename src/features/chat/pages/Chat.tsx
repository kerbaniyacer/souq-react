import { useState, useEffect, useRef, useMemo } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { 
  Send, 
  Search, 
  User, 
  MoreVertical, 
  ChevronRight,
  MessageSquare
} from 'lucide-react';
import { useConversations, useMessages, useSendMessage, useDeleteConversation } from '../hooks/useChat';
import { getOrderRoute } from '@features/orders/utils/getOrderRoute';
import { useMerchantOrders } from '@shared/hooks/useOrders';
import { useAuthStore } from '@features/auth/stores/authStore';
import { Conversation } from '@shared/types';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import api from '@features/auth/services/authService';
import { X, AlertTriangle, Image as ImageIcon, CheckCircle, Loader2, ExternalLink, Clock } from 'lucide-react';
import { chatApi } from '@shared/services/api';
import { useToast } from '@shared/stores/toastStore';
import OnlineIndicator from '@shared/components/common/OnlineIndicator';

export default function Chat() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeId = searchParams.get('conversationId');
  const { data: conversations = [], isLoading: loadingConversations } = useConversations();
  const { user } = useAuthStore();
  const { data: merchantOrders = [] } = useMerchantOrders();
  
  // Map to resolve main order IDs to sub-order IDs for merchants
  const orderIdMap = useMemo(() => {
    const map: Record<string, string> = {};
    if ((user?.stores && user.stores.length > 0) || user?.is_staff) {
      merchantOrders.forEach((o: any) => {
        if (o.order) map[o.order.toString()] = o.id.toString();
        if (o.order_number) map[o.order_number] = o.id.toString();
      });
    }
    return map;
  }, [merchantOrders, user]);

  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const { data: messages = [], isLoading: loadingMessages } = useMessages(Number(activeId));
   const { mutate: sendMessage } = useSendMessage();
   const { mutate: deleteConversation, isPending: deleting } = useDeleteConversation();
   const [newMessage, setNewMessage] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [submittingReport, setSubmittingReport] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const toast = useToast();

  const [isUploadingReceipt, setIsUploadingReceipt] = useState(false);
  const [showNotifyBtn, setShowNotifyBtn] = useState(false);
  const [isNotifying, setIsNotifying] = useState(false);

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
    const content = newMessage.trim();
    if (!content || !activeId) return;

    setNewMessage(''); // clear input immediately for better UX
    sendMessage({ conversationId: Number(activeId), content });
  };

  const handleDelete = async () => {
    if (!activeId || !confirm('هل أنت متأكد من حذف هذه المحادثة؟')) return;
    
    deleteConversation(Number(activeId), {
      onSuccess: () => {
        toast.success('تم حذف المحادثة بنجاح');
        setSearchParams({}); // Deselect conversation
      },
      onError: () => {
        toast.error('تعذر حذف المحادثة');
      }
    });
  };

  const selectConversation = (id: number) => {
    setSearchParams({ conversationId: String(id) });
  };

  const handleReportSubmit = async () => {
    if (!reportReason) {
      toast.error('يرجى اختيار سبب التبليغ');
      return;
    }

    setSubmittingReport(true);
    try {
      const otherUserId = selectedConversation?.customer === user?.id 
        ? selectedConversation?.seller : selectedConversation?.customer;

      await api.post('/auth/reports/', {
        report_type: selectedConversation?.customer === user?.id ? 'seller' : 'buyer',
        target_user: otherUserId,
        reason: reportReason,
        description: reportDescription
      });

      toast.success('تم إرسال التبليغ بنجاح. سنراجع الأمر قريباً.');
      setIsReportModalOpen(false);
      setReportReason('');
      setReportDescription('');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'تعذّر إرسال التبليغ');
    } finally {
      setSubmittingReport(false);
    }
  };

  const handleReceiptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeId) return;

    setIsUploadingReceipt(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      await chatApi.uploadReceipt(Number(activeId), formData);
      toast.success('تم رفع وصل الدفع بنجاح. يمكنك الآن إشعار البائع.');
      setShowNotifyBtn(true);
      // Also send a message to the chat
      sendMessage({ conversationId: Number(activeId), content: "لقد أرسلت وصل الدفع (إثبات دفع)." });
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'تعذّر رفع الوصل');
    } finally {
      setIsUploadingReceipt(false);
    }
  };

  const handleNotifyPayment = async () => {
    if (!activeId) return;
    setIsNotifying(true);
    try {
      await chatApi.notifyPayment(Number(activeId));
      toast.success('تم إرسال إشعار وبريد إلكتروني للبائع بنجاح.');
      setShowNotifyBtn(false);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'تعذّر إرسال الإشعار');
    } finally {
      setIsNotifying(false);
    }
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
                      {/* Online dot */}
                      <span className={`absolute bottom-0 left-0 w-3 h-3 rounded-full border-2 border-white dark:border-[#1A1A1A] ${
                        (otherUser as any)?.is_online ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
                      }`} />
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
              <div className="relative">
                <button 
                  onClick={() => setShowMenu(!showMenu)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-[#252525] rounded-full transition-colors"
                >
                  <MoreVertical className="w-5 h-5 text-gray-500" />
                </button>
                
                {showMenu && (
                  <>
                    <div 
                      className="fixed inset-0 z-20" 
                      onClick={() => setShowMenu(false)} 
                    />
                    <div className="absolute left-0 mt-2 w-48 bg-white dark:bg-[#1A1A1A] rounded-xl shadow-xl border border-gray-100 dark:border-gray-800 py-2 z-30 animate-in fade-in slide-in-from-top-2 duration-200">
                      <button 
                        onClick={() => {
                          setShowMenu(false);
                          setIsReportModalOpen(true);
                        }}
                        className="w-full text-right px-4 py-2 text-sm font-arabic text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 flex items-center justify-end gap-2"
                      >
                        إبلاغ عن المستخدم
                        <span className="w-1.5 h-1.5 rounded-full bg-red-600" />
                      </button>
                      <button 
                        onClick={() => {
                          setShowMenu(false);
                          handleDelete();
                        }}
                        disabled={deleting}
                        className="w-full text-right px-4 py-2 text-sm font-arabic text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#252525] flex items-center justify-end gap-2 disabled:opacity-50"
                      >
                        {deleting ? 'جاري الحذف...' : 'حذف المحادثة'}
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                      </button>
                    </div>
                  </>
                )}
              </div>

              <div className="flex items-center gap-3 text-right">
                <div className="hidden sm:block">
                  <h3 className="font-bold text-sm font-arabic">
                    {selectedConversation?.customer === user?.id
                      ? (selectedConversation?.seller_details?.full_name || selectedConversation?.seller_details?.username)
                      : (selectedConversation?.customer_details?.full_name || selectedConversation?.customer_details?.username)}
                  </h3>
                  {(() => {
                    const other = selectedConversation?.customer === user?.id
                      ? selectedConversation?.seller_details
                      : selectedConversation?.customer_details;
                    return (
                      <OnlineIndicator
                        isOnline={(other as any)?.is_online}
                        lastSeen={(other as any)?.last_seen}
                        showLabel
                      />
                    );
                  })()}
                </div>
                <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-[#252525] flex items-center justify-center overflow-hidden">
                   {(selectedConversation?.customer === user?.id 
                      ? selectedConversation?.seller_details?.photo 
                      : selectedConversation?.customer_details?.photo) ? (
                        <img 
                          src={(selectedConversation?.customer === user?.id 
                            ? selectedConversation?.seller_details?.photo 
                            : selectedConversation?.customer_details?.photo) || undefined} 
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
                  const isOptimistic = msg.id < 0; // temporary message pending server confirmation
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isMine ? 'justify-start' : 'justify-end'} ${isOptimistic ? 'opacity-70' : ''}`}
                    >
                      <div className={`max-w-[80%] sm:max-w-[70%] rounded-2xl p-3 shadow-sm ${
                        isMine
                          ? 'bg-primary-500 text-white rounded-tr-none'
                          : 'bg-white dark:bg-[#1A1A1A] text-gray-800 dark:text-gray-200 border border-gray-100 dark:border-gray-800 rounded-tl-none'
                      }`}>
                        {(() => {
                          const mainMatch = msg.content.match(/\|\|MAIN_ORDER_ID:(\d+)\|\|/);
                          const subMatch = msg.content.match(/\|\|SUB_ORDER_ID:(\d+)\|\|/);
                          const merchantMatch = msg.content.match(/\|\|MERCHANT_ID:(\d+)\|\|/);
                          const orderNumMatch = msg.content.match(/\|\|ORDER_NUMBER:([^|]+)\|\|/);
                          const legacyMatch = msg.content.match(/\|\|ORDER_ID:(\d+)\|\|/);
                          
                          const merchantId = merchantMatch?.[1];
                          const orderNumber = orderNumMatch?.[1];
                          const mainOrderId = mainMatch?.[1] || legacyMatch?.[1];
                          let resolvedId = subMatch?.[1] || legacyMatch?.[1];

                          const isMerchantRole = (user?.stores && user.stores.length > 0) || user?.role === 'admin' || user?.is_staff;

                          // For merchants, we prioritize the mapped sub-order ID
                          if (isMerchantRole) {
                            const mappedId = (mainOrderId && orderIdMap[mainOrderId]) || (orderNumber && orderIdMap[orderNumber]);
                            if (mappedId) resolvedId = mappedId;
                          }

                          const targetUrl = getOrderRoute(
                            { id: resolvedId || mainOrderId || '', merchantId },
                            user
                          );

                          const isMerchantOwner = user?.id.toString() === merchantId?.toString() || isMerchantRole;

                          const cleanContent = msg.content
                            .replace(/\|\|.*?\|\|/g, '')
                            .replace(/(MAIN_ORDER_ID|SUB_ORDER_ID|MERCHANT_ID|ORDER_NUMBER|ORDER_ID):[^\s|]+/g, '')
                            .trim();
                          
                          const canManage = isMerchantRole && (mainOrderId || resolvedId);
                          
                          return (
                            <>
                              <p className="text-sm font-arabic whitespace-pre-wrap leading-relaxed text-right">{cleanContent}</p>
                              
                              {canManage && (
                                <Link 
                                  to={targetUrl}
                                  className={`mt-3 flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-xs font-arabic font-bold transition-all ${
                                    isMine 
                                      ? 'bg-white/20 text-white hover:bg-white/30' 
                                      : 'bg-primary-50 text-primary-600 hover:bg-primary-100'
                                  }`}
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                  إدارة الطلبية
                                </Link>
                              )}
                            </>
                          );
                        })()}
                        
                        <div className={`text-[9px] mt-1 flex items-center gap-1 ${isMine ? 'text-primary-100' : 'text-gray-400'}`}>
                          {isOptimistic ? (
                            <Clock className="w-2.5 h-2.5 opacity-60" />
                          ) : (
                            <>
                              {format(new Date(msg.created_at), 'HH:mm', { locale: ar })}
                              {isMine && (
                                <span className="ml-1 opacity-70">
                                  {msg.is_read ? '✓✓' : '✓'}
                                </span>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-100 dark:border-gray-800 relative">
              {showNotifyBtn && (
                <div className="absolute -top-16 left-4 right-4 animate-in slide-in-from-bottom-4 duration-300">
                  <button
                    onClick={handleNotifyPayment}
                    disabled={isNotifying}
                    className="w-full bg-primary-600 text-white py-3 rounded-2xl font-arabic font-bold shadow-xl shadow-primary-600/20 flex items-center justify-center gap-2 hover:bg-primary-700 transition-all active:scale-[0.98]"
                  >
                    {isNotifying ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <CheckCircle className="w-5 h-5" />
                    )}
                    إشعار البائع بتوفر وصل الدفع
                  </button>
                </div>
              )}

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

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleReceiptUpload}
                  className="hidden"
                  accept="image/*"
                />
                
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingReceipt}
                  className="w-10 h-10 flex-shrink-0 bg-gray-100 dark:bg-[#252525] text-gray-500 rounded-xl flex items-center justify-center hover:bg-gray-200 dark:hover:bg-[#333333] transition-all disabled:opacity-50"
                  title="إرسال وصل الدفع"
                >
                  {isUploadingReceipt ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <ImageIcon className="w-5 h-5" />
                  )}
                </button>
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
      {/* Report User Modal */}
      {isReportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsReportModalOpen(false)} />
          <div className="relative w-full max-w-md bg-white dark:bg-[#1A1A1A] rounded-3xl shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-800 animate-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <button onClick={() => setIsReportModalOpen(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                  <X className="w-5 h-5 text-gray-400" />
                </button>
                <div className="flex items-center gap-2 text-red-600">
                  <span className="text-lg font-bold font-arabic">التبليغ عن المستخدم</span>
                  <AlertTriangle className="w-5 h-5" />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 font-arabic mb-2 text-right uppercase tracking-wider">سبب التبليغ</label>
                  <select 
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-xl py-3 px-4 text-sm font-arabic focus:ring-2 focus:ring-red-400/30 text-right"
                    dir="rtl"
                  >
                    <option value="">اختر السبب...</option>
                    <option value="SPAM">إزعاج (Spam)</option>
                    <option value="HARASSMENT">مضايقة أو شتم</option>
                    <option value="FRAUD">محاولة احتيال</option>
                    <option value="INAPPROPRIATE">محتوى غير لائق</option>
                    <option value="OTHER">سبب آخر</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 font-arabic mb-2 text-right uppercase tracking-wider">تفاصيل إضافية</label>
                  <textarea 
                    value={reportDescription}
                    onChange={(e) => setReportDescription(e.target.value)}
                    placeholder="اشرح لنا المشكلة بالتفصيل..."
                    className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-xl py-3 px-4 text-sm font-arabic focus:ring-2 focus:ring-red-400/30 text-right h-32 resize-none"
                    dir="rtl"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button 
                    onClick={() => setIsReportModalOpen(false)}
                    className="flex-1 py-3 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 font-bold rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors font-arabic"
                  >
                    إلغاء
                  </button>
                  <button 
                    onClick={handleReportSubmit}
                    disabled={submittingReport || !reportReason}
                    className="flex-1 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-colors font-arabic disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-red-600/20"
                  >
                    {submittingReport ? (
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : 'إرسال التبليغ'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
