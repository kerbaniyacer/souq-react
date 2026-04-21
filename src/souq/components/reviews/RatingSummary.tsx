import StarRating from './StarRating';

interface ReviewData {
  rating: number;
}

interface Props {
  reviews: ReviewData[];
  averageRating: number;
}

export default function RatingSummary({ reviews, averageRating }: Props) {
  const totalReviews = reviews.length;
  
  // Calculate counts for each star
  const counts = [0, 0, 0, 0, 0]; // Index 0 = 1 star, Index 4 = 5 stars
  reviews.forEach(r => {
    if (r.rating >= 1 && r.rating <= 5) {
      counts[r.rating - 1]++;
    }
  });

  return (
    <div className="flex flex-col md:flex-row gap-8 items-center bg-gray-50/50 dark:bg-[#1A1A1A]/30 rounded-3xl p-8 border border-gray-100 dark:border-gray-800">
      {/* Big Number */}
      <div className="text-center px-4">
        <div className="text-6xl font-bold text-gray-900 dark:text-gray-100 mb-2 font-mono">
          {averageRating.toFixed(1)}
        </div>
        <StarRating rating={averageRating} size={20} className="justify-center mb-2" />
        <span className="text-sm text-gray-500 font-arabic">
          بناءً على {totalReviews} تقييم
        </span>
      </div>

      {/* Progress Bars */}
      <div className="flex-1 w-full space-y-3">
        {[5, 4, 3, 2, 1].map((star) => {
          const count = counts[star - 1];
          const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
          
          return (
            <div key={star} className="flex items-center gap-4 group">
              <span className="text-xs font-bold text-gray-600 dark:text-gray-400 font-mono w-4 shrink-0">
                {star}
              </span>
              <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-yellow-400 rounded-full transition-all duration-1000 ease-out" 
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <span className="text-[10px] text-gray-400 font-mono w-8 shrink-0 text-right">
                {Math.round(percentage)}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
