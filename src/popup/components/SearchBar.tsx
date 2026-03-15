import React from 'react';
import { t } from '../../shared/i18n';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({ value, onChange }) => (
  <div style={{ position: 'relative', marginBottom: '12px' }}>
    <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '14px' }}>🔍</span>
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={t('searchPlaceholder')}
      style={{
        width: '100%',
        padding: '8px 8px 8px 32px',
        border: '1px solid #E2E8F0',
        borderRadius: '8px',
        fontSize: '14px',
        outline: 'none',
        boxSizing: 'border-box',
        transition: 'border-color 0.2s',
      }}
      onFocus={(e) => { e.target.style.borderColor = '#6B7FFF'; }}
      onBlur={(e) => { e.target.style.borderColor = '#E2E8F0'; }}
    />
  </div>
);
