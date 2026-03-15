---
name: API configuration approach
description: User chooses to let users configure their own API base URL and API key
type: feedback
---

User has chosen approach A: users configure their own API base URL and API key in the extension settings.

**Why:** Gives users full control over their API credentials, no backend server needed, suitable for personal use and open source distribution.

**How to apply:**
- Store API base URL and API key in chrome.storage.local (encrypted, isolated from web pages)
- Provide a settings/options page for users to input their credentials
- Make all LLM API calls from background service worker (not content script)
- Content script communicates with background via chrome.runtime.sendMessage
- Implement proper error handling for invalid credentials
