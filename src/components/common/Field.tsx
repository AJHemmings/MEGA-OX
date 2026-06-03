import React, { useState } from 'react';
import { tokens } from '../../styles/tokens';

interface FieldProps {
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  hasError?: boolean;
  right?: React.ReactNode;
}

const Field: React.FC<FieldProps> = ({ label, type, value, onChange, hasError, right }) => {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: tokens.textMuted, letterSpacing: 0.8, textTransform: 'uppercase' as const, marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ position: 'relative' }}>
        <input
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          required
          style={{
            width: '100%', boxSizing: 'border-box' as const,
            background: focused ? 'rgba(0,212,170,0.06)' : hasError ? 'rgba(255,107,107,0.06)' : 'rgba(255,255,255,0.06)',
            border: focused ? `1px solid ${tokens.accent}` : hasError ? '1px solid #ff6b6b' : '1px solid rgba(255,255,255,0.12)',
            borderRadius: tokens.rInput,
            padding: right ? '12px 44px 12px 14px' : '12px 14px',
            color: '#fff', fontFamily: tokens.font, fontWeight: 600, fontSize: 14,
            outline: 'none',
            boxShadow: focused ? '0 0 0 3px rgba(0,212,170,0.15)' : hasError ? '0 0 0 3px rgba(255,107,107,0.15)' : 'none',
            transition: 'border 0.15s, box-shadow 0.15s, background 0.15s',
          }}
        />
        {right && (
          <div style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)' }}>
            {right}
          </div>
        )}
      </div>
    </div>
  );
};

export default Field;
