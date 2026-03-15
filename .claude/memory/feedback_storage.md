---
name: Data storage preference
description: User prefers browser local storage for vocabulary data
type: feedback
---

User wants to store vocabulary data in browser local storage (localStorage/IndexedDB) rather than cloud sync.

**Why:** Simpler implementation, no account system needed, keeps data local.

**How to apply:** Use browser extension storage APIs (chrome.storage.local or IndexedDB) for persisting vocabulary entries.
