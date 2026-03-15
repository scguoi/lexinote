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

      // Build back side: all info combined
      const backParts: string[] = [];
      if (word.phonetic) backParts.push(word.phonetic);
      if (word.partOfSpeech) backParts.push(`[${word.partOfSpeech}]`);
      if (word.definition) backParts.push(`<br><br>${word.definition}`);
      if (word.examples && word.examples.length > 0) {
        backParts.push('<br><br>📝 Examples:<br>' + word.examples
          .map(ex => `${escapeField(ex.sentence)}<br>${escapeField(ex.translation)}`)
          .join('<br><br>'));
      }
      if (word.etymology) backParts.push(`<br><br>🌱 ${escapeField(word.etymology)}`);

      const row = [
        escapeField(word.word),
        escapeField(backParts.join(' ')),
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
