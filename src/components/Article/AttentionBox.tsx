import { AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AttentionBoxProps {
  items: string[];
  title?: string;
  className?: string;
}

export default function AttentionBox({
  items,
  title = '注意事项',
  className,
}: AttentionBoxProps) {
  if (!items || items.length === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        'rounded-2xl border border-l-4 border-amber-200 bg-amber-50/70',
        'border-l-amber-500 overflow-hidden',
        className
      )}
    >
      <div className="flex items-start gap-3 px-5 py-4">
        <div className="mt-0.5 shrink-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
            <AlertTriangle className="h-5 w-5" />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-base font-semibold text-amber-900 mb-3">
            {title}
          </h4>
          <ul className="space-y-2">
            {items.map((item, index) => (
              <li
                key={index}
                className="flex items-start gap-2.5 text-sm text-amber-800 leading-relaxed"
              >
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
