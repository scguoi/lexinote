---
name: Language configuration requirement
description: User wants to support configurable source and target languages
type: feedback
---

User wants the ability to configure both source language and target language, rather than hardcoding English → Chinese.

**Why:** Makes the extension more flexible and useful for different language learning scenarios (e.g., learning English from other languages, or learning other languages from English/Chinese).

**How to apply:**
- Add source language and target language settings to the options page
- Update LLM prompts to use configured languages dynamically
- Default: source = English, target = Chinese (user's current use case)
- Consider language detection for source language (auto-detect vs manual setting)
