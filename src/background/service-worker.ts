import { streamHandler } from './stream-handler';
import { ephemeralCache } from './cache';
import { storage } from '../shared/storage';
import type { RequestMessage } from '../shared/types';

// Initialize storage on install
chrome.runtime.onInstalled.addListener(async () => {
  await storage.initialize();
  console.log('LexiNote: Storage initialized');
});

// Handle long-lived port connections for streaming
chrome.runtime.onConnect.addListener((port) => {
  if (port.name !== 'lookup') return;

  port.onMessage.addListener((message: RequestMessage) => {
    if (message.type === 'LOOKUP_REQUEST') {
      streamHandler.handleLookupRequest(message, port);
    } else if (message.type === 'CANCEL') {
      streamHandler.handleCancel(message.requestId, port);
    }
  });

  port.onDisconnect.addListener(() => {
    console.log('LexiNote: Lookup port disconnected');
  });
});

// Update badge to reflect capture mode state
async function updateCaptureBadge(enabled: boolean) {
  await chrome.action.setBadgeText({ text: enabled ? 'ON' : '' });
  if (enabled) {
    await chrome.action.setBadgeBackgroundColor({ color: '#6B7FFF' });
  }
}

// Restore badge on startup
chrome.storage.local.get('captureMode', (result) => {
  updateCaptureBadge(!!result.captureMode);
});

// Handle one-shot messages (save word)
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'TOGGLE_CAPTURE') {
    chrome.storage.local.get('captureMode', (result) => {
      const next = !result.captureMode;
      chrome.storage.local.set({ captureMode: next }, () => {
        updateCaptureBadge(next);
        sendResponse({ captureMode: next });
      });
    });
    return true;
  }

  if (message.type === 'GET_CAPTURE_MODE') {
    chrome.storage.local.get('captureMode', (result) => {
      sendResponse({ captureMode: !!result.captureMode });
    });
    return true;
  }

  if (message.type === 'SAVE_WORD') {
    storage.addWord(message.entry).then(() => {
      sendResponse({ type: 'SAVE_RESULT', success: true, isDuplicate: false });
    }).catch((error) => {
      console.error('Failed to save word:', error);
      sendResponse({ type: 'SAVE_RESULT', success: false, isDuplicate: false });
    });
    return true;
  }

  if (message.type === 'DELETE_WORD') {
    storage.deleteWord(message.id).then(() => {
      sendResponse({ success: true });
    }).catch((error) => {
      console.error('Failed to delete word:', error);
      sendResponse({ success: false });
    });
    return true;
  }
});

// Clear ephemeral cache when settings change
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'local' && changes.settings) {
    const oldSettings = changes.settings.oldValue;
    const newSettings = changes.settings.newValue;
    if (
      oldSettings?.sourceLanguage !== newSettings?.sourceLanguage ||
      oldSettings?.targetLanguage !== newSettings?.targetLanguage ||
      oldSettings?.model !== newSettings?.model ||
      oldSettings?.apiBaseUrl !== newSettings?.apiBaseUrl
    ) {
      ephemeralCache.clear();
      console.log('Ephemeral cache cleared due to settings change');
    }
  }
});
