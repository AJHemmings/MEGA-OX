import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import introJs from 'intro.js';
import 'intro.js/introjs.css';
import LeaderLine from 'leader-line-new';
import MacroBoard from '../MacroBoard';
import { Game } from '../../models/Game';
import { TUTORIAL_STEPS } from './tutorialScript';

const HowToPlayPage: React.FC = () => {
  const navigate = useNavigate();

  // ── Game state ─────────────────────────────────────────────────────────────
  // One Game instance kept in a ref; spread trick forces re-renders after mutations.
  const gameRef = useRef(new Game());
  const [game, setGame] = useState(gameRef.current);

  const refreshGame = useCallback(() => {
    setGame({ ...gameRef.current } as Game);
  }, []);

  // ── Tutorial state ─────────────────────────────────────────────────────────
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const introRef = useRef<ReturnType<typeof introJs> | null>(null);
  const arrowRef = useRef<InstanceType<typeof LeaderLine> | null>(null);

  // ── Add stable IDs to rendered board elements ─────────────────────────────
  // Intro.js and Leader Line target elements by CSS selector.
  // We add IDs here because MacroBoard/MicroBoard don't accept id props.
  const addBoardIds = useCallback(() => {
    const macroEl = document.querySelector('[aria-label="Macro board"]');
    if (macroEl) macroEl.id = 'tutorial-macro-board';

    // #tutorial-micro-0 through #tutorial-micro-8
    const microEls = document.querySelectorAll('[aria-label^="MicroBoard"]');
    microEls.forEach((el, i) => {
      el.id = `tutorial-micro-${i}`;

      // #tutorial-cell-{boardIndex}-{cellIndex}
      const cells = el.querySelectorAll('button');
      cells.forEach((cell, j) => {
        (cell as HTMLElement).id = `tutorial-cell-${i}-${j}`;
      });
    });
  }, []);

  // Re-add IDs after every game state change (React re-renders replace DOM nodes)
  useEffect(() => {
    const t = setTimeout(addBoardIds, 50);
    return () => clearTimeout(t);
  }, [game, addBoardIds]);

  // ── Draw / remove Leader Line arrow ───────────────────────────────────────
  const drawArrow = useCallback((step: typeof TUTORIAL_STEPS[0]) => {
    arrowRef.current?.remove();
    arrowRef.current = null;

    if (!step.arrow) return;

    const fromEl = document.querySelector(step.arrow.from);
    const toEl = document.querySelector(step.arrow.to);
    if (!fromEl || !toEl || fromEl === toEl) return;

    arrowRef.current = new LeaderLine(fromEl as Element, toEl as Element, {
      color: '#00d4aa',
      size: 3,
      dash: { animation: true },
      path: 'fluid',
    });
  }, []);

  // ── Advance to the next step ───────────────────────────────────────────────
  const advanceStep = useCallback((nextIndex: number) => {
    if (nextIndex >= TUTORIAL_STEPS.length) {
      arrowRef.current?.remove();
      introRef.current?.exit(true);
      navigate('/');
      return;
    }
    setCurrentStepIndex(nextIndex);
    introRef.current?.goToStepNumber(nextIndex + 1); // intro.js steps are 1-indexed
  }, [navigate]);

  // ── Handle player clicking a tutorial cell ────────────────────────────────
  const handlePlaceMarker = useCallback((microBoardIndex: number, cellIndex: number) => {
    const step = TUTORIAL_STEPS[currentStepIndex];

    if (!step.requiresClick) return;
    if (microBoardIndex !== step.boardIndex || cellIndex !== step.cellIndex) return;

    gameRef.current.placeMarker(microBoardIndex, cellIndex);

    if (step.aiMoveAfter && step.aiBoardIndex !== null && step.aiCellIndex !== null) {
      setTimeout(() => {
        gameRef.current.placeMarker(step.aiBoardIndex!, step.aiCellIndex!);
        refreshGame();
      }, 600);
    }

    refreshGame();
    advanceStep(currentStepIndex + 1);
  }, [currentStepIndex, refreshGame, advanceStep]);

  // ── Initialise Intro.js ───────────────────────────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => {
      const intro = introJs();

      intro.setOptions({
        steps: TUTORIAL_STEPS.map((step) => ({
          element: document.querySelector(step.targetSelector) as Element,
          intro: step.intro,
          title: step.title,
        })),
        nextLabel: 'Next →',
        prevLabel: '← Back',
        doneLabel: 'Done',
        showBullets: true,
        exitOnOverlayClick: false,
        // Keep the board interactive during requiresClick steps
        disableInteraction: false,
      });

      intro.onafterchange(() => {
        const idx = (intro as any)._currentStep as number;
        const step = TUTORIAL_STEPS[idx];
        if (!step) return;

        // Small delay so the spotlight has settled before measuring positions
        setTimeout(() => drawArrow(step), 100);

        const nextBtn = document.querySelector('.introjs-nextbutton') as HTMLElement | null;
        if (nextBtn) {
          nextBtn.style.display = step.requiresClick ? 'none' : '';
        }
      });

      intro.oncomplete(() => {
        arrowRef.current?.remove();
        navigate('/');
      });

      intro.onexit(() => {
        arrowRef.current?.remove();
        navigate('/');
      });

      intro.start();
      introRef.current = intro;
    }, 200);

    return () => {
      clearTimeout(t);
      arrowRef.current?.remove();
      introRef.current?.exit(true);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Derive MacroBoard props ────────────────────────────────────────────────
  const microBoards = game.macroBoard?.microBoards.map((mb: any) => ({
    cells: mb.cells.map((c: any) => c.marker),
    winner: mb.winner ?? '',
  })) ?? Array(9).fill({ cells: Array(9).fill(''), winner: '' });

  return (
    <div style={{ minHeight: '100vh', background: '#1a2332', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>

      {/* Exit button */}
      <button
        onClick={() => navigate('/')}
        style={{ position: 'fixed', top: '16px', left: '16px', background: 'none', border: '1px solid #4a5568', color: '#a0aec0', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', zIndex: 99999999 }}
      >
        ← Exit Tutorial
      </button>

      {/* The game board — same components as the real game */}
      <MacroBoard
        microBoards={microBoards}
        onPlaceMarker={handlePlaceMarker}
        nextMicroBoardIndex={game.nextMicroBoardIndex ?? null}
        macroWinner={game.macroBoard?.winner ?? ''}
        lastMove={null}
      />
    </div>
  );
};

export default HowToPlayPage;
