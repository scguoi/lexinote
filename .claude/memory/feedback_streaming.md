---
name: Streaming response requirement
description: User wants to support OpenAI SSE streaming interface for real-time response display
type: feedback
---

User wants the extension to support OpenAI's Server-Sent Events (SSE) streaming interface for displaying responses in real-time as they are generated, rather than waiting for the complete response.

**Why:** Better user experience - users can see the definition/translation appearing progressively rather than waiting for the entire response. This is especially important for longer responses from the smart model.

**How to apply:**
- Implement SSE streaming support in background service worker
- Parse OpenAI streaming response format (data: {delta} chunks)
- Send progressive updates to content script via chrome.runtime.sendMessage
- Update the definition card UI in real-time as chunks arrive
- Show typing indicator/animation while streaming
- Handle stream errors and completion gracefully
