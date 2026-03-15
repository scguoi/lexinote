import React, { useState, useEffect, useCallback } from 'react';
import { storage } from '../shared/storage';
import { t, setLocale } from '../shared/i18n';
import type { Settings } from '../shared/types';
import { DEFAULT_SETTINGS } from '../shared/constants';

const SOURCE_LANGUAGES = [
  { code: 'en', name: 'English' },
];

const TARGET_LANGUAGES = [
  { code: 'zh', name: '中文' },
  { code: 'ja', name: '日本語' },
  { code: 'ko', name: '한국어' },
  { code: 'es', name: 'Español' },
  { code: 'fr', name: 'Français' },
  { code: 'de', name: 'Deutsch' },
  { code: 'en', name: 'English' },
];

const UI_LANGUAGES = [
  { code: 'auto', name: 'Auto (Browser Default)' },
  { code: 'en', name: 'English' },
  { code: 'zh_CN', name: '简体中文' },
  { code: 'zh_TW', name: '繁體中文' },
];

const BUILT_IN_DOMAINS = [
  'api.openai.com',
  'api.deepseek.com',
  'api.groq.com',
  'api.together.xyz',
];

type ConnectionStatus = 'idle' | 'testing' | 'success' | 'error';

export const App: React.FC = () => {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS as Settings);
  const [savedSettings, setSavedSettings] = useState<Settings>(DEFAULT_SETTINGS as Settings);
  const [isDirty, setIsDirty] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('idle');
  const [connectionMessage, setConnectionMessage] = useState('');
  const [saveMessage, setSaveMessage] = useState('');
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    loadSettings();
  }, []);

  // Unsaved changes warning
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = t('unsavedChanges');
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  const loadSettings = async () => {
    await storage.initialize();
    const s = await storage.getSettings();
    setSettings(s);
    setSavedSettings(s);
    setLocale(s.uiLanguage);
    forceUpdate(n => n + 1);
  };

  const updateField = useCallback(<K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setIsDirty(true);
    setSaveMessage('');
    if (key === 'uiLanguage') {
      setLocale(value as string);
      forceUpdate(n => n + 1);
    }
  }, []);

  const validateUrl = (url: string): string | null => {
    if (!url) return t('invalidUrl');
    try {
      const parsed = new URL(url);
      if (parsed.protocol !== 'https:') return t('httpsOnly');
      if (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1') return t('httpsOnly');
      return null;
    } catch {
      return t('invalidUrl');
    }
  };

  const requestPermissionIfNeeded = async (url: string): Promise<boolean> => {
    try {
      const parsed = new URL(url);
      const domain = parsed.hostname;

      if (BUILT_IN_DOMAINS.includes(domain)) return true;

      const origin = `${parsed.protocol}//${parsed.hostname}/*`;
      const granted = await chrome.permissions.request({ origins: [origin] });
      return granted;
    } catch {
      return false;
    }
  };

  const handleTestConnection = async () => {
    const urlError = validateUrl(settings.apiBaseUrl);
    if (urlError) {
      setConnectionStatus('error');
      setConnectionMessage(urlError);
      return;
    }

    setConnectionStatus('testing');
    setConnectionMessage('');

    try {
      const response = await fetch(`${settings.apiBaseUrl}/models`, {
        headers: { 'Authorization': `Bearer ${settings.apiKey}` },
        signal: AbortSignal.timeout(5000),
      });

      if (response.ok) {
        setConnectionStatus('success');
        setConnectionMessage(t('connectionSuccess'));
      } else if (response.status === 401 || response.status === 403) {
        setConnectionStatus('error');
        setConnectionMessage(t('invalidApiKey'));
      } else if (response.status === 404) {
        setConnectionStatus('error');
        setConnectionMessage(t('endpointNotFound'));
      } else if (response.status === 429) {
        setConnectionStatus('error');
        setConnectionMessage(t('rateLimited'));
      } else {
        setConnectionStatus('error');
        setConnectionMessage(`HTTP ${response.status}`);
      }
    } catch {
      setConnectionStatus('error');
      setConnectionMessage(t('networkError'));
    }
  };

  const handleSave = async () => {
    if (settings.apiBaseUrl) {
      const urlError = validateUrl(settings.apiBaseUrl);
      if (urlError) {
        setSaveMessage(urlError);
        return;
      }
      const hasPermission = await requestPermissionIfNeeded(settings.apiBaseUrl);
      if (!hasPermission) {
        setSaveMessage(t('permissionRequired'));
        return;
      }
    }

    await storage.updateSettings(settings);
    setSavedSettings(settings);
    setIsDirty(false);
    setSaveMessage('✅ Saved!');
    setTimeout(() => setSaveMessage(''), 3000);
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '8px 12px',
    border: '1px solid #E2E8F0',
    borderRadius: '8px',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s',
  };

  const selectStyle: React.CSSProperties = {
    ...inputStyle,
    appearance: 'auto',
  };

  const sectionStyle: React.CSSProperties = {
    background: 'white',
    borderRadius: '12px',
    padding: '20px',
    marginBottom: '16px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '13px',
    color: '#4A5568',
    marginBottom: '4px',
    fontWeight: 500,
  };

  const fieldStyle: React.CSSProperties = {
    marginBottom: '12px',
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '24px' }}>
      <h1 style={{ fontSize: '22px', color: '#2D3748', marginBottom: '20px' }}>⚙️ {t('settings')}</h1>

      {/* Interface Language */}
      <div style={sectionStyle}>
        <h2 style={{ fontSize: '16px', margin: '0 0 12px', color: '#2D3748' }}>🌐 {t('interfaceLanguage')}</h2>
        <select value={settings.uiLanguage} onChange={(e) => updateField('uiLanguage', e.target.value)} style={selectStyle}>
          {UI_LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.name}</option>)}
        </select>
      </div>

      {/* Learning Languages */}
      <div style={sectionStyle}>
        <h2 style={{ fontSize: '16px', margin: '0 0 12px', color: '#2D3748' }}>📚 {t('learningLanguages')}</h2>
        <div style={fieldStyle}>
          <label style={labelStyle}>{t('sourceLanguage')}</label>
          <select value={settings.sourceLanguage} style={{ ...selectStyle, opacity: 0.6 }} disabled>
            {SOURCE_LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.name}</option>)}
          </select>
          <p style={{ fontSize: '12px', color: '#A0AEC0', margin: '4px 0 0' }}>V1: English only</p>
        </div>
        <div style={fieldStyle}>
          <label style={labelStyle}>{t('targetLanguage')}</label>
          <select value={settings.targetLanguage} onChange={(e) => updateField('targetLanguage', e.target.value)} style={selectStyle}>
            {TARGET_LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.name}</option>)}
          </select>
        </div>
      </div>

      {/* API Configuration */}
      <div style={sectionStyle}>
        <h2 style={{ fontSize: '16px', margin: '0 0 12px', color: '#2D3748' }}>🔌 {t('apiConfiguration')}</h2>
        <div style={fieldStyle}>
          <label style={labelStyle}>Base URL</label>
          <input
            type="text"
            value={settings.apiBaseUrl}
            onChange={(e) => updateField('apiBaseUrl', e.target.value)}
            placeholder="https://api.openai.com/v1"
            style={inputStyle}
          />
        </div>
        <div style={fieldStyle}>
          <label style={labelStyle}>API Key</label>
          <input
            type="password"
            value={settings.apiKey}
            onChange={(e) => updateField('apiKey', e.target.value)}
            placeholder="sk-..."
            style={inputStyle}
          />
        </div>
        <div style={fieldStyle}>
          <label style={labelStyle}>Model</label>
          <input
            type="text"
            value={settings.model}
            onChange={(e) => updateField('model', e.target.value)}
            placeholder="gpt-4o-mini"
            style={inputStyle}
          />
        </div>
        <button
          onClick={handleTestConnection}
          disabled={connectionStatus === 'testing'}
          style={{
            padding: '6px 14px',
            border: '1px solid #E2E8F0',
            borderRadius: '8px',
            background: 'white',
            cursor: 'pointer',
            fontSize: '13px',
          }}
        >
          {connectionStatus === 'testing' ? '...' : t('testConnection')}
        </button>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
        <button
          onClick={handleSave}
          style={{
            padding: '10px 20px',
            border: 'none',
            borderRadius: '8px',
            background: '#6B7FFF',
            color: 'white',
            cursor: 'pointer',
            fontSize: '14px',
          }}
        >
          {t('save')}
        </button>
        {connectionMessage && (
          <span style={{ fontSize: '13px', color: connectionStatus === 'success' ? '#4ECDC4' : '#FF6B6B' }}>
            {connectionMessage}
          </span>
        )}
        {saveMessage && (
          <span style={{ fontSize: '13px', color: saveMessage.startsWith('✅') ? '#4ECDC4' : '#FF6B6B' }}>
            {saveMessage}
          </span>
        )}
      </div>
    </div>
  );
};
