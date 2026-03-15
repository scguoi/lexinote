# LexiNote

[English](#english) | [中文](#中文)

![usage](public/usage/usage.gif)

---

## 中文

一款轻量级 Chrome 扩展，在英文阅读中随手查词、自动收录生词本，一键导出到 Anki 进行间隔复习。

### 功能

- 双击单词即可查询释义，支持音标、词性、例句、词源
- 选中句子自动翻译
- AI 驱动，兼容 OpenAI 格式 API（DeepSeek、Groq 等）
- 弹出窗口管理生词本，支持搜索、收藏、删除
- 一键导出 Anki TSV，导出后自动清理已导出单词
- 支持中/英/日/韩/西/法/德等目标语言
- 支持中英文界面切换

### 安装

```bash
npm install
npm run build
```

1. 打开 `chrome://extensions/`
2. 开启「开发者模式」
3. 点击「加载已解压的扩展程序」，选择 `dist/` 目录

### 配置

1. 点击工具栏 LexiNote 图标 → 设置
2. 填入 API Base URL 和 API Key
3. 选择模型（如 `gpt-4o-mini`、`deepseek-chat`）
4. 选择目标语言

---

## English

A lightweight Chrome extension for vocabulary capture during English reading. Look up words with AI-powered definitions and export to Anki for spaced repetition.

### Features

- Double-click any word for instant lookup with phonetics, examples, and etymology
- Select sentences for translation
- AI-powered via OpenAI-compatible APIs (DeepSeek, Groq, etc.)
- Popup word book with search, star, and delete
- One-click Anki TSV export, auto-cleans exported words
- Supports Chinese, English, Japanese, Korean, Spanish, French, German as target languages
- Bilingual UI (Chinese / English)

### Install

```bash
npm install
npm run build
```

1. Open `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked" and select the `dist/` directory

### Configure

1. Click the LexiNote icon → Settings
2. Enter your API Base URL and API Key
3. Choose a model (e.g. `gpt-4o-mini`, `deepseek-chat`)
4. Select your target language

---

### Tech Stack

- React 18 + TypeScript
- Vite + Chrome Extension Manifest V3
- OpenAI-compatible API (SSE streaming)

### License

Apache License 2.0
