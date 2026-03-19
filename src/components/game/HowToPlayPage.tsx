import React, { useEffect, useRef, useCallback, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import introJs from 'intro.js';
import 'intro.js/introjs.css';
import LeaderLine from 'leader-line-new';
import MacroBoard from '../MacroBoard';
import { Game, Marker } from '../../models/Game';
import { BEGINNER_STEPS, INTERMEDIATE_STEPS, TutorialStep } from './tutorialScript';

const HowToPlayPage: React.FC = () => {
  const navigate = useNavigate();
  const { mode } = useParams<{ mode: string }>();
  const steps = mode === 'beginner' ? BEGINNER_STEPS : INTERMEDIATE_STEPS;

  // ── Game state ─────────────────────────────────────────────────────────────
  // One Game instance kept in a ref; spread trick forces re-renders after mutations.
  const gameRef = useRef(new Game());
  const [game, setGame] = useState(gameRef.current);

  const refreshGame = useCallback(() => {
    setGame({ ...gameRef.current } as Game);
  }, []);

  // ── Tutorial state ─────────────────────────────────────────────────────────
  // useRef instead of useState — updates are synchronous and don't trigger
  // re-renders, so handlePlaceMarker never reads a stale step index.
  const currentStepIndexRef = useRef(0);
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
  const drawArrow = useCallback((step: TutorialStep) => {
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
    if (nextIndex >= steps.length) {
      arrowRef.current?.remove();
      introRef.current?.exit(true);
      navigate('/');
      return;
    }
    currentStepIndexRef.current = nextIndex;
    introRef.current?.goToStepNumber(nextIndex + 1); // intro.js steps are 1-indexed
  }, [navigate, steps]);

  // ── Handle player clicking a tutorial cell ────────────────────────────────
  const handlePlaceMarker = useCallback((microBoardIndex: number, cellIndex: number) => {
    const idx = currentStepIndexRef.current;
    const step = steps[idx];

    if (!step.requiresClick) return;
    if (microBoardIndex !== step.boardIndex || cellIndex !== step.cellIndex) return;

    // Place the player's marker.
    gameRef.current.placeMarker(microBoardIndex, cellIndex);

    // Fire any AI response synchronously — both moves land in the same
    // refreshGame call, so step 4 renders with the correct nextMicroBoardIndex
    // immediately, eliminating the 300 ms race condition.
    if (step.aiMoveAfter && step.aiBoardIndex !== null && step.aiCellIndex !== null) {
      gameRef.current.placeMarker(step.aiBoardIndex, step.aiCellIndex);
    }

    refreshGame();
    advanceStep(idx + 1);
  }, [refreshGame, advanceStep, steps]);

  // ── Initialise Intro.js ───────────────────────────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => {
      const intro = introJs();

      intro.setOptions({
        steps: steps.map((step) => ({
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
        // intro.js 8.x exposes currentStep() as a method, not a property.
        const idx = (intro as any).currentStep() as number;
        const step = steps[idx];
        if (!step) return;

        // Keep the ref in sync so handlePlaceMarker always reads the correct step
        // when the user advances via the built-in Next button.
        currentStepIndexRef.current = idx;

        // If this step carries a preset board state, replace the game entirely.
        // This is used to teleport to the endgame scenario without playing through
        // every intermediate move.
        if (step.preloadState) {
          const newGame = new Game();
          step.preloadState.microBoards.forEach((mbState, i) => {
            const mb = newGame.macroBoard.microBoards[i];
            mbState.cells.forEach((marker, j) => {
              if (marker !== '') mb.cells[j].marker = marker as Marker;
            });
            if (mbState.winner !== '') mb.winner = mbState.winner as Marker;
            mb.checkFull();
          });
          newGame.macroBoard.checkWinner();
          newGame.nextMicroBoardIndex = step.preloadState.nextMicroBoardIndex;
          newGame.currentPlayerIndex = step.preloadState.currentPlayerIndex;
          gameRef.current = newGame;
          refreshGame();
        }

        // Toggle a body class instead of setting inline display.
        // Intro.js may rebuild the tooltip DOM after onafterchange returns,
        // wiping any inline style. A body class targeting the button survives
        // those DOM rebuilds because the rule lives in a stylesheet, not on the node.
        document.body.classList.toggle('tutorial-requires-click', step.requiresClick);

        // Small delay so the spotlight has settled before measuring positions
        setTimeout(() => drawArrow(step), 100);
      });

      intro.oncomplete(() => {
        document.body.classList.remove('tutorial-requires-click');
        arrowRef.current?.remove();
        navigate('/');
      });

      intro.onexit(() => {
        document.body.classList.remove('tutorial-requires-click');
        arrowRef.current?.remove();
        navigate('/');
      });

      intro.start();
      introRef.current = intro;
    }, 200);

    return () => {
      clearTimeout(t);
      document.body.classList.remove('tutorial-requires-click');
      arrowRef.current?.remove();
      introRef.current?.exit(true);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentional: runs once — `steps` is stable because `mode` comes from
          // a URL param and cannot change without unmounting this component.

  // ── Derive MacroBoard props ────────────────────────────────────────────────
  const microBoards = game.macroBoard?.microBoards.map((mb: any) => ({
    cells: mb.cells.map((c: any) => c.marker),
    winner: mb.winner ?? '',
  })) ?? Array(9).fill({ cells: Array(9).fill(''), winner: '' });

  return (
    <div style={{ minHeight: '100vh', background: '#1a2332', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>

      {/* Hide the Intro.js Next button on steps where the player must click a cell.
          Using a stylesheet rule + body class so it survives intro.js DOM rebuilds. */}
      <style>{`body.tutorial-requires-click .introjs-nextbutton { display: none !important; }`}</style>

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
