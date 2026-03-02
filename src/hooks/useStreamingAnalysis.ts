// src/hooks/useStreamingAnalysis.ts
// Hook for streaming AI analysis from Edge Function (SSE)
// Replaces supabase.functions.invoke for luan_giai/van_han calls

import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface StreamingOptions {
  onChunk?: (fullText: string) => void;  // Called with accumulated text on each chunk
  onDone?: (fullText: string) => void;   // Called when stream completes
  onError?: (error: string) => void;     // Called on error
}

export function useStreamingAnalysis() {
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamedText, setStreamedText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const startStreaming = useCallback(async (
    body: Record<string, any>,
    options?: StreamingOptions
  ) => {
    // Get auth session for Authorization header
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      const errMsg = 'Chưa đăng nhập';
      setError(errMsg);
      options?.onError?.(errMsg);
      return null;
    }

    // Get Supabase URL from client
    const supabaseUrl = (supabase as any).supabaseUrl 
      || import.meta.env.VITE_SUPABASE_URL
      || 'https://gapuktvldpbbsuscgbbr.supabase.co';

    const url = `${supabaseUrl}/functions/v1/analyze-chart`;

    // Reset state
    setIsStreaming(true);
    setStreamedText('');
    setError(null);

    // Abort controller for cancellation
    abortRef.current = new AbortController();

    let fullText = '';

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY || session.access_token,
        },
        body: JSON.stringify({ ...body, stream: true }),
        signal: abortRef.current.signal,
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
        throw new Error(errData.error || `Lỗi server: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('Stream not supported');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const jsonStr = line.slice(6).trim();
          if (!jsonStr) continue;

          try {
            const event = JSON.parse(jsonStr);

            if (event.text) {
              fullText += event.text;
              setStreamedText(fullText);
              options?.onChunk?.(fullText);
            } else if (event.done) {
              // Stream complete
            } else if (event.error) {
              throw new Error(event.error);
            }
          } catch (parseErr: any) {
            if (parseErr.message && !parseErr.message.includes('JSON')) {
              throw parseErr; // Re-throw non-parse errors
            }
          }
        }
      }

      setIsStreaming(false);
      options?.onDone?.(fullText);
      return fullText;

    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log('[streaming] Aborted by user');
        setIsStreaming(false);
        return fullText; // Return whatever we have
      }

      const errMsg = err?.message || 'Lỗi kết nối AI';
      console.error('[streaming] Error:', errMsg);
      setError(errMsg);
      setIsStreaming(false);
      options?.onError?.(errMsg);
      return null;
    }
  }, []);

  const abort = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  return {
    isStreaming,
    streamedText,
    error,
    startStreaming,
    abort,
  };
}
