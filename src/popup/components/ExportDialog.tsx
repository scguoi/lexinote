import React, { useState, useMemo } from 'react';
import type { WordEntry } from '../../shared/types';
import { exportToAnki, downloadFile } from '../../shared/anki-export';
import { storage } from '../../shared/storage';
import { t } from '../../shared/i18n';

interface ExportDialogProps {
  words: WordEntry[];
  onClose: () => void;
}

export const ExportDialog: React.FC<ExportDialogProps> = ({ words, onClose }) => {
  const [result, setResult] = useState<{ exported: number; skipped: number; failed: number } | null>(null);

  const preview = useMemo(() => {
    return words.slice(0, 3).map(w => ({
      word: w.word,
      phonetic: w.phonetic,
      pos: w.partOfSpeech,
      definition: w.definition.length > 20 ? w.definition.slice(0, 20) + '...' : w.definition,
    }));
  }, [words]);

  const handleExport = async () => {
    const settings = await storage.getSettings();
    const exportResult = exportToAnki(words, settings);
    setResult({ exported: exportResult.exported, skipped: exportResult.skipped, failed: exportResult.failed });

    const date = new Date().toISOString().slice(0, 10);
    downloadFile(exportResult.content, `lexinote-${date}.tsv`);
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000,
    }}>
      <div style={{
        background: 'white', borderRadius: '12px', padding: '20px',
        width: '360px', maxHeight: '80vh', overflow: 'auto',
      }}>
        <h2 style={{ margin: '0 0 12px', fontSize: '16px' }}>📤 {t('exportToAnki')}</h2>

        {!result ? (
          <>
            <p style={{ fontSize: '13px', color: '#718096', margin: '0 0 12px' }}>
              {t('preview')} ({words.length} words):
            </p>
            <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse', marginBottom: '16px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                  <th style={{ textAlign: 'left', padding: '4px' }}>word</th>
                  <th style={{ textAlign: 'left', padding: '4px' }}>phonetic</th>
                  <th style={{ textAlign: 'left', padding: '4px' }}>pos</th>
                  <th style={{ textAlign: 'left', padding: '4px' }}>definition</th>
                </tr>
              </thead>
              <tbody>
                {preview.map((p, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #F7FAFC' }}>
                    <td style={{ padding: '4px' }}>{p.word}</td>
                    <td style={{ padding: '4px', color: '#A0AEC0' }}>{p.phonetic}</td>
                    <td style={{ padding: '4px' }}>{p.pos}</td>
                    <td style={{ padding: '4px' }}>{p.definition}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button onClick={onClose} style={{ padding: '8px 16px', border: '1px solid #E2E8F0', borderRadius: '8px', background: 'white', cursor: 'pointer' }}>
                {t('cancel')}
              </button>
              <button onClick={handleExport} style={{ padding: '8px 16px', border: 'none', borderRadius: '8px', background: '#6B7FFF', color: 'white', cursor: 'pointer' }}>
                {t('download')}
              </button>
            </div>
          </>
        ) : (
          <>
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <p style={{ fontSize: '14px', margin: '0 0 8px' }}>{t('exportComplete')}</p>
              <p style={{ fontSize: '13px', color: '#4ECDC4', margin: '4px 0' }}>✅ {t('exported')}: {result.exported}</p>
              {result.skipped > 0 && <p style={{ fontSize: '13px', color: '#ECC94B', margin: '4px 0' }}>⚠️ {t('skipped')}: {result.skipped}</p>}
              {result.failed > 0 && <p style={{ fontSize: '13px', color: '#FF6B6B', margin: '4px 0' }}>❌ {t('failed')}: {result.failed}</p>}
            </div>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <button onClick={onClose} style={{ padding: '8px 16px', border: 'none', borderRadius: '8px', background: '#6B7FFF', color: 'white', cursor: 'pointer' }}>
                {t('close')}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
