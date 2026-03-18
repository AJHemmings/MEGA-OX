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
  }, [currentEvent, skin]);

  if (skin.assetUrl === 'placeholder') {
    // Transparent wrapper — board renders as normal
    return <div style={{ position: 'relative', display: 'inline-block' }}>{children}</div>;
  }

  // Real Lottie board skin (Phase 5+) — sits behind children
  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <Lottie
        lottieRef={lottieRef}
        animationData={skin.assetUrl}
        loop
        style={{ position: 'absolute', inset: 0, zIndex: 0 }}
      />
      <div style={{ position: 'relative', zIndex: 1 }}>{children}</div>
    </div>
  );
};

export default BoardSkin;
