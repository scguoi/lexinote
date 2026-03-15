# LexiNote - Vocabulary Capture Browser Extension Design

**Date:** 2026-03-15
**Version:** 1.0
**Status:** Design Approved

## Executive Summary

LexiNote is a modern browser extension designed to streamline vocabulary acquisition during English reading. It captures words with context, provides AI-powered definitions, and exports to Anki for spaced repetition review.

### Core Value Proposition

- **Seamless capture**: Double-click word → instant lookup → auto-save
- **Context preservation**: Saves word + sentence + source URL
- **AI-powered**: LLM-generated comprehensive definitions
- **Review integration**: Direct export to Anki format

## 1. Product Goals

### Primary Objectives

1. **Frictionless vocabulary capture** during reading
2. **Rich word information** (definition, phonetics, etymology, examples)
3. **Sentence translation** support (without saving to vocabulary)
4. **Anki export** for spaced repetition review

### Success Criteria

- Word lookup completes in < 2 seconds
- Zero-friction capture (no manual input required)
- Clean, delightful UI that encourages daily use
- Successful Anki import without manual formatting

## 2. User Experience Design

### 2.1 Interaction Flow

#### Word Lookup Flow

```
User double-clicks word
    ↓
Text selected (browser default)
    ↓
Floating button appears above selection
    ↓
User clicks button
    ↓
Loading card appears with typing animation
    ↓
SSE streaming response fills card progressively
    ↓
Word enters pending save state (not yet in storage)
    ↓
Confirmation toast: "Added to vocabulary 🎉 [Undo]"
    ↓
(5 second pending window)
├─ User clicks Undo → cancel save, show "Cancelled ✨"
└─ Timer expires → word written to storage (permanent)
```

**Pending save mechanism:** After streaming completes, the word is held in memory for 5 seconds before being committed to `chrome.storage.local`. The toast shows an "Undo" button during this window. Clicking Undo simply discards the pending entry — no write or rollback occurs. This avoids polluting storage, event streams, and statistics with transient entries.

**Card dismissal:**
- Click outside the card → close card
- Press `Esc` key → close card
- User makes a new text selection → close current card, show new floating button
- Scroll: close card only when the selected text leaves the viewport or scroll distance exceeds 200px (allows minor scroll adjustments while viewing the card)

**Concurrent lookup strategy:** Only one lookup can be active at a time. If the user triggers a new lookup while a previous one is still streaming:
1. Cancel the in-flight request (send `CANCEL` with the old `requestId`, abort the fetch)
2. Dismiss the current card
3. Start the new lookup immediately
This ensures the UI always reflects the user's latest intent without stale results appearing.

#### Sentence Translation Flow

```
User selects a sentence (drag select)
    ↓
System detects spaces/punctuation → sentence mode
    ↓
Floating button appears above selection
    ↓
User clicks button
    ↓
Translation card appears with streaming response
    ↓
(NOT saved to vocabulary)
```

#### Detection Logic

**V1 scope: English word detection only.** Multi-language word segmentation (Japanese, Korean, etc.) is deferred to a future version. The `sourceLanguage` setting in V1 is limited to English; other languages in the supported list are available only as `targetLanguage` (for definitions/translations).

- **Word mode**: Selected text is a single English word token
- **Sentence mode**: Selected text contains multiple word tokens

**Detection rules (in order):**

1. Trim leading/trailing whitespace from selection
2. Allow hyphens within words (e.g., `well-known`, `self-esteem`)
3. Allow apostrophes within words (e.g., `don't`, `it's`)
4. If the trimmed text matches pattern `^[a-zA-Z'-]+$` (letters, hyphens, apostrophes only) → **word mode**
5. Otherwise → **sentence mode**
6. Max selection length: 500 characters (reject longer selections)

**Future: Multi-language word detection.** When expanding `sourceLanguage` beyond English, replace the regex approach with `Intl.Segmenter` (Unicode-aware word boundary detection) to correctly handle CJK characters, accented Latin characters, etc.

### 2.2 Visual Design

#### Design Principles

- **Modern**: Clean lines, generous whitespace, subtle shadows
- **Minimalist**: Only essential information, no clutter
- **Warm & Cute**: Soft colors, emoji accents, encouraging copy
- **Accessible**: High contrast text, readable font sizes

#### Color Palette

