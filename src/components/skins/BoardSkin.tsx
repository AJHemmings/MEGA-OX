// src/components/skins/BoardSkin.tsx
import React, { useRef, useEffect } from 'react';
import Lottie, { LottieRefCurrentProps } from 'lottie-react';
import { useSkins } from '../../contexts/SkinContext';
import { SkinEvent } from '../../skins/types';

interface BoardSkinProps {
  currentEvent?: SkinEvent;
  children: React.ReactNode;
}

const BoardSkin: React.FC<BoardSkinProps> = ({ currentEvent, children }) => {
  const skins = useSkins();
  const skin = skins.boardSkin;
  const lottieRef = useRef<LottieRefCurrentProps>(null);

  useEffect(() => {
    if (!lottieRef.current || skin.assetUrl === 'placeholder') return;
    // Phase 5: map SkinEvent → Lottie segment frames here
  }, [currentEvent, skin.assetUrl]);

  if (skin.assetUrl === 'placeholder') {
    return <div style={{ position: 'relative', display: 'inline-block' }}>{children}</div>;
  }

  if (skin.assetUrl.endsWith('.svg') || skin.assetUrl.startsWith('data:image/')) {
    return (
      <div style={{ position: 'relative', display: 'inline-block' }}>
        <img
          src={skin.assetUrl}
          alt=""
          aria-hidden
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 0 }}
        />
        <div style={{ position: 'relative', zIndex: 1 }}>{children}</div>
      </div>
    );
  }

  // Lottie board skin
  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <Lottie
        lottieRef={lottieRef}
        animationData={skin.assetUrl as any}
        loop
        style={{ position: 'absolute', inset: 0, zIndex: 0 }}
      />
      <div style={{ position: 'relative', zIndex: 1 }}>{children}</div>
    </div>
  );
};

export default BoardSkin;
