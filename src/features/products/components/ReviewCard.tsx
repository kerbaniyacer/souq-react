import { CheckCircle, Reply } from 'lucide-react';
import StarRating from './StarRating';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface Props {
  review: {
    user_name: string;
    user_photo?: string;
    rating: number;
    comment: string;
    verified: boolean;
    created_at: string;
    official_reply?: {
      user_name: string;
      content: string;
      created_at: string;
    };
  };
}

export default function ReviewCard({ review }: Props) {
  const formattedDate = format(new Date(review.created_at), 'd MMMM yyyy', { locale: ar });

  return (
    <div className="py-6 border-b border-gray-100 dark:border-gray-800 last:border-0 group">
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="w-12 h-12 rounded-2xl bg-gray-50 dark:bg-[#1A1A1A] border border-gray-100 dark:border-gray-800 overflow-hidden shrink-0">
          {review.user_photo ? (
            <img src={review.user_photo} alt={review.user_name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold uppercase">
              {review.user_name.charAt(0)}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 font-arabic truncate">
              {review.user_name}
            </h4>
            <span className="text-[10px] text-gray-400 font-mono">
              {formattedDate}
            </span>
          </div>

          <div className="flex items-center gap-2 mb-3">
            <StarRating rating={review.rating} size={14} />
            {review.verified && (
              <div className="flex items-center gap-1 text-[10px] text-green-600 dark:text-green-500 font-arabic bg-green-50 dark:bg-green-500/10 px-2 py-0.5 rounded-full border border-green-100 dark:border-green-500/20">
                <CheckCircle size={10} />
                مشتري موثق
              </div>
            )}
          </div>

          <p className="text-sm text-gray-600 dark:text-gray-400 font-arabic leading-relaxed">
            {review.comment}
          </p>

          {/* Official Reply */}
          {review.official_reply && (
            <div className="mt-4 p-4 bg-gray-50 dark:bg-[#1A1A1A] rounded-2xl border border-gray-100 dark:border-gray-800 relative">
              <Reply size={16} className="absolute -top-2 left-6 text-gray-300 dark:text-gray-700 fill-gray-50 dark:fill-[#1A1A1A]" />
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] px-2 py-0.5 bg-primary-100 text-primary-700 dark:bg-primary-500/20 dark:text-primary-400 rounded-full font-arabic font-bold uppercase tracking-wider">
                  رد رسمي
                </span>
                <span className="text-[10px] text-gray-500 dark:text-gray-500 font-arabic">
                  من: {review.official_reply.user_name}
                </span>
              </div>
              <p className="text-xs text-gray-700 dark:text-gray-300 font-arabic leading-relaxed italic">
                "{review.official_reply.content}"
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