| Role | Color | Usage |
|------|-------|-------|
| Primary | `#6B7FFF` | Buttons, accents, links |
| Secondary | `#FFB4D6` | Highlights, decorations |
| Background | `#FFFFFF` / `#F8F9FA` | Cards, panels |
| Text | `#2D3748` | Primary text (soft black) |
| Success | `#4ECDC4` | Confirmations, success states |
| Error | `#FF6B6B` | Error messages |

#### Typography

- English: Inter / SF Pro (system fallback)
- Chinese: PingFang SC / Source Han Sans
- Base size: 14px, secondary: 12px
- Line height: 1.6

#### Animations

- All transitions: 0.2s ease
- Button hover: scale(1.05)
- Card appear: fade-in + translateY(-4px)
- Streaming cursor: blinking `▊` animation

### 2.3 UI Components

#### Floating Button

- Circular, 36px diameter
- White background with gradient border (primary → secondary)
- Soft shadow: `0 2px 8px rgba(0,0,0,0.1)`
- Hover: scale up + deeper shadow

**Positioning strategy (four-quadrant):**
- Compute available space in all four directions from the selection center
- Default: above-center (preferred position)
- If insufficient space above (< 50px to viewport top) → flip to below
- If insufficient space on right (< 50px to viewport right) → shift left
- If insufficient space on left (< 50px to viewport left) → shift right
- If insufficient space below (< 50px to viewport bottom, and already flipped) → overlay at nearest viable position
- Always clamp within visible viewport bounds
- If selection is inside an iframe → position relative to iframe bounds

#### Word Definition Card

```
┌─────────────────────────────────┐
│ ✨ serendipity                  │
│ /ˌserənˈdɪpəti/                │
│ 🏷️ noun                        │
│                                 │
│ 💭 Definition                   │
│ The ability to find beautiful   │
│ things by accident              │
│                                 │
│ 📝 Examples                     │
│ Finding you was pure            │
│ serendipity.                    │
│                                 │
│ 🌱 Etymology                   │
│ From Persian fairy tale         │
│ "The Three Princes of Serendip"│
│                                 │
│ ┌─────────────────────────────┐│
│ │ ✓ Added to vocabulary 🎉   ││
│ │              [Undo · 5s]   ││
│ └─────────────────────────────┘│
└─────────────────────────────────┘
```

- Max width: 400px
- Border radius: 12px
- Shadow: `0 8px 24px rgba(0,0,0,0.08)`
- Gradient top border decoration

#### Sentence Translation Card

```
┌─────────────────────────────────┐
│ 💬 Translation                  │
│                                 │
│ 📖 Original                    │
│ [English sentence]              │
│                                 │
│ 🌏 Translation                 │
│ [Target language translation]   │
│                                 │
│ 💡 Explanation                  │
│ [Grammar/usage notes]           │
│                                 │
│                     [📋 Copy]   │
└─────────────────────────────────┘
```

- "Copy" button copies the translation text to clipboard
- Show brief "Copied ✨" feedback on click
- Clipboard fallback: if `navigator.clipboard.writeText()` fails (permission denied or unsupported context), fall back to `document.execCommand('copy')`. If both fail, show "Copy failed, please select and copy manually" with the text pre-selected for easy manual copy

#### Vocabulary List (Popup)

