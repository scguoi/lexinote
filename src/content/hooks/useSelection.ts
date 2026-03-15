import { useState, useEffect, useCallback, useRef } from 'react';
import { detectSelectionType, extractContext } from '../../shared/utils';
import { DEBOUNCE_DELAY } from '../../shared/constants';

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

  const handleSelection = useCallback((e: Event) => {
    // Ignore events from our own UI
    const host = document.getElementById('lexinote-root');
    if (host && host.contains(e.target as Node)) return;

    // Immediately clear if no selection
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !sel.toString().trim()) {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      setSelection(null);
      return;
    }

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = window.setTimeout(() => {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || !sel.toString().trim()) {
        return;
      }

      const text = sel.toString().trim();
      const type = detectSelectionType(text);

      if (type === 'too-long') {
        setSelection(null);
        return;
      }

      const range = sel.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      const context = extractContext(sel);

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
    }, DEBOUNCE_DELAY);
  }, []);

  const clearSelection = useCallback(() => {
    setSelection(null);
  }, []);

  useEffect(() => {
    document.addEventListener('mouseup', handleSelection);
    document.addEventListener('dblclick', handleSelection);

    return () => {
      document.removeEventListener('mouseup', handleSelection);
      document.removeEventListener('dblclick', handleSelection);
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [handleSelection]);

  return { selection, clearSelection };
}
