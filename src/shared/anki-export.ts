import type { WordEntry, Settings } from './types';

export interface ExportResult {
  exported: number;
  skipped: number;
  failed: number;
  content: string;
}

export function exportToAnki(words: WordEntry[], settings: Settings): ExportResult {
  const BOM = '\uFEFF';
  const result: ExportResult = { exported: 0, skipped: 0, failed: 0, content: '' };
  const rows: string[] = [];

  for (const word of words) {
    if (!word.word || !word.definition) {
      result.skipped++;
      continue;
    }

    try {
      const tags = generateTags(word, settings);
      const examples = word.examples
        .map(ex => `${escapeField(ex.sentence)}<br>${escapeField(ex.translation)}`)
        .join('<br><br>');

      const row = [
        escapeField(word.word),
        escapeField(word.phonetic),
        escapeField(word.partOfSpeech),
        escapeField(word.definition),
        examples,
        escapeField(word.etymology),
        escapeField(word.mnemonic || ''),
        tags,
      ].join('\t');

      rows.push(row);
      result.exported++;
    } catch {
      result.failed++;
    }
  }

  result.content = BOM + rows.join('\n');
  return result;
}

function escapeField(value: string): string {
  return value
    .replace(/\t/g, ' ')
    .replace(/\n/g, '<br>')
    .replace(/"/g, '""');
}

function generateTags(word: WordEntry, settings: Settings): string {
  const tags = ['lexinote'];

  if (word.partOfSpeech) {
    tags.push(`pos:${word.partOfSpeech.toLowerCase()}`);
  }

  tags.push(`status:${word.status}`);
  tags.push(`lang:${settings.sourceLanguage}-${settings.targetLanguage}`);

  if (word.starred) {
    tags.push('starred');
  }

  return tags.join(' ');
}

export function downloadFile(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/tab-separated-values;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