```
┌─────────────────────────────────────┐
│ 📚 My Vocabulary                    │
│                                     │
│ 🔍 [Search your words...]    ⚙️     │
│                                     │
│ [💫 All] [⭐ Starred]                │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 🌟 ephemeral            ⭐ 🗑️  │ │
│ │ /ɪˈfemərəl/                    │ │
│ │ adj. short-lived, fleeting     │ │
│ │ Added 2026-03-15               │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 🌸 blossom              ☆ 🗑️  │ │
│ │ /ˈblɒsəm/                      │ │
│ │ v. to bloom; to flourish       │ │
│ │ Added 2026-03-14               │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 🎉 You've collected 42 words!  │ │
│ │ [📤 Export to Anki]            │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

**Empty state:** "No words yet. Try double-clicking a word while reading! ✨"
**Delete confirmation:** "Say goodbye to this word? 🥺"

#### Settings Page (Options)

```
┌─────────────────────────────────────┐
│ ⚙️ Settings                         │
│                                     │
│ 🌐 Interface Language               │
│ [Auto (Browser Default) ▼]          │
│                                     │
│ 📚 Learning Languages               │
│ Source: [English ▼]                 │
│ Target: [Chinese ▼]                │
│                                     │
│ 🔌 API Configuration                │
│ Base URL: [____________]             │
│ API Key:  [************]             │
│                                     │
│ 🤖 Model Configuration              │
│ ⚡ Fast Model (Daily Lookup):       │
│    [________________]                │
│ 🧠 Smart Model (Anki Export):       │
│    [________________]                │
│                                     │
│ 🎨 Appearance                       │
│ Theme: [Light ▼]                    │
│                                     │
│ [Test Connection]  [Save]            │
└─────────────────────────────────────┘
```

**Unsaved changes guard:** If the user has modified any field and attempts to navigate away (close the options tab, click browser back), show a browser-native `beforeunload` confirmation: "You have unsaved changes. Leave anyway?" This applies to the options page only.

**Test Connection behavior:** Sends a minimal request to `{apiBaseUrl}/v1/models` (or `/v1/chat/completions` with a trivial prompt) using the configured API key and fast model.

| Result | UI Feedback |
|--------|-------------|
| HTTP 200 + valid response | "Connection successful ✅" (green text, 3s auto-dismiss) |
| HTTP 401/403 | "Invalid API key 🔑" |
| HTTP 404 | "Endpoint not found. Check your Base URL" |
| HTTP 429 | "Rate limited. Connection works but try again later ⏱️" |
| Network error / timeout (5s) | "Cannot reach server. Check URL and network 🌐" |
| Model not found in response | "Connected, but model '{fastModel}' not available 🤖" |

## 3. Technical Architecture

### 3.1 Technology Stack

| Component | Technology |
|-----------|-----------|
| Extension Standard | Chrome Manifest V3 |
| UI Framework | React 18 + TypeScript |
| Build Tool | Vite |
| Styling | CSS Modules or Tailwind CSS |
| Storage | chrome.storage.local |
| API Protocol | OpenAI-compatible (SSE streaming) |
| i18n | chrome.i18n API |
| Testing | Vitest + React Testing Library |

### 3.2 Project Structure

```
lexinote/
├── manifest.json
├── package.json
├── vite.config.ts
├── tsconfig.json
├── _locales/
│   ├── en/
│   │   └── messages.json
│   ├── zh_CN/
│   │   └── messages.json
│   └── zh_TW/
│       └── messages.json
├── src/
│   ├── background/
│   │   ├── service-worker.ts
│   │   ├── api-client.ts
│   │   └── stream-handler.ts
│   ├── content/
│   │   ├── content-script.tsx
│   │   ├── components/
│   │   │   ├── FloatingButton.tsx
│   │   │   ├── WordCard.tsx
│   │   │   └── SentenceCard.tsx
│   │   └── hooks/
│   │       ├── useTextSelection.ts
│   │       └── useStreaming.ts
│   ├── popup/
│   │   ├── popup.tsx
│   │   └── components/
│   │       ├── VocabularyList.tsx
│   │       ├── WordItem.tsx
│   │       ├── SearchBar.tsx
│   │       ├── FilterTabs.tsx
│   │       └── ExportButton.tsx
│   ├── options/
│   │   ├── options.tsx
│   │   └── components/
│   │       ├── LanguageSettings.tsx
│   │       ├── ApiSettings.tsx
│   │       ├── ModelSettings.tsx
│   │       └── AppearanceSettings.tsx
│   └── shared/
│       ├── types.ts
│       ├── storage.ts
│       ├── i18n.ts
│       ├── constants.ts
│       └── utils.ts
├── public/
│   └── icons/
│       ├── icon-16.png
│       ├── icon-48.png
│       └── icon-128.png
└── tests/
    ├── detection.test.ts
    ├── storage.test.ts
    ├── api-client.test.ts
    └── anki-export.test.ts
