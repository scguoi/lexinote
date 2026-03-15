import React, { useState } from 'react';
import type { WordEntry } from '../../shared/types';
import { t } from '../../shared/i18n';

interface WordItemProps {
  word: WordEntry;
  emoji: string;
  onToggleStar: () => void;
  onDelete: () => void;
}

export const WordItem: React.FC<WordItemProps> = ({ word, emoji, onToggleStar, onDelete }) => {
  const [expanded, setExpanded] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleDelete = () => {
    if (confirmDelete) {
      onDelete();
    } else {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 3000);
    }
  };

  return (
    <div
      style={{
        padding: '10px 12px',
        marginBottom: '8px',
        background: '#F8F9FA',
        borderRadius: '10px',
        cursor: 'pointer',
        transition: 'background 0.2s',
      }}
      onClick={() => setExpanded(!expanded)}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ flex: 1 }}>
          <span style={{ fontSize: '15px', fontWeight: 600, color: '#2D3748' }}>
            {emoji} {word.word}
          </span>
          <span style={{ fontSize: '12px', color: '#A0AEC0', marginLeft: '8px' }}>
            {word.phonetic}
          </span>
        </div>
        <div style={{ display: 'flex', gap: '4px' }} onClick={(e) => e.stopPropagation()}>
          <button
            onClick={onToggleStar}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', padding: '2px' }}
          >{word.starred ? '⭐' : '☆'}</button>
          <button
            onClick={handleDelete}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', padding: '2px' }}
          >{confirmDelete ? '❓' : '🗑️'}</button>
        </div>
      </div>

      <div style={{ fontSize: '12px', color: '#718096', marginTop: '2px' }}>
        {word.partOfSpeech ? `${word.partOfSpeech}. ` : ''}{word.definition || ''}
      </div>

      {expanded && (
        <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #E2E8F0', fontSize: '13px' }}>
          {word.examples && word.examples.length > 0 && (
            <div style={{ marginBottom: '6px' }}>
              <strong>📝 Examples:</strong>
              {word.examples.map((ex, i) => (
                <div key={i} style={{ marginTop: '4px', color: '#4A5568' }}>
                  <div>{ex.sentence}</div>
                  <div style={{ color: '#A0AEC0' }}>{ex.translation}</div>
                </div>
              ))}
            </div>
          )}
          {word.etymology && (
            <div style={{ marginBottom: '6px' }}>
              <strong>🌱 Etymology:</strong>
              <div style={{ color: '#4A5568', marginTop: '2px' }}>{word.etymology}</div>
            </div>
          )}
          {word.sources && word.sources.length > 0 && (
            <div style={{ fontSize: '11px', color: '#A0AEC0', marginTop: '6px' }}>
              Seen {word.lookupCount} time(s) · Last: {new Date(word.lastSeenAt).toLocaleDateString()}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
