// src/skins/loadGameSkins.ts
import { supabase } from '../lib/supabase';
import { PlayerSkinSelection } from './types';

const EMPTY_SELECTION: PlayerSkinSelection = {
  boardSkin: null,
  markerXSkin: null,
  markerOSkin: null,
};

// Fetches one player's equipped board/marker cosmetics (profiles.active_board_id
// / active_marker_id / active_marker_o_id) and resolves them to Skin objects
// via cosmetic_items. Marker items store both glyphs on one row — asset_url
// is the X glyph, asset_url_secondary is the O glyph — so which column is read
// depends on which slot (active_marker_id vs active_marker_o_id) referenced it,
// not on the item's own type.
export async function fetchPlayerSkinSelection(userId: string): Promise<PlayerSkinSelection> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('active_board_id, active_marker_id, active_marker_o_id')
    .eq('id', userId)
    .maybeSingle();

  if (!profile) return EMPTY_SELECTION;

  const ids = [profile.active_board_id, profile.active_marker_id, profile.active_marker_o_id]
    .filter((id): id is string => !!id);
  if (ids.length === 0) return EMPTY_SELECTION;

  const { data: items } = await supabase
    .from('cosmetic_items')
    .select('id, name, asset_url, asset_url_secondary')
    .in('id', ids);

  const byId = new Map((items ?? []).map(i => [i.id, i]));

  const boardItem   = profile.active_board_id    ? byId.get(profile.active_board_id)    : undefined;
  const markerXItem = profile.active_marker_id   ? byId.get(profile.active_marker_id)   : undefined;
  const markerOItem = profile.active_marker_o_id ? byId.get(profile.active_marker_o_id) : undefined;

  return {
    boardSkin: boardItem?.asset_url
      ? { id: boardItem.id, name: boardItem.name, type: 'board', assetUrl: boardItem.asset_url }
      : null,
    markerXSkin: markerXItem?.asset_url
      ? { id: markerXItem.id, name: markerXItem.name, type: 'marker_x', assetUrl: markerXItem.asset_url }
      : null,
    markerOSkin: markerOItem?.asset_url_secondary
      ? { id: markerOItem.id, name: markerOItem.name, type: 'marker_o', assetUrl: markerOItem.asset_url_secondary }
      : null,
  };
}