```

### 3.3 Component Architecture

```
┌─────────────────────────────────────────────┐
│                  Browser Tab                 │
│                                             │
│  ┌─────────────────────────────────────┐    │
│  │         Content Script              │    │
│  │  ┌──────────┐  ┌──────────────┐    │    │
│  │  │ Selection │  │ FloatingBtn  │    │    │
│  │  │ Detector  │  │              │    │    │
│  │  └──────────┘  └──────────────┘    │    │
│  │  ┌──────────────────────────────┐  │    │
│  │  │ WordCard / SentenceCard      │  │    │
│  │  │ (streaming display)          │  │    │
│  │  └──────────────────────────────┘  │    │
│  └──────────────┬──────────────────┘  │    │
│                 │ chrome.runtime       │    │
│                 │ .connect (port)      │    │
│  ┌──────────────▼──────────────────┐  │    │
│  │     Background Service Worker    │  │    │
│  │  ┌──────────┐  ┌─────────────┐  │  │    │
│  │  │ API      │  │ Stream      │  │  │    │
│  │  │ Client   │  │ Handler     │  │  │    │
│  │  └──────────┘  └─────────────┘  │  │    │
│  │  ┌──────────────────────────┐   │  │    │
│  │  │ Storage Manager          │   │  │    │
│  │  └──────────────────────────┘   │  │    │
│  └─────────────────────────────────┘  │    │
│                                             │
│  ┌──────────────┐  ┌──────────────────┐    │
│  │   Popup      │  │   Options Page   │    │
│  │ (Vocabulary) │  │   (Settings)     │    │
│  └──────────────┘  └──────────────────┘    │
└─────────────────────────────────────────────┘
```

## 4. Data Model

### 4.1 Word Entry

```typescript
interface WordEntry {
  id: string;
  word: string;
  normalizedWord: string;
  lemma?: string;
  phonetic: string;
  partOfSpeech: string;
  definition: string;
  examples: Array<{ sentence: string; translation: string }>;
  etymology: string;
  mnemonic?: string;
  sources: Array<{
    url: string;
    title: string;
    context: string;
    seenAt: number;
  }>;
  sourceLanguage: string;
  targetLanguage: string;
  addedAt: number;
  lastSeenAt: number;
  lookupCount: number;
  status: 'new' | 'reviewing' | 'mastered';  // V1: always 'new', status transitions reserved for future version
  starred: boolean;
}
```

**V1 scope for `status`:** All words are created with `status: 'new'`. The `reviewing` and `mastered` states exist in the data model for forward compatibility (Anki tag generation, future review features), but V1 does not expose any UI to change status. The popup filter tabs show `[All] [Starred]` only — no status-based filtering in V1.

**`normalizedWord` field:** Used for deduplication and search. Generated locally, never dependent on LLM output.

Normalization rules (local, deterministic):
1. Convert to lowercase
2. Strip leading/trailing punctuation (e.g., `"running,"` → `running`)
3. Trim whitespace

This produces a stable key for dedup and search that works offline and across different LLM providers.

**`lemma` field (optional):** The base/dictionary form of the word (e.g., `runs`/`running`/`ran` → `run`). Populated from the LLM response when available. Used as a display enhancement and for smarter grouping, but never as the dedup key. If the LLM returns a different lemma than expected, it does not affect existing entries.

### 4.2 Context Extraction

The `sources[].context` field captures the sentence surrounding the selected word:

1. Get the text node containing the selection
2. Expand to the nearest sentence boundaries (`.`, `!`, `?`, or paragraph break)
3. Max length: 300 characters
4. If the DOM structure is complex (text spans multiple elements), walk up to the nearest block-level parent and extract its text content

**Fallback for unreliable sentence boundaries:** Abbreviations (e.g., `Dr.`, `U.S.`), code blocks, headings, and list items can produce false sentence boundaries. If the extracted sentence is suspiciously short (< 20 characters) or contains code-like patterns, fall back to a fixed window: 100 characters before and after the selected word from the parent block element's text content.

### 4.3 Duplicate Handling

When a user looks up a word that already exists in the vocabulary:

- Append a new entry to `sources[]` with the current URL, page title (`document.title`), context, and timestamp
- Update `lastSeenAt` to current timestamp
- Increment `lookupCount`
- Keep the existing definition (do not re-query)
- Show "Seen again! (3rd time) ✨" instead of "Added to vocabulary"
- User can click "Re-lookup" to refresh the definition

**Sources retention policy:** Each word retains at most 10 source entries. When the limit is reached, the oldest entry is dropped (FIFO). `lookupCount` continues to increment regardless, so the total encounter count is always accurate even if older contexts are pruned.

This preserves recent contexts while bounding storage growth, enabling:
- "Recently seen" sorting
- Multi-context review (see the word in different articles)
- Export with multiple example contexts for Anki

### 4.4 Storage Schema Versioning

```typescript
interface StorageSchema {
  version: number;        // Schema version, starts at 1
  words: WordEntry[];
  settings: Settings;
}
```

On extension update, check `version` and run migrations if needed. Each migration is a function that transforms the old schema to the new one.

### 4.5 Settings

```typescript
interface Settings {
  // API
  apiBaseUrl: string;
  apiKey: string;

  // Models
  fastModel: string;
  smartModel: string;

