import { Star } from 'lucide-react';

interface Props {
  rating: number;
  max?: number;
  size?: number;
  className?: string;
}

/**
 * StarRating — A simple read-only star display component
 */
export default function StarRating({ rating, max = 5, size = 16, className = "" }: Props) {
  return (
    <div className={`flex items-center gap-0.5 ${className}`}>
      {[...Array(max)].map((_, i) => (
        <Star
          key={i}
          size={size}
          className={`${
            i < Math.floor(rating)
              ? 'fill-yellow-400 text-yellow-400'
              : i < rating
              ? 'fill-yellow-400/50 text-yellow-400'
              : 'text-gray-200 dark:text-gray-700'
          }`}
        />
      ))}
    </div>
  );
}
