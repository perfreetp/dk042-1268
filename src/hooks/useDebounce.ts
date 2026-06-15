import { useState, useEffect, useRef, useCallback } from 'react';

export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = window.setTimeout(() => {
      setDebouncedValue(value);
      timerRef.current = null;
    }, delay);

    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [value, delay]);

  return debouncedValue;
}

export interface UseDebouncedCallbackOptions {
  leading?: boolean;
  trailing?: boolean;
  maxWait?: number;
}

export function useDebouncedCallback<T extends (...args: Parameters<T>) => ReturnType<T>>(
  callback: T,
  delay: number = 300,
  options: UseDebouncedCallbackOptions = {}
): (...args: Parameters<T>) => void {
  const { leading = false, trailing = true, maxWait } = options;

  const callbackRef = useRef(callback);
  const timerRef = useRef<number | null>(null);
  const lastCallTimeRef = useRef<number | null>(null);
  const lastInvokeTimeRef = useRef<number>(0);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

  const invokeFunc = useCallback((args: Parameters<T>) => {
    lastInvokeTimeRef.current = Date.now();
    callbackRef.current(...args);
  }, []);

  const leadingEdge = useCallback(
    (args: Parameters<T>) => {
      lastCallTimeRef.current = Date.now();
      timerRef.current = window.setTimeout(() => {
        timerRef.current = null;
        if (trailing && lastCallTimeRef.current !== null && Date.now() - lastCallTimeRef.current >= delay) {
          invokeFunc(args);
        }
      }, delay);

      if (leading) {
        invokeFunc(args);
      }
    },
    [delay, leading, trailing, invokeFunc]
  );

  const debouncedFn = useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();

      if (lastCallTimeRef.current === null) {
        leadingEdge(args);
        return;
      }

      const timeSinceLastCall = now - lastCallTimeRef.current;
      const timeSinceLastInvoke = now - lastInvokeTimeRef.current;

      if (maxWait !== undefined && timeSinceLastInvoke >= maxWait) {
        if (timerRef.current !== null) {
          clearTimeout(timerRef.current);
          timerRef.current = null;
        }
        lastCallTimeRef.current = now;
        invokeFunc(args);
        return;
      }

      if (timeSinceLastCall >= delay) {
        if (timerRef.current !== null) {
          clearTimeout(timerRef.current);
          timerRef.current = null;
        }
        leadingEdge(args);
        return;
      }

      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
      }

      lastCallTimeRef.current = now;

      const remainingWait = maxWait !== undefined
        ? Math.min(delay - timeSinceLastCall, maxWait - timeSinceLastInvoke)
        : delay - timeSinceLastCall;

      timerRef.current = window.setTimeout(() => {
        timerRef.current = null;
        if (trailing) {
          invokeFunc(args);
        }
      }, remainingWait);
    },
    [delay, leadingEdge, invokeFunc, maxWait, trailing]
  );

  return debouncedFn;
}
