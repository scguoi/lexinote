import React, { useState, useEffect, useRef } from 'react';
import { t } from '../../shared/i18n';

interface DefinitionCardProps {
  word: string;
  streamingText: string;
  isStreaming: boolean;
  isComplete: boolean;
  isDuplicate?: boolean;
  lookupCount?: number;
  position: { x: number; y: number; width: number; height: number };
  onUndo: () => void;
  onClose: () => void;
  onRelookup: () => void;
}

interface ParsedFields {
  phonetic?: string;
  pos?: string;
  definition?: string;
  example1?: string;
  example2?: string;
  etymology?: string;
}

function parseResponse(text: string): ParsedFields {
  const fields: ParsedFields = {};
  const sections = text.split('---');

  for (const section of sections) {
    const trimmed = section.trim();
    if (trimmed.startsWith('[phonetic]')) {
      fields.phonetic = trimmed.replace('[phonetic]', '').trim();
    } else if (trimmed.startsWith('[pos]')) {
      fields.pos = trimmed.replace('[pos]', '').trim();
    } else if (trimmed.startsWith('[definition]')) {
      fields.definition = trimmed.replace('[definition]', '').trim();
    } else if (trimmed.startsWith('[example1]')) {
      fields.example1 = trimmed.replace('[example1]', '').trim();
    } else if (trimmed.startsWith('[example2]')) {
      fields.example2 = trimmed.replace('[example2]', '').trim();
    } else if (trimmed.startsWith('[etymology]')) {
      fields.etymology = trimmed.replace('[etymology]', '').trim();
    }
  }

  return fields;
}

const cardStyle: React.CSSProperties = {
  position: 'absolute',
  maxWidth: '400px',
  minWidth: '280px',
  background: 'white',
  borderRadius: '12px',
  boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
  padding: '16px',
  fontFamily: 'Inter, SF Pro, system-ui, -apple-system, PingFang SC, sans-serif',
  fontSize: '14px',
  lineHeight: '1.6',
  color: '#2D3748',
  zIndex: 2147483647,
  borderTop: '3px solid #6B7FFF',
  animation: 'fadeIn 0.2s ease',
};

export const DefinitionCard: React.FC<DefinitionCardProps> = ({
  word,
  streamingText,
  isStreaming,
  isComplete,
  isDuplicate,
  lookupCount,
  position,
  onUndo,
  onClose,
  onRelookup,
}) => {
  const [showUndo, setShowUndo] = useState(true);
  const undoTimerRef = useRef<number | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isComplete && !isDuplicate) {
      undoTimerRef.current = window.setTimeout(() => {
        setShowUndo(false);
      }, 5000);
    }
    return () => {
      if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    };
  }, [isComplete, isDuplicate]);

  const parsed = isComplete ? parseResponse(streamingText) : null;

  // Position card
  const top = position.y + position.height + 10 + window.scrollY;
  const left = Math.max(10, Math.min(position.x - 200 + window.scrollX, window.innerWidth - 420 + window.scrollX));

  return (
    <div ref={cardRef} style={{ ...cardStyle, top: `${top}px`, left: `${left}px` }} onClick={(e) => e.stopPropagation()}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
        <div>
          <div style={{ fontSize: '18px', fontWeight: 600 }}>✨ {word}</div>
          {parsed?.phonetic && <div style={{ color: '#718096', fontSize: '13px' }}>{parsed.phonetic}</div>}
          {parsed?.pos && <div style={{ display: 'inline-block', background: '#EBF4FF', color: '#6B7FFF', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', marginTop: '4px' }}>🏷️ {parsed.pos}</div>}
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', color: '#A0AEC0', padding: '0 0 0 8px' }}>×</button>
      </div>

      {/* Streaming or parsed content */}
      {isStreaming && !isComplete ? (
        <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
          {streamingText}
          <span style={{ animation: 'blink 1s step-end infinite' }}>▊</span>
        </div>
      ) : parsed ? (
        <div>
          {parsed.definition && (
            <div style={{ marginBottom: '10px' }}>
              <div style={{ fontWeight: 500, color: '#6B7FFF', marginBottom: '2px' }}>💭 Definition</div>
              <div>{parsed.definition}</div>
            </div>
          )}
          {parsed.example1 && (
            <div style={{ marginBottom: '10px' }}>
              <div style={{ fontWeight: 500, color: '#6B7FFF', marginBottom: '2px' }}>📝 Examples</div>
              <div style={{ fontSize: '13px' }}>{parsed.example1}</div>
              {parsed.example2 && <div style={{ fontSize: '13px', marginTop: '4px' }}>{parsed.example2}</div>}
            </div>
          )}
          {parsed.etymology && (
            <div style={{ marginBottom: '10px' }}>
              <div style={{ fontWeight: 500, color: '#6B7FFF', marginBottom: '2px' }}>🌱 Etymology</div>
              <div style={{ fontSize: '13px' }}>{parsed.etymology}</div>
            </div>
          )}
        </div>
      ) : null}

      {/* Footer */}
      {isComplete && (
        <div style={{ marginTop: '12px', padding: '8px 12px', background: '#F0FFF4', borderRadius: '8px', textAlign: 'center', fontSize: '13px' }}>
          {isDuplicate ? (
            <div>
              <span>{t('seenAgain', String(lookupCount || 0))}</span>
              <button onClick={onRelookup} style={{ marginLeft: '8px', background: 'none', border: 'none', color: '#6B7FFF', cursor: 'pointer', textDecoration: 'underline', fontSize: '13px' }}>{t('relookup')}</button>
            </div>
          ) : (
            <div>
              <span>✓ {t('addedSuccess')}</span>
              {showUndo && (
                <button onClick={onUndo} style={{ marginLeft: '8px', background: 'none', border: '1px solid #E2E8F0', borderRadius: '4px', padding: '2px 8px', cursor: 'pointer', color: '#718096', fontSize: '12px' }}>{t('undoAction')}</button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
