import { WORD_DETECTION_PATTERN, MAX_SELECTION_LENGTH } from './constants';

export function normalizeWord(word: string): string {
  return word
    .trim()
    .toLowerCase()
    .replace(/^[^\w'-]+|[^\w'-]+$/g, '');
}

export function detectSelectionType(text: string): 'word' | 'sentence' | 'too-long' {
  const trimmed = text.trim();

  if (trimmed.length > MAX_SELECTION_LENGTH) {
    return 'too-long';
  }

  if (WORD_DETECTION_PATTERN.test(trimmed)) {
    return 'word';
  }

  return 'sentence';
}

export function extractContext(
  selection: Selection,
  maxLength: number = 300
): string {
  const range = selection.getRangeAt(0);
  const container = range.commonAncestorContainer;

  let blockElement = container.nodeType === Node.TEXT_NODE
    ? container.parentElement
    : container as Element;

  while (blockElement && !isBlockElement(blockElement)) {
    blockElement = blockElement.parentElement;
  }

  if (!blockElement) {
    return selection.toString();
  }

  const fullText = blockElement.textContent || '';
  const selectedText = selection.toString();
  const selectedIndex = fullText.indexOf(selectedText);

  if (selectedIndex === -1) {
    return selectedText;
  }

  const before = fullText.substring(0, selectedIndex);
  const after = fullText.substring(selectedIndex + selectedText.length);

  const sentenceStart = Math.max(
    before.lastIndexOf('. '),
    before.lastIndexOf('! '),
    before.lastIndexOf('? '),
    0
  );

  const sentenceEnd = findSentenceEnd(after);

  let context = fullText.substring(
    sentenceStart,
    selectedIndex + selectedText.length + sentenceEnd
  ).trim();

  if (context.length < 20 || /[{}[\];]/.test(context)) {
    const start = Math.max(0, selectedIndex - 100);
    const end = Math.min(fullText.length, selectedIndex + selectedText.length + 100);
    context = fullText.substring(start, end).trim();
  }

  return context.length > maxLength
    ? context.substring(0, maxLength) + '...'
    : context;
}

function isBlockElement(element: Element): boolean {
  const blockTags = ['P', 'DIV', 'ARTICLE', 'SECTION', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'LI', 'BLOCKQUOTE'];
  return blockTags.includes(element.tagName);
}

function findSentenceEnd(text: string): number {
  const match = text.match(/[.!?]\s/);
  return match ? match.index! + 1 : Math.min(text.length, 100);
}

export function generateId(): string {
  return crypto.randomUUID();
}

export function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}
