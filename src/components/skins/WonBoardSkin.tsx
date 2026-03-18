// src/components/skins/WonBoardSkin.tsx
import React, { useRef, useEffect } from 'react';
import Lottie, { LottieRefCurrentProps } from 'lottie-react';
import { useSkins } from '../../contexts/SkinContext';
import { SkinEvent } from '../../skins/types';

interface WonBoardSkinProps {
  player: 1 | 2;
  currentEvent?: SkinEvent;
}

const WonBoardSkin: React.FC<WonBoardSkinProps> = ({ player, currentEvent }) => {
  const skins = useSkins();
  const skin = player === 1 ? skins.p1WonBoardSkin : skins.p2WonBoardSkin;
  const lottieRef = useRef<LottieRefCurrentProps>(null);

  useEffect(() => {
    if (!lottieRef.current || skin.assetUrl === 'placeholder') return;
    // Phase 5: map SkinEvent → Lottie segment frames here
  }, [currentEvent, skin.assetUrl]);

  if (skin.assetUrl === 'placeholder') {
    return (
      <div style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: player === 1 ? '#a0d8f080' : '#f0a0a080',
        borderRadius: '4px',
        pointerEvents: 'none',
        zIndex: 2,
      }}>
        <span style={{
          fontSize: '48px',
          fontWeight: 'bold',
          color: player === 1 ? '#3399ff' : '#ff6b6b',
          opacity: 0.7,
        }}>
          {player === 1 ? 'X' : 'O'}
        </span>
      </div>
    );
  }

  return (
    <Lottie
      lottieRef={lottieRef}
      path={skin.assetUrl}
      loop
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 2 }}
    />
  );
};

export default WonBoardSkin;