  // Languages
  sourceLanguage: string;   // default: 'en'
  targetLanguage: string;   // default: 'zh'
  uiLanguage: string;       // default: 'auto'

  // Appearance
  theme: 'light' | 'dark';
}
```

### 4.6 Supported Languages

```typescript
// V1: sourceLanguage is fixed to English only
const SOURCE_LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English' },
];

// targetLanguage supports multiple languages
const TARGET_LANGUAGES = [
  { code: 'zh', name: 'Chinese', nativeName: '中文' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語' },
  { code: 'ko', name: 'Korean', nativeName: '한국어' },
  { code: 'es', name: 'Spanish', nativeName: 'Español' },
  { code: 'fr', name: 'French', nativeName: 'Français' },
  { code: 'de', name: 'German', nativeName: 'Deutsch' },
  { code: 'en', name: 'English', nativeName: 'English' },
];
```

## 5. API Integration

### 5.1 OpenAI-Compatible API

All LLM calls use the OpenAI chat completions API format, allowing users to connect to any compatible provider.

### 5.2 Host Permissions Model

Manifest V3 requires explicit host permissions for network requests. Since users configure their own API base URL, the extension must dynamically request permissions for custom domains.

**Strategy:**

1. **Built-in providers (no extra permission needed):** Pre-declare `host_permissions` in manifest.json for well-known OpenAI-compatible providers to reduce friction:
   ```json
   "host_permissions": [
     "https://api.openai.com/*",
     "https://api.deepseek.com/*",
     "https://api.groq.com/*",
     "https://api.together.xyz/*"
   ]
   ```
   Only providers that implement the OpenAI `/v1/chat/completions` schema (including SSE streaming) are included. Providers with incompatible protocols (e.g., Anthropic Messages API, Google Gemini API) are out of scope for V1.

2. **Custom provider domains:** Use `chrome.permissions.request()` with `optional_host_permissions` to dynamically request access when the user saves a custom API base URL.

3. **Permission flow in Settings page:**
   ```
   User enters custom API Base URL
       ↓
   Validate URL format
   ├─ Not a valid URL → "Please enter a valid URL"
   ├─ Not HTTPS → "Only HTTPS URLs are supported for security"
   ├─ Localhost/file/IP → "Local and file URLs are not supported"
   └─ Valid HTTPS URL → continue
       ↓
   Parse domain from URL
       ↓
   Is domain in built-in list?
   ├─ Yes → Save directly, no extra prompt
   └─ No → chrome.permissions.request({ origins: ["https://custom.domain/*"] })
       ├─ User grants → Save settings, show success
       └─ User denies → Show blocking message:
          "Permission required to connect to this API.
           Without it, word lookups won't work.
           [Grant Permission] [Use Built-in Provider]"
   ```

4. **Manifest declaration:**
   ```json
   "optional_host_permissions": ["https://*/*"]
   ```
   This allows requesting any HTTPS domain at runtime, but only after explicit user consent.

5. **Permission revocation handling:** On each API call, check if the permission is still granted. If revoked, show a non-intrusive banner: "API connection lost. Check settings 🔑"

### 5.3 Streaming Implementation

**Background Service Worker** handles all API calls:

1. Content script opens a long-lived port via `chrome.runtime.connect`
2. Content script sends lookup request through the port
3. Background initiates SSE streaming request to LLM API
4. Background parses `data:` chunks and posts each chunk through the port
5. Content script updates card UI progressively
6. On `[DONE]`, background sends completion message, port is disconnected

**Why `chrome.runtime.connect` (long-lived port)?**
`chrome.runtime.sendMessage` is a single request-response pattern and cannot push multiple messages. A long-lived port allows the background to stream multiple chunks to the content script.

**Communication flow:**

```
Content Script                    Background
     │                                │
     │── port = connect("lookup") ───>│
     │── { type: LOOKUP_REQUEST } ───>│
     │                                │── fetch(stream:true) ──> LLM API
     │                                │<── SSE chunks ──────────
     │<── { type: STREAM_CHUNK } ────│  (via port.postMessage)
     │<── { type: STREAM_CHUNK } ────│
     │<── { type: STREAM_CHUNK } ────│
     │<── { type: STREAM_COMPLETE } ─│
     │── port.disconnect() ──────────>│
     │                                │
     │── sendMessage(SAVE_WORD) ─────>│
     │                                │── chrome.storage.local
```

**Service Worker lifecycle:** Manifest V3 Service Workers can be terminated when idle. To prevent termination during active streaming, the open port keeps the Service Worker alive. If the worker is unexpectedly terminated, the content script detects port disconnection and shows a retry option.

**Throttling:** UI updates batched every 50ms to reduce DOM operations.

**Cancellation:** AbortController cancels in-flight requests when user closes card.

**Port message schema:**

All messages over the long-lived port follow a typed protocol:

```typescript
// Content Script → Background
type RequestMessage =
  | { type: 'LOOKUP_REQUEST'; requestId: string; word: string; context: string; url: string; isWord: boolean }
  | { type: 'CANCEL'; requestId: string };

// Background → Content Script
type ResponseMessage =
  | { type: 'STREAM_CHUNK'; requestId: string; content: string }
  | { type: 'STREAM_COMPLETE'; requestId: string; fullText: string }
  | { type: 'STREAM_ERROR'; requestId: string; error: string; code: 'NETWORK' | 'AUTH' | 'RATE_LIMIT' | 'MODEL' | 'TIMEOUT' }
  | { type: 'STREAM_CANCELLED'; requestId: string };

// One-shot messages (via sendMessage, not port)
type SaveMessage =
  | { type: 'SAVE_WORD'; entry: WordEntry }
  | { type: 'SAVE_RESULT'; success: boolean; isDuplicate: boolean; lookupCount?: number };
```

**`requestId`:** Generated by the content script (e.g., `crypto.randomUUID()`). All response messages carry the same `requestId` so the content script can match chunks to the correct card. When a new lookup starts, the content script ignores any late-arriving chunks from a previous `requestId`.

### 5.3 Streaming Display Strategy

LLM output uses plain text with line-based field separators instead of JSON. This allows the card to display content naturally during streaming — users see readable text appearing progressively, not raw JSON syntax.

**Approach: Plain text streaming with field parsing on completion.**

1. **During streaming**: Display content directly in the card as it arrives. The card renders text line by line with a blinking cursor. Users see natural language content (definitions, examples) appearing in real time.
2. **On completion**: Parse the full response by field separators (`---`) to extract structured fields (phonetic, definition, examples, etc.) and re-render into the final styled card layout.
3. **Fallback**: If field parsing fails, display the raw text as-is — it's still readable since it's plain language, not JSON.

**Why not JSON?** Streaming raw JSON creates a poor visual experience — users see braces, quotes, and escape characters. Plain text with separators is human-readable at every point during streaming.

### 5.4 LLM Prompts

#### Word Lookup Prompt (Fast Model)

```
You are a helpful vocabulary assistant.
Analyze the word "{word}" in {sourceLanguage}.
Provide information in {targetLanguage}.

Use EXACTLY this format with "---" as field separators:

[phonetic]
/pronunciation here/
---
[pos]
part of speech
---
[definition]
concise definition in {targetLanguage}
---
[example1]
example sentence in {sourceLanguage}
translation in {targetLanguage}
---
[example2]
another example sentence in {sourceLanguage}
translation in {targetLanguage}
---
[etymology]
word origin and root analysis in {targetLanguage}

IMPORTANT: Output ONLY the formatted content above. Do not add any greeting, explanation, preamble, or closing remarks before or after the content. Start directly with [phonetic].

Context: "{context}"
```

#### Sentence Translation Prompt (Fast Model)

```
Translate and explain this {sourceLanguage} sentence.
Respond in {targetLanguage}.

Use EXACTLY this format with "---" as field separators:

[translation]
translation in {targetLanguage}
---
[explanation]
grammar and usage explanation in {targetLanguage}

IMPORTANT: Output ONLY the formatted content above. Do not add any greeting, explanation, preamble, or closing remarks. Start directly with [translation].

Sentence: "{sentence}"
```

#### Anki Export Prompt (Smart Model)

Uses JSON format (non-streaming, batch processing):

```
You are an expert vocabulary teacher preparing Anki flashcards.
For the word "{word}", create a comprehensive entry.
Respond in {targetLanguage}.

Context: "{sourceContext}"
Source: "{sourceUrl}"

Return JSON:
{
  "phonetic": "...",
  "partOfSpeech": "...",
  "definition": "...",
  "examples": [
    {"sentence": "...", "translation": "..."}
  ],
  "etymology": "...",
  "mnemonic": "..."
}
```

**Note:** Anki export uses JSON because it runs non-streaming in batch mode (Smart Model). Only the real-time lookup prompts (Fast Model) use the plain text separator format for streaming display.

### 5.5 Anki Export Format

**File format:** Tab-separated values (TSV), UTF-8 encoded with BOM.

**Escape rules:**
- Tab characters in content → replaced with spaces
- Newlines in content → replaced with `<br>` (Anki supports HTML in fields)
- Double quotes → escaped as `""`

**Export fields:**

```
word\tphonetic\tpartOfSpeech\tdefinition\texamples\tetymology\tmnemonic\ttags
```

**Field requirements:**

| Field | Required | Fallback if empty |
|-------|----------|-------------------|
| word | Yes | — (skip row if missing) |
| phonetic | No | Empty string |
| partOfSpeech | No | Empty string |
| definition | Yes | — (skip row if missing) |
| examples | No | Empty string |
| etymology | No | Empty string |
| mnemonic | No | Empty string |
| tags | Yes | Auto-generated (always present) |

- `examples`: Multiple examples joined with `<br>`
- `mnemonic`: Memory aid generated by Smart Model

**Tag generation rules (deterministic, not free-form):**

Tags are auto-generated from word metadata. Format: `namespace:value`.

| Tag | Source | Example |
|-----|--------|---------|
| `lexinote` | Always present (source identifier) | `lexinote` |
| `pos:{value}` | From `partOfSpeech` | `pos:noun`, `pos:verb` |
| `status:{value}` | From `status` field | `status:new`, `status:mastered` |
| `lang:{src}-{tgt}` | From language settings | `lang:en-zh` |
| `starred` | Only if `starred === true` | `starred` |

Example full tag string: `lexinote pos:noun status:new lang:en-zh starred`

**Export options:**
- Export all words, or filter by status/starred
- User can select date range

**Export completion summary:** After export finishes, display a result dialog:
```
Export complete!
✅ Exported: 38 words
⚠️ Skipped: 2 words (missing definition)
❌ Failed: 0 words

[Download File]  [Close]
```
This ensures users know exactly what was included and can investigate skipped entries if needed.

**Anki import instructions:**
- File type: "Text separated by tabs"
- Field mapping provided in export dialog
- Default deck name: "LexiNote"

**Export preview:** Before downloading, show a preview of the first 3 rows in a table format so users can verify field mapping, encoding, and content quality. The preview dialog includes:
```
Preview (first 3 of 38 words):
┌──────────┬──────────┬──────┬────────────┬─────────┐
│ word     │ phonetic │ pos  │ definition │ tags    │
├──────────┼──────────┼──────┼────────────┼─────────┤
│ ephemeral│ /ɪˈfe... │ adj  │ 短暂的     │ pos:adj │
│ blossom  │ /ˈblɒ... │ verb │ 开花；繁荣 │ pos:verb│
│ ...      │ ...      │ ...  │ ...        │ ...     │
└──────────┴──────────┴──────┴────────────┴─────────┘

[Download]  [Cancel]
```

## 6. Internationalization (i18n)

### 6.1 Strategy

- Use `chrome.i18n` API for UI text
- Default UI language: auto-detect from `chrome.i18n.getUILanguage()`
- User can override in settings
- Supported UI languages: English, Simplified Chinese, Traditional Chinese

### 6.2 Locale Files

Located in `_locales/{locale}/messages.json`.

Key message categories:
- **UI labels**: buttons, headers, placeholders
- **Status messages**: success, error, loading
- **Warm copy**: encouraging messages, empty states, confirmations

## 7. Security

### 7.1 API Key Storage

- API key stored in `chrome.storage.local` (isolated from web page access)
- All API calls made from background service worker only (never from content script)
- Content script communicates with background via message passing — no direct API access

### 7.2 Content Security

- LLM response content is rendered as text nodes, never as raw HTML (`textContent`, not `innerHTML`)
- User-selected text is sanitized before being sent to the LLM API
- Content script injects UI via Shadow DOM to isolate styles and prevent page interference

### 7.3 CSP Configuration

Manifest V3 enforces strict CSP by default. The extension only needs:
- `connect-src` for the user-configured API base URL (handled via `host_permissions` in manifest)

## 8. Error Handling

### 8.1 Error Categories

| Error | User Message | Action |
|-------|-------------|--------|
| Invalid API key | "API key is invalid. Check settings 🔑" | Link to settings |
| Network failure | "Network error. Try again later 🌐" | Retry button |
| Rate limited | "Too many requests. Wait a moment ⏱️" | Auto-retry with backoff |
| Model not found | "Model not available. Check settings 🤖" | Link to settings |
| Selection too long | "Selection too long. Choose shorter text 📏" | Dismiss |
| Stream interrupted | Show partial content + retry option | Retry / save partial |

### 8.2 Timeout

- Streaming requests: 30 second timeout
- On timeout: display received content, offer retry

### 8.3 Graceful Degradation

- If streaming fails, fall back to non-streaming request
- If API is unreachable, check Tier 1 (vocabulary) and Tier 2 (ephemeral cache) for cached results before showing error

## 9. Performance

### 9.1 Optimizations

- **Debounce**: 200ms delay after text selection before showing button
- **Throttle**: UI updates batched every 50ms during streaming
- **Cache**: Two-tier caching strategy (see 9.4 below)
- **Lazy loading**: Popup loads vocabulary list on demand
- **AbortController**: Cancel in-flight requests when card is closed

### 9.2 Storage Limits

- `chrome.storage.local`: 10MB limit
- Estimated ~1KB per word entry
- Supports ~10,000 words before hitting limits

### 9.3 Popup Performance

- Vocabulary list uses virtual scrolling for large lists (1000+ words)
- Search/filter operates on in-memory data for instant results
- Word items render lazily as user scrolls

### 9.4 Caching Strategy

Two-tier cache to reduce API calls and improve response speed:

**Tier 1: Vocabulary hit (persistent, free)**

Before calling the LLM, check if the word already exists in the vocabulary (`normalizedWord` match against `chrome.storage.local`). If found, display the stored definition directly — no API call needed. This is the most common cache hit scenario for repeated encounters.

- Lookup: O(1) via normalized word index
- No expiry (persists as long as the word is in vocabulary)
- UI shows the stored card instantly, with a "Re-lookup" button if the user wants a fresh result

**Tier 2: Best-effort ephemeral cache (in-memory)**

A lightweight in-memory cache for sentence translations and recent lookups that haven't been saved to vocabulary. Stored in a `Map` in the background service worker.

**Important:** MV3 service workers are frequently terminated by the browser when idle. This cache is best-effort — it may be cleared at any time without notice. Do not rely on it for correctness. It exists purely to avoid redundant API calls when the worker happens to still be alive (e.g., rapid consecutive lookups).

- Key: composite key combining `{type}:{normalizedWord|sentenceHash}:{sourceLanguage}:{targetLanguage}:{model}` (e.g., `word:ephemeral:en:zh:gpt-3.5-turbo`)
- Value: full LLM response text
- Max entries: 100 (LRU eviction)
- Lifetime: cleared when service worker terminates (may happen at any time)
- Sentence translations always go through this tier since they are never saved to vocabulary

**Undo and cache behavior:** When a user clicks Undo on a word, the pending save is cancelled AND the Tier 2 cache entry for that word is evicted. This ensures the next lookup for the same word triggers a fresh API call. Rationale: Undo signals "I don't want this result" — serving the same cached result next time would contradict that intent.

**Cache flow:**

```
User looks up "ephemeral"
    ↓
Check vocabulary (Tier 1)
├─ Found → display stored definition instantly (0ms)
│          update sources[], lastSeenAt, lookupCount
│          show "Seen again! ✨"
└─ Not found → Check ephemeral cache (Tier 2)
    ├─ Found → display cached result instantly (0ms)
    │          proceed with normal pending save flow
    └─ Not found → call LLM API (streaming)
                   store result in ephemeral cache
                   proceed with normal pending save flow
```

**Cache invalidation:**
- Tier 1: invalidated when user clicks "Re-lookup" on a word card
- Tier 2: LRU eviction at 100 entries, service worker termination, user Undo, or language/model settings change (flush entire cache)

## 10. Testing Strategy

### 10.1 Unit Tests

- Word/sentence detection logic
- Storage read/write operations
- Anki format generation
- i18n message resolution

### 10.2 Integration Tests

- Content script ↔ background communication
- API client with mocked responses
- Streaming response parsing

### 10.3 Manual Test Scenarios

- Test on various sites (Medium, GitHub, Wikipedia, arXiv)
- Test with different text lengths and special characters
- Test Anki import with generated export files
- Test with different API providers (OpenAI, compatible services)
- Test on pages with non-standard DOM/selection behavior:
  - PDF viewers (browser built-in, pdf.js)
  - Google Docs (custom selection model, may not work — document as known limitation)
  - Notion (contenteditable blocks)
  - Medium (custom text rendering)
  - Code blocks and `<pre>` elements
  - Pages with heavy iframe usage
