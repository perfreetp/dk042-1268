import { useState } from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface StarRatingProps {
  value?: number;
  onChange?: (value: number) => void;
  readOnly?: boolean;
  showScore?: boolean;
  size?: 'sm' | 'md' | 'lg';
  max?: number;
  className?: string;
}

const sizeStyles = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
};

export default function StarRating({
  value = 0,
  onChange,
  readOnly = false,
  showScore = true,
  size = 'md',
  max = 5,
  className,
}: StarRatingProps) {
  const [hoverValue, setHoverValue] = useState<number | null>(null);
  const displayValue = hoverValue ?? value;

  const handleClick = (starValue: number) => {
    if (readOnly) return;
    onChange?.(starValue);
  };

  return (
    <div
      className={cn(
        'flex items-center gap-0.5',
        className
      )}
      onMouseLeave={() => !readOnly && setHoverValue(null)}
    >
      {Array.from({ length: max }, (_, i) => i + 1).map((starValue) => {
        const isFilled = starValue <= Math.round(displayValue);
        const isPartial = !Number.isInteger(displayValue) && starValue === Math.ceil(displayValue);

        return (
          <button
            key={starValue}
            type="button"
            disabled={readOnly}
            onClick={() => handleClick(starValue)}
            onMouseEnter={() => !readOnly && setHoverValue(starValue)}
            className={cn(
              'relative transition-transform duration-150',
              !readOnly && 'cursor-pointer hover:scale-110',
              readOnly && 'cursor-default'
            )}
          >
            <Star
              className={cn(
                sizeStyles[size],
                isFilled
                  ? 'fill-amber-400 text-amber-400'
                  : 'fill-none text-slate-300',
                isPartial && 'fill-amber-400/50 text-amber-400/50'
              )}
            />
          </button>
        );
      })}
      {showScore && (
        <span
          className={cn(
            'ml-2 font-semibold text-slate-700',
            size === 'sm' && 'text-xs',
            size === 'md' && 'text-sm',
            size === 'lg' && 'text-base'
          )}
        >
          {value.toFixed(1)}
        </span>
      )}
    </div>
  );
}
