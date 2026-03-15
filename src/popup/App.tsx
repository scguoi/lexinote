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
  const [captureMode, setCaptureMode] = useState(false);

  useEffect(() => {
    chrome.runtime.sendMessage({ type: 'GET_CAPTURE_MODE' }, (res) => {
      if (res) setCaptureMode(res.captureMode);
    });
    loadWords();

    // Reload when popup gains focus (e.g., reopened)
    const handleFocus = () => loadWords();
    window.addEventListener('focus', handleFocus);

    // Listen for storage changes
    const handleStorageChange = () => loadWords();
    chrome.storage.onChanged.addListener(handleStorageChange);

    return () => {
      window.removeEventListener('focus', handleFocus);
      chrome.storage.onChanged.removeListener(handleStorageChange);
    };
  }, []);

  const loadWords = async () => {
    await storage.initialize();
    const settings = await storage.getSettings();
    setLocale(settings.uiLanguage);
    const allWords = await storage.getWords();
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
    setWords(prev => prev.map(w => w.id === id ? { ...w, starred: !w.starred } : w));
    await storage.toggleStarred(id);
  };

  const handleDelete = async (id: string) => {
    await storage.deleteWord(id);
    setWords(words.filter(w => w.id !== id));
  };

  const toggleCaptureMode = () => {
    chrome.runtime.sendMessage({ type: 'TOGGLE_CAPTURE' }, (res) => {
      if (res) setCaptureMode(res.captureMode);
    });
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

      <button
        onClick={toggleCaptureMode}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 12px',
          marginBottom: '12px',
          background: captureMode ? '#EEF0FF' : '#F8F9FA',
          border: captureMode ? '1.5px solid #6B7FFF' : '1.5px solid transparent',
          borderRadius: '12px',
          cursor: 'pointer',
          transition: 'all 0.2s',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '16px' }}>{captureMode ? '⚡' : '🔍'}</span>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#2D3748' }}>{t('captureMode')}</div>
            <div style={{ fontSize: '11px', color: '#718096', marginTop: '2px' }}>{t('captureModeDesc')}</div>
          </div>
        </div>
        <span style={{
          fontSize: '11px',
          fontWeight: 600,
          padding: '2px 8px',
          borderRadius: '6px',
          background: captureMode ? '#6B7FFF' : '#CBD5E0',
          color: '#fff',
        }}>
          {captureMode ? t('captureModeOn') : t('captureModeOff')}
        </span>
      </button>

      <SearchBar value={search} onChange={setSearch} />

      <div style={{
        marginBottom: '12px',
        padding: '10px 12px',
        background: '#F8F9FA',
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <span style={{ fontSize: '13px', color: '#2D3748' }}>
          🎉 {t('wordsCollected', String(words.length))}
        </span>
        <button
          onClick={() => setShowExport(true)}
          style={{
            background: '#6B7FFF',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '6px 12px',
            cursor: 'pointer',
            fontSize: '13px',
          }}
        >📤 {t('exportToAnki')}</button>
      </div>

      <TabFilter active={tab} onChange={setTab} />

      <WordList
        words={filteredWords}
        onToggleStar={handleToggleStar}
        onDelete={handleDelete}
      />

      {showExport && (
        <ExportDialog
          words={words}
          onClose={() => setShowExport(false)}
          onWordsDeleted={loadWords}
        />
      )}
    </div>
  );
};
