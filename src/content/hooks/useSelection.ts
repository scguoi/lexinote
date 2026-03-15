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

  const processSelection = useCallback(() => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !sel.toString().trim()) return;

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
  }, []);

  const handleMouseUp = useCallback((e: Event) => {
    const host = document.getElementById('lexinote-root');
    if (host && host.contains(e.target as Node)) return;

    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !sel.toString().trim()) {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      setSelection(null);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(processSelection, DEBOUNCE_DELAY);
  }, [processSelection]);

  const handleDblClick = useCallback((e: Event) => {
    const host = document.getElementById('lexinote-root');
    if (host && host.contains(e.target as Node)) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);
    // Double-click: process immediately, no debounce
    processSelection();
  }, [processSelection]);

  const clearSelection = useCallback(() => {
    setSelection(null);
  }, []);

  useEffect(() => {
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('dblclick', handleDblClick);

    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('dblclick', handleDblClick);
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [handleMouseUp, handleDblClick]);

  return { selection, clearSelection };
}
