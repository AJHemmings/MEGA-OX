import React, { useState } from 'react';
import { tokens } from '../../styles/tokens';

type BtnSize = 'sm' | 'md' | 'lg';

interface PrimaryButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  size?: BtnSize;
  fullWidth?: boolean;
}

const padding: Record<BtnSize, string> = { lg: '16px 22px', md: '14px 20px', sm: '10px 16px' };
const fontSize: Record<BtnSize, number> = { lg: 17, md: 15, sm: 13 };

const PrimaryButton: React.FC<PrimaryButtonProps> = ({
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
        background: `linear-gradient(135deg, ${tokens.accent}, ${tokens.accentDark})`,
        border: 'none',
        borderRadius: tokens.rBtn,
        padding: padding[size],
        fontFamily: 'inherit',
        fontWeight: 800,
        fontSize: fontSize[size],
        color: '#051018',
        cursor: disabled ? 'not-allowed' : 'pointer',
        boxShadow: hovered ? tokens.ctaShadowHover : tokens.ctaShadow,
        letterSpacing: 0.2,
        transform: hovered ? 'translateY(-1px)' : 'none',
        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
        opacity: disabled ? 0.5 : 1,
        width: fullWidth ? '100%' : undefined,
        ...style,
      }}
    >
      {children}
    </button>
  );
};

export default PrimaryButton;
