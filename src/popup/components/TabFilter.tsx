import React from 'react';
import { t } from '../../shared/i18n';

interface TabFilterProps {
  active: 'all' | 'starred';
  onChange: (tab: 'all' | 'starred') => void;
}

export const TabFilter: React.FC<TabFilterProps> = ({ active, onChange }) => {
  const tabs = [
    { key: 'all' as const, label: `💫 ${t('all')}` },
    { key: 'starred' as const, label: `⭐ ${t('starred')}` },
  ];

  return (
    <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
      {tabs.map(tab => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          style={{
            padding: '6px 12px',
            borderRadius: '16px',
            border: 'none',
            fontSize: '13px',
            cursor: 'pointer',
            background: active === tab.key ? '#6B7FFF' : '#F8F9FA',
            color: active === tab.key ? 'white' : '#2D3748',
            transition: 'all 0.2s',
          }}
        >{tab.label}</button>
      ))}
    </div>
  );
};
