import * as React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import Button from './Button';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  contentClassName?: string;
}

export default function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  className,
  contentClassName,
}: ModalProps) {
  React.useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className={cn(
        'fixed inset-0 z-[100] flex items-center justify-center p-4',
        className
      )}
    >
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm animate-in fade-in"
        onClick={onClose}
      />

      <div
        className={cn(
          'relative z-10 w-full max-w-lg overflow-hidden rounded-xl bg-white shadow-2xl',
          'animate-in zoom-in-95 duration-200',
          contentClassName
        )}
      >
        {title && (
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
            <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="!h-8 !w-8 !p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        <div className="px-6 py-5">
          {children}
        </div>

        {footer && (
          <div className="flex items-center justify-end gap-2 border-t border-slate-200 bg-slate-50 px-6 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
