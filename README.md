# LexiNote

A lightweight Chrome extension for vocabulary capture during English reading. Look up words with AI-powered definitions and export to Anki for spaced repetition review.

## Features

- Double-click any word to look up its definition
- AI-powered definitions with phonetics, examples, and etymology
- Sentence translation support
- Vocabulary list with search and filtering
- Export to Anki-compatible format
- Configurable source and target languages
- Dual model support (fast for lookups, smart for export)
- SSE streaming for real-time response display

## Setup

### Prerequisites

- Node.js 18+
- Chrome browser

### Install

```bash
npm install
```

### Build

```bash
npm run build
```

### Load Extension

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked" and select the `dist/` directory

### Configure

1. Click the LexiNote icon in the toolbar
2. Click the settings icon
3. Enter your API Base URL and API Key (OpenAI-compatible)
4. Configure your preferred models

## Development

```bash
npm run dev        # Watch mode
npm test           # Run tests
npm run test:watch # Watch tests
```

## Tech Stack

- React 18 + TypeScript
- Vite (build tool)
- Chrome Extension Manifest V3
- OpenAI-compatible API (SSE streaming)
- Vitest (testing)

## License

MIT
