import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSelection } from './hooks/useSelection';
import { FloatingButton } from './components/FloatingButton';
import { DefinitionCard } from './components/DefinitionCard';
import { SentenceCard } from './components/SentenceCard';
import { normalizeWord, generateId } from '../shared/utils';
import type { RequestMessage, ResponseMessage, WordEntry } from '../shared/types';

function parseResponseFields(text: string) {
  const sections = text.split('---');
  const result: {
    phonetic?: string;
    pos?: string;
    definition?: string;
    examples?: Array<{ sentence: string; translation: string }>;
    etymology?: string;
  } = {};

  for (const section of sections) {
    const trimmed = section.trim();
    if (trimmed.startsWith('[phonetic]')) {
      result.phonetic = trimmed.replace('[phonetic]', '').trim();
    } else if (trimmed.startsWith('[pos]')) {
      result.pos = trimmed.replace('[pos]', '').trim();
    } else if (trimmed.startsWith('[definition]')) {
      result.definition = trimmed.replace('[definition]', '').trim();
    } else if (trimmed.startsWith('[example1]') || trimmed.startsWith('[example2]')) {
      const tag = trimmed.startsWith('[example1]') ? '[example1]' : '[example2]';
      const lines = trimmed.replace(tag, '').trim().split('\n').filter(l => l.trim());
      if (lines.length >= 2) {
        if (!result.examples) result.examples = [];
        result.examples.push({ sentence: lines[0].trim(), translation: lines[1].trim() });
      }
    } else if (trimmed.startsWith('[etymology]')) {
      result.etymology = trimmed.replace('[etymology]', '').trim();
    }
  }

  return result;
}

