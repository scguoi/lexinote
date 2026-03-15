---
name: API security concern
description: User is concerned about securing the LLM API key when stored in browser extension
type: feedback
---

User wants to use browser local storage but is concerned about the security of storing the LLM API key in the browser extension environment.

**Why:** API keys are sensitive credentials that could be exposed if not properly secured, leading to unauthorized usage and potential costs.

**How to apply:** Need to design a secure API key storage and usage pattern for the browser extension. Consider options like:
1. Store encrypted API key in chrome.storage.local (extension storage is isolated from web pages)
2. Make API calls from background script (not content script) to prevent web page access
3. Implement rate limiting to prevent abuse
4. Provide clear UI warnings about API key security
