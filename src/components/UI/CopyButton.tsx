import { Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCopy } from '@/hooks/useCopy';
import Button from './Button';

export interface CopyButtonProps {
  text: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  duration?: number;
}

export default function CopyButton({
  text,
  size = 'sm',
  className,
  duration = 2000,
}: CopyButtonProps) {
  const { copy, copied } = useCopy({ duration });

  return (
    <Button
      variant="ghost"
      size={size}
      onClick={() => copy(text)}
      className={cn(
        'transition-all duration-200',
        copied && 'text-green-600 bg-green-50 hover:bg-green-100',
        className
      )}
      title={copied ? '已复制' : '复制'}
    >
      {copied ? (
        <>
          <Check className="h-4 w-4" />
          {size !== 'sm' && <span>已复制</span>}
        </>
      ) : (
        <>
          <Copy className="h-4 w-4" />
          {size !== 'sm' && <span>复制</span>}
        </>
      )}
    </Button>
  );
}
