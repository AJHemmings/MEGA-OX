// src/components/skins/MarkerSkin.tsx
import React, { useRef, useEffect } from 'react';
import Lottie, { LottieRefCurrentProps } from 'lottie-react';
import { useSkins } from '../../contexts/SkinContext';
import { SkinEvent } from '../../skins/types';

interface MarkerSkinProps {
  player: 1 | 2;
  value: string;             // '' | 'X' | 'O' — from cell data
  currentEvent?: SkinEvent;
}

const PLACEHOLDER_STYLE: React.CSSProperties = {
  fontSize: '24px',
  fontWeight: 'bold',
  lineHeight: 1,
  userSelect: 'none',
};

const MarkerSkin: React.FC<MarkerSkinProps> = ({ player, value, currentEvent }) => {
  const skins = useSkins();
  const skin = player === 1 ? skins.p1MarkerSkin : skins.p2MarkerSkin;
  const lottieRef = useRef<LottieRefCurrentProps>(null);

  // Trigger animation segment when event changes
  useEffect(() => {
    if (!lottieRef.current || skin.assetUrl === 'placeholder') return;
    // Phase 5: map SkinEvent → Lottie segment frames here
  }, [currentEvent, skin.assetUrl]);

  if (!value) return null;

  if (skin.assetUrl === 'placeholder') {
    return (
      <span style={{
        ...PLACEHOLDER_STYLE,
        color: player === 1 ? '#3399ff' : '#ff6b6b',
      }}>
        {value}
      </span>
    );
  }

  // Real Lottie skin (Phase 5+)
  return (
    <Lottie
      lottieRef={lottieRef}
      animationData={skin.assetUrl as any}
      loop
      style={{ width: '100%', height: '100%' }}
    />
  );
};

export default MarkerSkin;
