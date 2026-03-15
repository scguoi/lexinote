import React from 'react';
import { t } from '../../shared/i18n';

interface SentenceCardProps {
  sentence: string;
  streamingText: string;
  isStreaming: boolean;
  isComplete: boolean;
  position: { x: number; y: number; width: number; height: number };
  onClose: () => void;
}

interface ParsedSentence {
  translation?: string;
  explanation?: string;
}

function parseSentenceResponse(text: string): ParsedSentence {
  const fields: ParsedSentence = {};
  const sections = text.split('---');

  for (const section of sections) {
    const trimmed = section.trim();
    if (trimmed.startsWith('[translation]')) {
      fields.translation = trimmed.replace('[translation]', '').trim();
    } else if (trimmed.startsWith('[explanation]')) {
      fields.explanation = trimmed.replace('[explanation]', '').trim();
    }
  }

  return fields;
}

export const SentenceCard: React.FC<SentenceCardProps> = ({
  sentence,
  streamingText,
  isStreaming,
  isComplete,
  position,
  onClose,
}) => {
  const parsed = isComplete ? parseSentenceResponse(streamingText) : null;

  const top = position.y + position.height + 10 + window.scrollY;
  const left = Math.max(10, Math.min(position.x - 200 + window.scrollX, window.innerWidth - 420 + window.scrollX));

  const handleCopy = async () => {
    const textToCopy = parsed?.translation || streamingText;
    try {
      await navigator.clipboard.writeText(textToCopy);
      // Brief feedback handled by caller or inline
    } catch {
      try {
        const textarea = document.createElement('textarea');
        textarea.value = textToCopy;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      } catch {
        // Fallback: select text for manual copy
      }
    }
  };

  return (
    <div
      style={{
        position: 'absolute',
        top: `${top}px`,
        left: `${left}px`,
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
        borderTop: '3px solid #FFB4D6',
        animation: 'fadeIn 0.2s ease',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <div style={{ fontSize: '16px', fontWeight: 600 }}>💬 Translation</div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', color: '#A0AEC0' }}>×</button>
      </div>

      {isStreaming && !isComplete ? (
        <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
          {streamingText}
          <span style={{ animation: 'blink 1s step-end infinite' }}>▊</span>
        </div>
      ) : parsed ? (
        <div>
          <div style={{ marginBottom: '10px' }}>
            <div style={{ fontWeight: 500, color: '#6B7FFF', marginBottom: '2px' }}>📖 Original</div>
            <div style={{ fontSize: '13px', color: '#4A5568' }}>{sentence}</div>
          </div>
          {parsed.translation && (
            <div style={{ marginBottom: '10px' }}>
              <div style={{ fontWeight: 500, color: '#6B7FFF', marginBottom: '2px' }}>🌏 Translation</div>
              <div>{parsed.translation}</div>
            </div>
          )}
          {parsed.explanation && (
            <div style={{ marginBottom: '10px' }}>
              <div style={{ fontWeight: 500, color: '#6B7FFF', marginBottom: '2px' }}>💡 Explanation</div>
              <div style={{ fontSize: '13px' }}>{parsed.explanation}</div>
            </div>
          )}
        </div>
      ) : null}

      {isComplete && (
        <div style={{ textAlign: 'right', marginTop: '8px' }}>
          <button
            onClick={handleCopy}
            style={{
              background: '#F7FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: '6px',
              padding: '4px 12px',
              cursor: 'pointer',
              fontSize: '13px',
              color: '#4A5568',
            }}
          >
            📋 Copy
          </button>
        </div>
      )}
    </div>
  );
};
