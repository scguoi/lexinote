---
name: Word vs sentence detection method
description: User prefers automatic detection based on content (spaces/punctuation indicate sentence)
type: feedback
---

User wants the system to automatically distinguish between word lookup and sentence translation based on the selected content. If the selection contains spaces or punctuation, treat it as a sentence; otherwise, treat it as a single word.

**Why:** Simplifies the interaction - users don't need to think about different trigger methods or make explicit choices.

**How to apply:** Implement selection analysis logic: check if selected text contains whitespace or punctuation marks. Single word (no spaces/punctuation) → word lookup + save to vocabulary. Multiple words or punctuation → sentence translation + no save.
