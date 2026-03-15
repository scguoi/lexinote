import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import '../shared/styles/global.css';

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
