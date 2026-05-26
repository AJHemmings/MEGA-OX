import React, { useState } from 'react';
import { tokens } from '../../styles/tokens';

type BtnSize = 'sm' | 'md' | 'lg';

interface SecondaryButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  size?: BtnSize;
  fullWidth?: boolean;
}

const padding: Record<BtnSize, string> = { lg: '14px 20px', md: '12px 18px', sm: '8px 14px' };
const fontSize: Record<BtnSize, number> = { lg: 15, md: 14, sm: 12 };

const SecondaryButton: React.FC<SecondaryButtonProps> = ({
  children, size = 'md', fullWidth, style, disabled, ...rest
}) => {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      {...rest}
      disabled={disabled}
      onMouseEnter={(e) => { setHovered(true); rest.onMouseEnter?.(e); }}
      onMouseLeave={(e) => { setHovered(false); rest.onMouseLeave?.(e); }}
      style={{
        background: 'transparent',
        border: hovered ? '1px solid rgba(255,255,255,0.30)' : '1px solid rgba(255,255,255,0.15)',
        borderRadius: tokens.rBtn,
        padding: padding[size],
        fontFamily: 'inherit',
        fontWeight: 700,
        fontSize: fontSize[size],
        color: hovered ? tokens.text : tokens.textMuted,
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'border-color 0.15s ease, color 0.15s ease',
        opacity: disabled ? 0.5 : 1,
        width: fullWidth ? '100%' : undefined,
        ...style,
      }}
    >
      {children}
    </button>
  );
};

export default SecondaryButton;
