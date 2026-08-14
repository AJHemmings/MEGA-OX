-- Theme Phase B1: Classic's component items.
-- Every value here is lifted verbatim from src/theme/defaults.ts
-- (CLASSIC_THEME). src/__tests__/themeSchemaSync.test.ts asserts they stay
-- identical — if you change one, change both.
-- Note: background.base is the string 'var(--bg-base)', NOT a hex literal.
-- The palette on this same row is what defines --bg-base (spec §4: the
-- palette rides on the background item).

INSERT INTO public.cosmetic_items
  (id, name, type, asset_url, price, rarity, source, animated, config) VALUES

  ('00000000-0000-000b-0001-000000000001', 'Classic Background', 'background',
   'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 60 40%22><rect width=%2260%22 height=%2240%22 fill=%22%23060d1f%22/><ellipse cx=%228%22 cy=%224%22 rx=%2236%22 ry=%2218%22 fill=%22%231a2a6c%22 opacity=%220.55%22/><ellipse cx=%2258%22 cy=%2238%22 rx=%2230%22 ry=%2216%22 fill=%22%2300d4aa%22 opacity=%220.18%22/></svg>',
   0, 'common', 'default', false,
   '{
      "palette": {
        "accent": "#00d4aa", "accentDark": "#00b894",
        "bgBase": "#060d1f", "bgCard": "#0d1530", "bgSurface": "#1a2340",
        "text": "#ffffff", "textMuted": "#a0aec0", "textDim": "#4a5568",
        "win": "#00d4aa", "loss": "#ff6b6b", "draw": "#a0aec0",
        "xp": "#7c4dff", "xpDark": "#4a1fa0", "credits": "#f9a825", "warn": "#f7931e",
        "p1": "#00d4aa", "p2": "#ff6b6b",
        "glassBg": "linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))",
        "glassBorder": "1px solid rgba(255,255,255,0.10)",
        "glassBlur": "blur(12px)",
        "innerBg": "rgba(255,255,255,0.04)",
        "innerBorder": "1px solid rgba(255,255,255,0.06)",
        "ctaShadow": "0 8px 24px rgba(0,212,170,0.30)",
        "ctaShadowHover": "0 12px 32px rgba(0,212,170,0.45)",
        "cardShadow": "0 8px 25px rgba(0,0,0,0.30)",
        "font": "''Nunito'', system-ui, sans-serif"
      },
      "base": "var(--bg-base)",
      "layers": [
        { "shape": "ellipse 80% 60%", "at": "0% 0%",     "color": "rgba(26,42,108,0.55)",  "stop": "60%" },
        { "shape": "ellipse 70% 50%", "at": "100% 100%", "color": "rgba(0,212,170,0.18)",  "stop": "65%" },
        { "shape": "ellipse 40% 40%", "at": "110% 40%",  "color": "rgba(124,77,255,0.10)", "stop": "60%" }
      ]
    }'::jsonb),

  ('00000000-0000-000b-0002-000000000001', 'Classic Cursor', 'cursor',
   'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 32 32%22><path d=%22M6 2 L6 24 L12 18 L16 27 L20 25 L16 16 L24 16 Z%22 fill=%22%23ffffff%22 stroke=%22%2300d4aa%22 stroke-width=%221.5%22/></svg>',
   0, 'common', 'default', false,
   '{ "svg": "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"32\" height=\"32\" viewBox=\"0 0 32 32\"><path d=\"M6 2 L6 24 L12 18 L16 27 L20 25 L16 16 L24 16 Z\" fill=\"#ffffff\" stroke=\"#00d4aa\" stroke-width=\"1.5\"/></svg>",
      "hotspot": [6, 2] }'::jsonb),

  ('00000000-0000-000b-0003-000000000001', 'Classic Sounds', 'sound_pack',
   'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 40 40%22><path d=%22M8 16 L14 16 L20 10 L20 30 L14 24 L8 24 Z%22 fill=%22%2300d4aa%22/><path d=%22M24 14 Q28 20 24 26%22 stroke=%22%2300d4aa%22 stroke-width=%222%22 fill=%22none%22/></svg>',
   0, 'common', 'default', false,
   '{
      "marker_placed":   [{ "freq": 440, "dur": 0.08, "wave": "square", "gain": 0.15, "delay": 0 }],
      "your_turn":       [{ "freq": 523, "dur": 0.15, "wave": "sine", "gain": 0.25, "delay": 0 },
                          { "freq": 659, "dur": 0.2,  "wave": "sine", "gain": 0.25, "delay": 0.15 }],
      "micro_board_won": [{ "freq": 523, "dur": 0.12, "wave": "sine", "gain": 0.3, "delay": 0 },
                          { "freq": 659, "dur": 0.12, "wave": "sine", "gain": 0.3, "delay": 0.13 },
                          { "freq": 784, "dur": 0.2,  "wave": "sine", "gain": 0.3, "delay": 0.26 }],
      "game_won":        [{ "freq": 523,  "dur": 0.18, "wave": "sine", "gain": 0.3, "delay": 0 },
                          { "freq": 659,  "dur": 0.18, "wave": "sine", "gain": 0.3, "delay": 0.12 },
                          { "freq": 784,  "dur": 0.18, "wave": "sine", "gain": 0.3, "delay": 0.24 },
                          { "freq": 1047, "dur": 0.18, "wave": "sine", "gain": 0.3, "delay": 0.36 }],
      "game_lost":       [{ "freq": 392, "dur": 0.2, "wave": "sine", "gain": 0.25, "delay": 0 },
                          { "freq": 330, "dur": 0.3, "wave": "sine", "gain": 0.25, "delay": 0.22 }]
    }'::jsonb),

  ('00000000-0000-000b-0004-000000000001', 'Classic Pills', 'pill_style',
   'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 60 24%22><rect x=%222%22 y=%226%22 width=%2226%22 height=%2212%22 rx=%226%22 fill=%22%2300d4aa%22 opacity=%220.15%22 stroke=%22%2300d4aa%22/><rect x=%2232%22 y=%226%22 width=%2226%22 height=%2212%22 rx=%226%22 fill=%22%237c4dff%22 opacity=%220.18%22 stroke=%22%237c4dff%22/></svg>',
   0, 'common', 'default', false,
   '{
      "teal":   { "background": "rgba(0,212,170,0.15)",   "border": "1px solid rgba(0,212,170,0.35)",   "color": "var(--accent)" },
      "purple": { "background": "rgba(124,77,255,0.18)",  "border": "1px solid rgba(124,77,255,0.40)",  "color": "#b39dff" },
      "gold":   { "background": "rgba(249,168,37,0.15)",  "border": "1px solid rgba(249,168,37,0.40)",  "color": "var(--credits)" },
      "red":    { "background": "rgba(255,107,107,0.15)", "border": "1px solid rgba(255,107,107,0.35)", "color": "var(--loss)" },
      "muted":  { "background": "rgba(255,255,255,0.06)", "border": "1px solid rgba(255,255,255,0.12)", "color": "var(--text-muted)" }
    }'::jsonb)

ON CONFLICT (id) DO NOTHING;