export const App: React.FC = () => {
  const { selection, clearSelection } = useSelection();
  const [showButton, setShowButton] = useState(false);
  const [showCard, setShowCard] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [isDuplicate, setIsDuplicate] = useState(false);
  const [lookupCount, setLookupCount] = useState(0);
  const [currentWord, setCurrentWord] = useState('');
  const [currentType, setCurrentType] = useState<'word' | 'sentence'>('word');
  const [cardPosition, setCardPosition] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [savedEntryId, setSavedEntryId] = useState<string | null>(null);

  const portRef = useRef<chrome.runtime.Port | null>(null);
  const requestIdRef = useRef<string>('');
  const scrollStartRef = useRef<number>(0);

  // Show floating button on selection
  useEffect(() => {
    if (selection) {
      setShowButton(true);
      setShowCard(false);
      setStreamingText('');
      setIsComplete(false);
      setIsStreaming(false);
    } else {
      setShowButton(false);
    }
  }, [selection]);

  // Dismiss on click outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      // Ignore clicks on our own UI elements
      const host = document.getElementById('lexinote-root');
      if (host && host.contains(e.target as Node)) return;

      if (showCard) {
        closeCard();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showCard) {
        closeCard();
      }
    };

    const handleScroll = () => {
      if (showCard) {
        const scrollDelta = Math.abs(window.scrollY - scrollStartRef.current);
        if (scrollDelta > 200) {
          closeCard();
        }
      }
    };

    // Delay adding click listener to avoid catching the same click that triggered the button
    const timer = setTimeout(() => {
      document.addEventListener('click', handleClick);
    }, 100);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('scroll', handleScroll);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('click', handleClick);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [showCard]);

  const closeCard = useCallback(() => {
    // Cancel any in-flight request
    if (portRef.current && requestIdRef.current) {
      portRef.current.postMessage({ type: 'CANCEL', requestId: requestIdRef.current });
      portRef.current.disconnect();
      portRef.current = null;
    }

    setShowCard(false);
    setShowButton(false);
    setStreamingText('');
    setIsStreaming(false);
    setIsComplete(false);
    setIsDuplicate(false);
    setSavedEntryId(null);
    clearSelection();
  }, [clearSelection]);

  const handleLookup = useCallback(() => {
    if (!selection) return;

    // Cancel previous request if any
    if (portRef.current) {
      portRef.current.postMessage({ type: 'CANCEL', requestId: requestIdRef.current });
      portRef.current.disconnect();
    }

    const newRequestId = generateId();
    requestIdRef.current = newRequestId;
    scrollStartRef.current = window.scrollY;

    setShowButton(false);
    setShowCard(true);
    setStreamingText('');
    setIsStreaming(true);
    setIsComplete(false);
    setIsDuplicate(false);
    setCurrentWord(selection.text);
    setCurrentType(selection.type);
    setCardPosition(selection.position);

    // Open port for streaming
    const port = chrome.runtime.connect({ name: 'lookup' });
    portRef.current = port;

    port.onMessage.addListener((message: ResponseMessage) => {
      if (message.requestId !== requestIdRef.current) return;

      switch (message.type) {
        case 'STREAM_CHUNK':
          setStreamingText(prev => prev + message.content);
          break;
        case 'STREAM_COMPLETE':
          setStreamingText(message.fullText);
          setIsStreaming(false);
          setIsComplete(true);
          setIsDuplicate(!!(message as any).isDuplicate);
          setLookupCount((message as any).lookupCount || 0);

          // Immediately save for words (not sentences, not duplicates)
          if (selection.type === 'word' && !(message as any).isDuplicate) {
            const parsed = parseResponseFields(message.fullText);
            const entryId = generateId();
            const entry: Partial<WordEntry> = {
              id: entryId,
              word: selection.text,
              normalizedWord: normalizeWord(selection.text),
              phonetic: parsed.phonetic || '',
              partOfSpeech: parsed.pos || '',
              definition: parsed.definition || message.fullText,
              examples: parsed.examples || [],
              etymology: parsed.etymology || '',
              sources: [{
                url: selection.url,
                title: selection.title,
                context: selection.context,
                seenAt: Date.now(),
              }],
              sourceLanguage: 'en',
              targetLanguage: 'zh',
              addedAt: Date.now(),
              lastSeenAt: Date.now(),
              lookupCount: 1,
              status: 'new',
              starred: false,
            };
            chrome.runtime.sendMessage({
              type: 'SAVE_WORD',
              entry,
            });
            setSavedEntryId(entryId);
          }

          port.disconnect();
          portRef.current = null;
          break;
        case 'STREAM_ERROR':
          setStreamingText(`Error: ${message.error}`);
          setIsStreaming(false);
          setIsComplete(true);
          port.disconnect();
          portRef.current = null;
          break;
        case 'STREAM_CANCELLED':
          port.disconnect();
          portRef.current = null;
          break;
      }
    });

    port.onDisconnect.addListener(() => {
      portRef.current = null;
    });

    // Send lookup request
    const request: RequestMessage = {
      type: 'LOOKUP_REQUEST',
      requestId: newRequestId,
      word: selection.text,
      context: selection.context,
      url: selection.url,
      title: selection.title,
      isWord: selection.type === 'word',
    };
    port.postMessage(request);
  }, [selection]);

  const handleUndo = useCallback(() => {
    // Delete the saved word from storage
    if (savedEntryId) {
      chrome.runtime.sendMessage({ type: 'DELETE_WORD', id: savedEntryId });
      setSavedEntryId(null);
    }
    closeCard();
  }, [closeCard, savedEntryId]);

  const handleRelookup = useCallback(() => {
    // Re-trigger lookup for the same word
    if (selection) {
      handleLookup();
    }
  }, [selection, handleLookup]);

  if (!showButton && !showCard) return null;

  return (
    <>
      {showButton && selection && (
        <FloatingButton position={selection.position} onClick={handleLookup} />
      )}
      {showCard && currentType === 'word' && (
        <DefinitionCard
          word={currentWord}
          streamingText={streamingText}
          isStreaming={isStreaming}
          isComplete={isComplete}
          isDuplicate={isDuplicate}
          lookupCount={lookupCount}
          position={cardPosition}
          onUndo={handleUndo}
          onClose={closeCard}
          onRelookup={handleRelookup}
        />
      )}
      {showCard && currentType === 'sentence' && (
        <SentenceCard
          sentence={currentWord}
          streamingText={streamingText}
          isStreaming={isStreaming}
          isComplete={isComplete}
          position={cardPosition}
          onClose={closeCard}
        />
      )}
    </>
  );
};
