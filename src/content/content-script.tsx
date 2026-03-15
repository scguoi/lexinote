import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';

function init() {
  // Create Shadow DOM container for style isolation
  const host = document.createElement('div');
  host.id = 'lexinote-root';
  document.body.appendChild(host);

  const shadow = host.attachShadow({ mode: 'open' });

  // Inject styles into Shadow DOM
  const style = document.createElement('style');
  style.textContent = `
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-4px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes blink {
      50% { opacity: 0; }
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
  `;
  shadow.appendChild(style);

  // Mount React app
  const container = document.createElement('div');
  shadow.appendChild(container);

  const root = createRoot(container);
  root.render(<App />);
}

// Wait for DOM to be ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
