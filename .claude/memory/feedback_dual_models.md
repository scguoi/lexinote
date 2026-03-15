---
name: Dual model configuration requirement
description: User wants to configure two models - fast model for daily lookups, smart model for Anki export formatting
type: feedback
---

User wants to configure two different LLM models:
1. **Fast model**: Used for daily word/sentence lookups (frequent, needs to be quick)
2. **Smart model**: Used for generating Anki export format (less frequent, needs higher quality)

**Why:** Balance between speed and quality. Daily lookups need to be instant for good UX, while Anki export can take longer but needs better formatting/accuracy.

**How to apply:**
- Add two model configuration fields in settings: fastModel and smartModel
- Each model config includes: model name (e.g., "gpt-3.5-turbo" vs "gpt-4")
- Use fast model for real-time content script lookups
- Use smart model when exporting to Anki format
- Consider allowing same model for both if user prefers
