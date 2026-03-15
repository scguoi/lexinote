import React from 'react';
import type { WordEntry } from '../../shared/types';
import { WordItem } from './WordItem';
import { t } from '../../shared/i18n';

interface WordListProps {
  words: WordEntry[];
  onToggleStar: (id: string) => void;
  onDelete: (id: string) => void;
}

const WORD_EMOJIS = ['🌟', '🌸', '🌈', '🎨', '🎭', '🌻', '🍀', '🦋', '🌙', '💎'];

export const WordList: React.FC<WordListProps> = ({ words, onToggleStar, onDelete }) => {
  if (words.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 20px', color: '#A0AEC0' }}>
        <p style={{ fontSize: '14px' }}>{t('emptyState')}</p>
      </div>
    );
  }

  return (
    <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
      {words.map((word, index) => (
        <WordItem
          key={word.id}
          word={word}
          emoji={WORD_EMOJIS[index % WORD_EMOJIS.length]}
          onToggleStar={() => onToggleStar(word.id)}
          onDelete={() => onDelete(word.id)}
        />
      ))}
    </div>
  );
};
