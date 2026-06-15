import { useState, useCallback, useRef, useEffect } from 'react';

export interface UseCopyOptions {
  duration?: number;
  onSuccess?: (text: string) => void;
  onError?: (error: Error) => void;
}

export interface UseCopyResult {
  copy: (text: string) => Promise<boolean>;
  copied: boolean;
  error: Error | null;
  reset: () => void;
}

export function useCopy(options: UseCopyOptions = {}): UseCopyResult {
  const { duration = 2000, onSuccess, onError } = options;
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

  const reset = useCallback(() => {
    setCopied(false);
    setError(null);
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const copy = useCallback(
    async (text: string): Promise<boolean> => {
      reset();

      try {
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(text);
        } else {
          const textArea = document.createElement('textarea');
          textArea.value = text;
          textArea.style.position = 'fixed';
          textArea.style.left = '-999999px';
          textArea.style.top = '-999999px';
          textArea.style.opacity = '0';
          textArea.setAttribute('readonly', '');
          document.body.appendChild(textArea);
          textArea.focus();
          textArea.select();
          textArea.setSelectionRange(0, textArea.value.length);

          try {
            const successful = document.execCommand('copy');
            if (!successful) {
              throw new Error('execCommand returned false');
            }
          } finally {
            textArea.remove();
          }
        }

        setCopied(true);
        setError(null);
        onSuccess?.(text);

        if (duration > 0) {
          timerRef.current = window.setTimeout(() => {
            setCopied(false);
            timerRef.current = null;
          }, duration);
        }

        return true;
      } catch (e) {
        const err = e instanceof Error ? e : new Error(String(e));
        setError(err);
        setCopied(false);
        onError?.(err);
        return false;
      }
    },
    [duration, onSuccess, onError, reset]
  );

  return { copy, copied, error, reset };
}
