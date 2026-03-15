---
name: UI interaction preference
description: User prefers double-click word selection with floating button for lookup, auto-add to vocabulary list
type: feedback
---

User wants the word lookup interaction to work as follows: double-click to select a word, then a floating button appears above the selected word. Clicking the button shows the definition and automatically adds the word to the vocabulary list.

**Why:** This matches the natural browser behavior (double-click selects word) and provides a clear, intentional action point.

**How to apply:** Design the content script to listen for text selection events, show a floating action button on selection, and trigger lookup + auto-save on button click.
