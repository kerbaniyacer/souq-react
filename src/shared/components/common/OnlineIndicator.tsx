import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

interface Props {
  isOnline?: boolean;
  lastSeen?: string | null;
  showLabel?: boolean;
  size?: 'sm' | 'md';
}

export default function OnlineIndicator({ isOnline, lastSeen, showLabel = true, size = 'sm' }: Props) {
  const dotSize = size === 'sm' ? 'w-2.5 h-2.5' : 'w-3 h-3';

  if (isOnline) {
    return (
      <span className="flex items-center gap-1.5">
        <span className={`${dotSize} rounded-full bg-green-500 ring-2 ring-white dark:ring-gray-900 animate-pulse`} />
        {showLabel && <span className="text-[10px] text-green-500 font-arabic">متصل الآن</span>}
      </span>
    );
  }

  const lastSeenText = lastSeen
    ? formatDistanceToNow(new Date(lastSeen), { addSuffix: true, locale: ar })
    : 'غير متصل';

  return (
    <span className="flex items-center gap-1.5">
      <span className={`${dotSize} rounded-full bg-gray-300 dark:bg-gray-600 ring-2 ring-white dark:ring-gray-900`} />
      {showLabel && <span className="text-[10px] text-gray-400 font-arabic">{lastSeenText}</span>}
    </span>
  );
}
