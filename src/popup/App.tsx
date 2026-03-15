import React, { useState, useEffect } from 'react';
import { storage } from '../shared/storage';
import { t, setLocale } from '../shared/i18n';
import type { WordEntry } from '../shared/types';
import { SearchBar } from './components/SearchBar';
import { TabFilter } from './components/TabFilter';
import { WordList } from './components/WordList';
import { ExportDialog } from './components/ExportDialog';

export const App: React.FC = () => {
  const [words, setWords] = useState<WordEntry[]>([]);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'all' | 'starred'>('all');
  const [showExport, setShowExport] = useState(false);

  useEffect(() => {
    loadWords();
  }, []);

  const loadWords = async () => {
    await storage.initialize();
    const settings = await storage.getSettings();
    setLocale(settings.uiLanguage);
    const allWords = await storage.getAllWords();
    setWords(allWords.sort((a, b) => b.lastSeenAt - a.lastSeenAt));
  };

  const filteredWords = words.filter(w => {
    const matchesSearch = !search ||
      w.word.toLowerCase().includes(search.toLowerCase()) ||
      w.definition.toLowerCase().includes(search.toLowerCase());
    const matchesTab = tab === 'all' || (tab === 'starred' && w.starred);
    return matchesSearch && matchesTab;
  });

  const handleToggleStar = async (id: string) => {
    const word = words.find(w => w.id === id);
    if (word) {
      word.starred = !word.starred;
      await storage.updateWord(id, { starred: word.starred });
      setWords([...words]);
    }
  };

  const handleDelete = async (id: string) => {
    await storage.deleteWord(id);
    setWords(words.filter(w => w.id !== id));
  };

  return (
    <div style={{ padding: '16px', background: '#fff', minHeight: '100vh' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <h1 style={{ fontSize: '18px', margin: 0, color: '#2D3748' }}>📚 {t('myVocabulary')}</h1>
        <button
          onClick={() => chrome.runtime.openOptionsPage()}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', padding: '4px' }}
          aria-label={t('settings')}
        >⚙️</button>
      </div>

      <SearchBar value={search} onChange={setSearch} />
      <TabFilter active={tab} onChange={setTab} />

      <WordList
        words={filteredWords}
        onToggleStar={handleToggleStar}
        onDelete={handleDelete}
      />

      <div style={{
        marginTop: '16px',
        padding: '12px',
        background: '#F8F9FA',
        borderRadius: '12px',
        textAlign: 'center',
      }}>
        <p style={{ margin: '0 0 8px', fontSize: '14px', color: '#2D3748' }}>
          🎉 {t('wordsCollected', String(words.length))}
        </p>
        <button
          onClick={() => setShowExport(true)}
          style={{
            background: '#6B7FFF',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '8px 16px',
            cursor: 'pointer',
            fontSize: '14px',
          }}
        >📤 {t('exportToAnki')}</button>
      </div>

      {showExport && (
        <ExportDialog
          words={words}
          onClose={() => setShowExport(false)}
        />
      )}
    </div>
  );
};
