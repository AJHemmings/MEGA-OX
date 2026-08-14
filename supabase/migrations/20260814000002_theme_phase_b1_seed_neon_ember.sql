-- Theme Phase B1: Dark Neon and Ember component items.
-- The first themes that actually look different. Each palette is anchored to
-- the shop items its theme bundles (Dark Neon → Neon Grid board + Neon Set
-- markers; Ember → Minimal board + Pixel Set markers) so the theme reads as
-- coherent with what the player bought.
--
-- Structure is identical to 20260814000001 (Classic). Every palette carries
-- all 26 ThemePalette keys — a missing key silently leaves that surface on
-- Classic's value rather than erroring.

INSERT INTO public.cosmetic_items
  (id, name, type, asset_url, price, rarity, source, animated, config) VALUES

  -- ---------- DARK NEON ----------
  ('00000000-0000-000b-0001-000000000002', 'Dark Neon Background', 'background',
   'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 60 40%22><rect width=%2260%22 height=%2240%22 fill=%22%2303060f%22/><ellipse cx=%228%22 cy=%224%22 rx=%2236%22 ry=%2218%22 fill=%22%2300e5c0%22 opacity=%220.16%22/><ellipse cx=%2258%22 cy=%2238%22 rx=%2230%22 ry=%2216%22 fill=%22%239d6bff%22 opacity=%220.20%22/></svg>',
   400, 'rare', 'shop', false,
   '{
      "palette": {
        "accent": "#00e5c0", "accentDark": "#00b89a",
        "bgBase": "#03060f", "bgCard": "#0a1020", "bgSurface": "#131c33",
        "text": "#ffffff", "textMuted": "#93a4c3", "textDim": "#46536e",
        "win": "#00e5c0", "loss": "#ff5c8a", "draw": "#93a4c3",
        "xp": "#9d6bff", "xpDark": "#5a2fd0", "credits": "#ffc247", "warn": "#ff9f1c",
        "p1": "#00e5c0", "p2": "#ff5c8a",
        "glassBg": "linear-gradient(135deg, rgba(255,255,255,0.10), rgba(255,255,255,0.04))",
        "glassBorder": "1px solid rgba(0,229,192,0.18)",
        "glassBlur": "blur(14px)",
        "innerBg": "rgba(255,255,255,0.05)",
        "innerBorder": "1px solid rgba(255,255,255,0.08)",
        "ctaShadow": "0 8px 24px rgba(0,229,192,0.35)",
        "ctaShadowHover": "0 12px 32px rgba(0,229,192,0.50)",
        "cardShadow": "0 8px 25px rgba(0,0,0,0.45)",
        "font": "''Nunito'', system-ui, sans-serif"
      },
      "base": "var(--bg-base)",
      "layers": [
        { "shape": "ellipse 80% 60%", "at": "0% 0%",     "color": "rgba(0,229,192,0.16)",  "stop": "60%" },
        { "shape": "ellipse 70% 50%", "at": "100% 100%", "color": "rgba(157,107,255,0.20)", "stop": "65%" },
        { "shape": "ellipse 40% 40%", "at": "110% 40%",  "color": "rgba(255,92,138,0.10)",  "stop": "60%" }
      ]
    }'::jsonb),

  ('00000000-0000-000b-0002-000000000002', 'Dark Neon Cursor', 'cursor',
   'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 32 32%22><path d=%22M6 2 L6 24 L12 18 L16 27 L20 25 L16 16 L24 16 Z%22 fill=%22%23ffffff%22 stroke=%22%2300e5c0%22 stroke-width=%221.5%22/></svg>',
   150, 'common', 'shop', false,
   '{ "svg": "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"32\" height=\"32\" viewBox=\"0 0 32 32\"><path d=\"M6 2 L6 24 L12 18 L16 27 L20 25 L16 16 L24 16 Z\" fill=\"#ffffff\" stroke=\"#00e5c0\" stroke-width=\"1.5\"/></svg>",
      "hotspot": [6, 2] }'::jsonb),

  ('00000000-0000-000b-0003-000000000002', 'Dark Neon Sounds', 'sound_pack',
   'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 40 40%22><path d=%22M8 16 L14 16 L20 10 L20 30 L14 24 L8 24 Z%22 fill=%22%2300e5c0%22/><path d=%22M24 14 Q28 20 24 26%22 stroke=%22%239d6bff%22 stroke-width=%222%22 fill=%22none%22/></svg>',
   200, 'common', 'shop', false,
   '{
      "marker_placed":   [{ "freq": 660, "dur": 0.06, "wave": "square", "gain": 0.14, "delay": 0 }],
      "your_turn":       [{ "freq": 784, "dur": 0.12, "wave": "triangle", "gain": 0.22, "delay": 0 },
                          { "freq": 988, "dur": 0.16, "wave": "triangle", "gain": 0.22, "delay": 0.12 }],
      "micro_board_won": [{ "freq": 659,  "dur": 0.10, "wave": "triangle", "gain": 0.28, "delay": 0 },
                          { "freq": 880,  "dur": 0.10, "wave": "triangle", "gain": 0.28, "delay": 0.11 },
                          { "freq": 1175, "dur": 0.18, "wave": "triangle", "gain": 0.28, "delay": 0.22 }],
      "game_won":        [{ "freq": 659,  "dur": 0.15, "wave": "triangle", "gain": 0.28, "delay": 0 },
                          { "freq": 880,  "dur": 0.15, "wave": "triangle", "gain": 0.28, "delay": 0.10 },
                          { "freq": 1175, "dur": 0.15, "wave": "triangle", "gain": 0.28, "delay": 0.20 },
                          { "freq": 1568, "dur": 0.20, "wave": "triangle", "gain": 0.28, "delay": 0.30 }],
      "game_lost":       [{ "freq": 440, "dur": 0.18, "wave": "square", "gain": 0.20, "delay": 0 },
                          { "freq": 330, "dur": 0.28, "wave": "square", "gain": 0.20, "delay": 0.20 }]
    }'::jsonb),

  ('00000000-0000-000b-0004-000000000002', 'Dark Neon Pills', 'pill_style',
   'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 60 24%22><rect x=%222%22 y=%226%22 width=%2226%22 height=%2212%22 rx=%226%22 fill=%22%2300e5c0%22 opacity=%220.16%22 stroke=%22%2300e5c0%22/><rect x=%2232%22 y=%226%22 width=%2226%22 height=%2212%22 rx=%226%22 fill=%22%239d6bff%22 opacity=%220.20%22 stroke=%22%239d6bff%22/></svg>',
   150, 'common', 'shop', false,
   '{
      "teal":   { "background": "rgba(0,229,192,0.16)",   "border": "1px solid rgba(0,229,192,0.38)",   "color": "var(--accent)" },
      "purple": { "background": "rgba(157,107,255,0.20)", "border": "1px solid rgba(157,107,255,0.42)", "color": "#c4a6ff" },
      "gold":   { "background": "rgba(255,194,71,0.16)",  "border": "1px solid rgba(255,194,71,0.42)",  "color": "var(--credits)" },
      "red":    { "background": "rgba(255,92,138,0.16)",  "border": "1px solid rgba(255,92,138,0.38)",  "color": "var(--loss)" },
      "muted":  { "background": "rgba(255,255,255,0.07)", "border": "1px solid rgba(255,255,255,0.14)", "color": "var(--text-muted)" }
    }'::jsonb),

  -- ---------- EMBER ----------
  ('00000000-0000-000b-0001-000000000003', 'Ember Background', 'background',
   'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 60 40%22><rect width=%2260%22 height=%2240%22 fill=%22%2314090b%22/><ellipse cx=%228%22 cy=%224%22 rx=%2236%22 ry=%2218%22 fill=%22%23781e0a%22 opacity=%220.55%22/><ellipse cx=%2258%22 cy=%2238%22 rx=%2230%22 ry=%2216%22 fill=%22%23ff7a3d%22 opacity=%220.18%22/></svg>',
   400, 'rare', 'shop', false,
   '{
      "palette": {
        "accent": "#ff7a3d", "accentDark": "#d95f28",
        "bgBase": "#14090b", "bgCard": "#241014", "bgSurface": "#33181c",
        "text": "#fff5f0", "textMuted": "#c9a99e", "textDim": "#6b4a44",
        "win": "#ffb547", "loss": "#e5484d", "draw": "#c9a99e",
        "xp": "#ff9f45", "xpDark": "#a8501a", "credits": "#ffd166", "warn": "#ff8c42",
        "p1": "#ff7a3d", "p2": "#ffd166",
        "glassBg": "linear-gradient(135deg, rgba(255,255,255,0.09), rgba(255,255,255,0.03))",
        "glassBorder": "1px solid rgba(255,122,61,0.20)",
        "glassBlur": "blur(12px)",
        "innerBg": "rgba(255,255,255,0.045)",
        "innerBorder": "1px solid rgba(255,180,120,0.10)",
        "ctaShadow": "0 8px 24px rgba(255,122,61,0.32)",
        "ctaShadowHover": "0 12px 32px rgba(255,122,61,0.48)",
        "cardShadow": "0 8px 25px rgba(0,0,0,0.40)",
        "font": "''Nunito'', system-ui, sans-serif"
      },
      "base": "var(--bg-base)",
      "layers": [
        { "shape": "ellipse 80% 60%", "at": "0% 0%",     "color": "rgba(120,30,10,0.55)",   "stop": "60%" },
        { "shape": "ellipse 70% 50%", "at": "100% 100%", "color": "rgba(255,122,61,0.18)",  "stop": "65%" },
        { "shape": "ellipse 40% 40%", "at": "110% 40%",  "color": "rgba(255,209,102,0.10)", "stop": "60%" }
      ]
    }'::jsonb),

  ('00000000-0000-000b-0002-000000000003', 'Ember Cursor', 'cursor',
   'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 32 32%22><path d=%22M6 2 L6 24 L12 18 L16 27 L20 25 L16 16 L24 16 Z%22 fill=%22%23fff5f0%22 stroke=%22%23ff7a3d%22 stroke-width=%221.5%22/></svg>',
   150, 'common', 'shop', false,
   '{ "svg": "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"32\" height=\"32\" viewBox=\"0 0 32 32\"><path d=\"M6 2 L6 24 L12 18 L16 27 L20 25 L16 16 L24 16 Z\" fill=\"#fff5f0\" stroke=\"#ff7a3d\" stroke-width=\"1.5\"/></svg>",
      "hotspot": [6, 2] }'::jsonb),

  ('00000000-0000-000b-0003-000000000003', 'Ember Sounds', 'sound_pack',
   'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 40 40%22><path d=%22M8 16 L14 16 L20 10 L20 30 L14 24 L8 24 Z%22 fill=%22%23ff7a3d%22/><path d=%22M24 14 Q28 20 24 26%22 stroke=%22%23ffd166%22 stroke-width=%222%22 fill=%22none%22/></svg>',
   200, 'common', 'shop', false,
   '{
      "marker_placed":   [{ "freq": 330, "dur": 0.10, "wave": "triangle", "gain": 0.16, "delay": 0 }],
      "your_turn":       [{ "freq": 392, "dur": 0.18, "wave": "sine", "gain": 0.25, "delay": 0 },
                          { "freq": 494, "dur": 0.22, "wave": "sine", "gain": 0.25, "delay": 0.16 }],
      "micro_board_won": [{ "freq": 392, "dur": 0.14, "wave": "sine", "gain": 0.30, "delay": 0 },
                          { "freq": 494, "dur": 0.14, "wave": "sine", "gain": 0.30, "delay": 0.14 },
                          { "freq": 587, "dur": 0.24, "wave": "sine", "gain": 0.30, "delay": 0.28 }],
      "game_won":        [{ "freq": 392, "dur": 0.20, "wave": "sine", "gain": 0.30, "delay": 0 },
                          { "freq": 494, "dur": 0.20, "wave": "sine", "gain": 0.30, "delay": 0.14 },
                          { "freq": 587, "dur": 0.20, "wave": "sine", "gain": 0.30, "delay": 0.28 },
                          { "freq": 784, "dur": 0.26, "wave": "sine", "gain": 0.30, "delay": 0.42 }],
      "game_lost":       [{ "freq": 294, "dur": 0.24, "wave": "sine", "gain": 0.24, "delay": 0 },
                          { "freq": 220, "dur": 0.34, "wave": "sine", "gain": 0.24, "delay": 0.24 }]
    }'::jsonb),

  ('00000000-0000-000b-0004-000000000003', 'Ember Pills', 'pill_style',
   'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 60 24%22><rect x=%222%22 y=%226%22 width=%2226%22 height=%2212%22 rx=%226%22 fill=%22%23ff7a3d%22 opacity=%220.16%22 stroke=%22%23ff7a3d%22/><rect x=%2232%22 y=%226%22 width=%2226%22 height=%2212%22 rx=%226%22 fill=%22%23ffd166%22 opacity=%220.16%22 stroke=%22%23ffd166%22/></svg>',
   150, 'common', 'shop', false,
   '{
      "teal":   { "background": "rgba(255,122,61,0.16)",  "border": "1px solid rgba(255,122,61,0.38)",  "color": "var(--accent)" },
      "purple": { "background": "rgba(255,159,69,0.20)",  "border": "1px solid rgba(255,159,69,0.42)",  "color": "#ffc79a" },
      "gold":   { "background": "rgba(255,209,102,0.16)", "border": "1px solid rgba(255,209,102,0.42)", "color": "var(--credits)" },
      "red":    { "background": "rgba(229,72,77,0.18)",   "border": "1px solid rgba(229,72,77,0.40)",   "color": "var(--loss)" },
      "muted":  { "background": "rgba(255,255,255,0.06)", "border": "1px solid rgba(255,240,230,0.12)", "color": "var(--text-muted)" }
    }'::jsonb)

ON CONFLICT (id) DO NOTHING;
