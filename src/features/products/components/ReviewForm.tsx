import { useState } from 'react';
import { Star, Send } from 'lucide-react';
import { useToast } from '@shared/stores/toastStore';
import api from '@shared/services/api';

interface Props {
  productId: string;
  onSuccess?: () => void;
}

export default function ReviewForm({ productId, onSuccess }: Props) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toast = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      toast.error('يرجى اختيار التقييم بالنجوم أولاً');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post('/reviews/products/create/', {
        product: productId,
        rating,
        comment
      });
      toast.success('شكرًا لك! تم إضافة تقييمك بنجاح.');
      setRating(0);
      setComment('');
      if (onSuccess) onSuccess();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'تعذر إضافة التقييم');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-[#1A1A1A] rounded-3xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm">
      <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 font-arabic mb-4">
        شاركنا رأيك
      </h3>
      
      {/* Star Selector */}
      <div className="flex items-center gap-2 mb-6">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(0)}
            className="transition-transform active:scale-95"
          >
            <Star
              size={32}
              className={`${
                star <= (hover || rating)
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-gray-200 dark:text-gray-700'
              } transition-colors`}
            />
          </button>
        ))}
        <span className="text-sm text-gray-400 font-arabic mr-2">
          {rating > 0 ? `${rating} نجوم` : 'اختر عدد النجوم'}
        </span>
      </div>

      <div className="space-y-4">
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="اكتب تجربتك مع المنتج هنا..."
          rows={3}
          className="w-full px-4 py-3 bg-gray-50 dark:bg-[#252525] border border-transparent focus:border-primary-400 dark:focus:border-primary-500 rounded-2xl text-sm font-arabic outline-none transition-all resize-none"
        />

        <button
          type="submit"
          disabled={isSubmitting || rating === 0}
          className="w-full flex items-center justify-center gap-2 bg-primary-400 hover:bg-primary-500 disabled:opacity-50 disabled:hover:bg-primary-400 text-white font-bold py-3 px-6 rounded-2xl transition-all font-arabic group"
        >
          {isSubmitting ? (
             <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              أنشر التقييم
              <Send size={18} className="transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1" />
            </>
          )}
        </button>
      </div>
    </form>
  );
}
