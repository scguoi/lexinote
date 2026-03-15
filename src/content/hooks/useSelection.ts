import { useState, useEffect, useCallback, useRef } from 'react';
import { detectSelectionType, extractContext } from '../../shared/utils';

export interface SelectionInfo {
  text: string;
  type: 'word' | 'sentence';
  context: string;
  url: string;
  title: string;
  position: { x: number; y: number; width: number; height: number };
}

export function useSelection() {
  const [selection, setSelection] = useState<SelectionInfo | null>(null);
  const debounceRef = useRef<number | null>(null);

  const handleMouseUp = useCallback((e: Event) => {
    const host = document.getElementById('lexinote-root');
    if (host && host.contains(e.target as Node)) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);

    // Short delay to let browser finalize selection
    debounceRef.current = window.setTimeout(() => {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || !sel.toString().trim()) {
        setSelection(null);
        return;
      }

      const text = sel.toString().trim();
      const range = sel.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      const type = detectSelectionType(text);
      const context = extractContext(range);

      setSelection({
        text,
        type,
        context,
        url: window.location.href,
        title: document.title,
        position: {
          x: rect.left + rect.width / 2,
          y: rect.top,
          width: rect.width,
          height: rect.height,
        },
      });
    }, 50);
  }, []);

  const clearSelection = useCallback(() => {
    setSelection(null);
  }, []);

  useEffect(() => {
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [handleMouseUp]);

  return { selection, clearSelection };
}
