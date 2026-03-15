---
name: UI language preference
description: User wants UI language to match browser default language with option to override
type: feedback
---

User wants the extension's UI language (interface text, labels, buttons) to automatically match the browser's default language, with the ability for users to manually override this setting.

**Why:** Better user experience - the interface should feel native to the user's language preference. Auto-detection reduces friction, manual override provides flexibility.

**How to apply:**
- Detect browser language using `navigator.language` or `chrome.i18n.getUILanguage()`
- Implement i18n (internationalization) for all UI text
- Add UI language setting in options page (separate from source/target language for vocabulary)
- Support at minimum: English, Chinese (Simplified), Chinese (Traditional)
- Use chrome.i18n API or a lightweight i18n library
