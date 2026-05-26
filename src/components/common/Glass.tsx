import React from 'react';
import { tokens } from '../../styles/tokens';

interface GlassProps {
  children: React.ReactNode;
  padding?: number | string;
  style?: React.CSSProperties;
  as?: React.ElementType;
  id?: string;
  className?: string;
}

const Glass: React.FC<GlassProps> = ({ children, padding = 20, style, as: Tag = 'div', id, className }) => (
  <Tag id={id} className={className} style={{
    background: tokens.glassBg,
    border: tokens.glassBorder,
    borderRadius: tokens.glassRadius,
    backdropFilter: tokens.glassBlur,
    WebkitBackdropFilter: tokens.glassBlur,
    padding,
    ...style,
  }}>
    {children}
  </Tag>
);

export default Glass;
