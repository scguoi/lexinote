---
name: Sentence translation feature
description: User wants to support sentence translation and explanation without adding to vocabulary list
type: feedback
---

In addition to word lookup, the user wants to support selecting entire sentences for translation and explanation. Key difference: sentence translations should NOT be added to the vocabulary list (only individual words should be saved).

**Why:** Different use cases - words are for vocabulary building, sentences are for comprehension assistance.

**How to apply:** Detect selection length/type to differentiate between word lookup (short, single word) and sentence translation (longer, multiple words). Use different UI treatment and different save behavior.
