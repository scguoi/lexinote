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

  const handleTestConnection = async (which: 'fast' | 'smart') => {
    const config = settings[which];
    const urlError = validateUrl(config.apiBaseUrl);
    if (urlError) {
      setConnectionStatus('error');
      setConnectionMessage(`${which}: ${urlError}`);
      return;
    }

    setConnectionStatus('testing');
    setConnectionMessage('');

    try {
      const response = await fetch(`${config.apiBaseUrl}/models`, {
        headers: { 'Authorization': `Bearer ${config.apiKey}` },
        signal: AbortSignal.timeout(5000),
      });

      if (response.ok) {
        setConnectionStatus('success');
        setConnectionMessage(`${which}: ${t('connectionSuccess')}`);
      } else if (response.status === 401 || response.status === 403) {
        setConnectionStatus('error');
        setConnectionMessage(`${which}: ${t('invalidApiKey')}`);
      } else if (response.status === 404) {
        setConnectionStatus('error');
        setConnectionMessage(`${which}: ${t('endpointNotFound')}`);
      } else if (response.status === 429) {
        setConnectionStatus('error');
        setConnectionMessage(`${which}: ${t('rateLimited')}`);
      } else {
        setConnectionStatus('error');
        setConnectionMessage(`${which}: HTTP ${response.status}`);
      }
    } catch {
      setConnectionStatus('error');
      setConnectionMessage(`${which}: ${t('networkError')}`);
    }
  };

  const handleSave = async () => {
    // Validate both URLs
    for (const which of ['fast', 'smart'] as const) {
      const config = settings[which];
      if (config.apiBaseUrl) {
        const urlError = validateUrl(config.apiBaseUrl);
        if (urlError) {
          setSaveMessage(`${which}: ${urlError}`);
          return;
        }
        const hasPermission = await requestPermissionIfNeeded(config.apiBaseUrl);
        if (!hasPermission) {
          setSaveMessage(`${which}: ${t('permissionRequired')}`);
          return;
        }
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

  const updateModelField = useCallback((which: 'fast' | 'smart', key: string, value: string) => {
    setSettings(prev => ({
      ...prev,
      [which]: { ...prev[which], [key]: value },
    }));
    setIsDirty(true);
    setSaveMessage('');
  }, []);

  const renderModelConfig = (which: 'fast' | 'smart', emoji: string, label: string, description: string) => {
    const config = settings[which];
    return (
      <div style={sectionStyle}>
        <h2 style={{ fontSize: '16px', margin: '0 0 4px', color: '#2D3748' }}>{emoji} {label}</h2>
        <p style={{ fontSize: '12px', color: '#A0AEC0', margin: '0 0 12px' }}>{description}</p>
        <div style={fieldStyle}>
          <label style={labelStyle}>Base URL</label>
          <input
            type="text"
            value={config.apiBaseUrl}
            onChange={(e) => updateModelField(which, 'apiBaseUrl', e.target.value)}
            placeholder="https://api.openai.com/v1"
            style={inputStyle}
          />
        </div>
        <div style={fieldStyle}>
          <label style={labelStyle}>API Key</label>
          <input
            type="password"
            value={config.apiKey}
            onChange={(e) => updateModelField(which, 'apiKey', e.target.value)}
            placeholder="sk-..."
            style={inputStyle}
          />
        </div>
        <div style={fieldStyle}>
          <label style={labelStyle}>Model</label>
          <input
            type="text"
            value={config.model}
            onChange={(e) => updateModelField(which, 'model', e.target.value)}
            placeholder={which === 'fast' ? 'gpt-3.5-turbo' : 'gpt-4'}
            style={inputStyle}
          />
        </div>
        <button
          onClick={() => handleTestConnection(which)}
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
    );
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

      {/* Fast Model */}
      {renderModelConfig('fast', '⚡', t('fastModel'), 'Used for quick word lookups and sentence translation')}

      {/* Smart Model */}
      {renderModelConfig('smart', '🧠', t('smartModel'), 'Used for high-quality Anki export')}

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
