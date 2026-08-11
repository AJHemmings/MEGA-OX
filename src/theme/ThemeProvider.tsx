// src/theme/ThemeProvider.tsx
import React, { createContext, useContext, useLayoutEffect, useMemo } from 'react';
import { Theme } from './types';
import { CLASSIC_THEME } from './defaults';
import { themeToCssVars } from './cssVars';

const ThemeContext = createContext<Theme>(CLASSIC_THEME);

/** Non-CSS surfaces (sounds now, cursor in Phase B) read the theme from here. */
export const useTheme = (): Theme => useContext(ThemeContext);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Phase A always resolves to Classic. Phase B swaps this for the equipped theme.
  const theme = CLASSIC_THEME;

  const vars = useMemo(() => themeToCssVars(theme), [theme]);

  // useLayoutEffect, not useEffect: a plain effect runs AFTER first paint, so the
  // first frame would render with unresolved var() references. index.html sets a
  // dark body background so the page never flashes white, but text and border
  // colours would still pop. This matters given the "diff you cannot see" bar.
  //
  // No cleanup that removes the properties: doing so would blank the app's palette
  // during StrictMode's dev double-invoke. Writing is idempotent, so re-running is
  // harmless.
  useLayoutEffect(() => {
    const root = document.documentElement;
    Object.entries(vars).forEach(([name, value]) => root.style.setProperty(name, value));
  }, [vars]);

  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
};
