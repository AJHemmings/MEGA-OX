// src/skins/registry.ts
import { Skin } from './types';
import { ALL_DEFAULT_SKINS } from './defaults';

const skinRegistry = new Map<string, Skin>();

// Seed with defaults
ALL_DEFAULT_SKINS.forEach(skin => skinRegistry.set(skin.id, skin));

export const getSkin = (id: string | null | undefined, fallback: Skin): Skin => {
  if (!id) return fallback;
  return skinRegistry.get(id) ?? fallback;
};

/** In Phase 6: replace this with a Supabase Storage fetch. */
export const registerSkin = (skin: Skin): void => {
  skinRegistry.set(skin.id, skin);
};
