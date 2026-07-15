import React, { useState } from 'react';
import { useAdminSeasons, AdminSeason } from '../../hooks/useAdminSeasons';
import { tokens } from '../../styles/tokens';

const headerCell: React.CSSProperties = {
  fontSize: 9, color: tokens.textMuted, fontWeight: 700,
  textTransform: 'uppercase', letterSpacing: 0.8,
};

const statusColour = (status: string): string => {
  if (status === 'active')   return tokens.win;
  if (status === 'complete') return tokens.textMuted;
  return tokens.credits;
};

const statusChip = (status: string): React.CSSProperties => ({
  display: 'inline-flex', padding: '3px 10px', borderRadius: tokens.rPill,
  background: `${statusColour(status)}22`, color: statusColour(status),
  fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.6,
});

const fmtDate = (iso: string): string => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString();
};

interface RowProps {
  season: AdminSeason;
  skins: { id: string; name: string; type: string }[];
  onSetReward: (seasonId: string, skinId: string | null) => Promise<string | null>;
}

const SeasonRow: React.FC<RowProps> = ({ season, skins, onSetReward }) => {
  const [saving, setSaving] = useState(false);
  const [rowError, setRowError] = useState<string | null>(null);
  const isActive = season.status === 'active';

  const selectStyle: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box',
    background: tokens.bgCard, border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 6, padding: '5px 8px', fontSize: 12, color: tokens.text,
    fontFamily: tokens.font, outline: 'none', colorScheme: 'dark',
    cursor: saving ? 'wait' : 'pointer',
  };

  const optionStyle: React.CSSProperties = { background: tokens.bgCard, color: tokens.text };

  const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    const skinId = val === '' ? null : val;
    setSaving(true);
    const err = await onSetReward(season.id, skinId);
    setSaving(false);
    setRowError(err);
  };

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '50px 1fr 100px 100px 90px 1fr',
      gap: 8, padding: '10px 14px', alignItems: 'center',
      borderBottom: '1px solid rgba(255,255,255,0.04)',
    }}>
      <div style={{ fontSize: 12, color: tokens.text, fontWeight: 700 }}>#{season.number ?? '—'}</div>
      <div style={{ fontSize: 12, color: tokens.text, fontWeight: 600 }}>{season.name}</div>
      <div style={{ fontSize: 11, color: tokens.textDim }}>{fmtDate(season.start_date)}</div>
      <div style={{ fontSize: 11, color: tokens.textDim }}>{fmtDate(season.end_date)}</div>
      <div><span style={statusChip(season.status)}>{season.status}</span></div>

      {isActive ? (
        <div>
          <select
            value={season.reward_skin_id ?? ''}
            onChange={handleChange}
            disabled={saving}
            style={selectStyle}
          >
            <option value="" style={optionStyle}>— No reward skin —</option>
            {skins.map(s => (
              <option key={s.id} value={s.id} style={optionStyle}>
                {s.name} ({s.type})
              </option>
            ))}
          </select>
          {rowError && (
            <div style={{ fontSize: 10, color: tokens.loss, marginTop: 4 }}>{rowError}</div>
          )}
        </div>
      ) : (
        <div style={{ fontSize: 12, color: tokens.textMuted }}>{season.reward_skin_name ?? '—'}</div>
      )}
    </div>
  );
};

const SeasonsManager: React.FC = () => {
  const { seasons, skins, loading, error, setSeasonReward } = useAdminSeasons();

  const activeSeason = seasons.find(s => s.status === 'active');
  const showWarning = !!activeSeason && activeSeason.reward_skin_id === null;

  return (
    <div style={{ fontFamily: tokens.font, display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      {/* Frozen header */}
      <div style={{ flexShrink: 0, marginBottom: 20 }}>
        <div style={{ fontSize: 18, fontWeight: 800, color: tokens.text }}>Seasons</div>
        <div style={{ fontSize: 11, color: tokens.textMuted, marginTop: 2 }}>
          {seasons.length} season{seasons.length !== 1 ? 's' : ''}
        </div>
      </div>

      {showWarning && (
        <div style={{
          flexShrink: 0, marginBottom: 16, padding: '10px 14px', borderRadius: 8,
          background: `${tokens.warn}1a`, border: `1px solid ${tokens.warn}55`,
          color: tokens.warn, fontSize: 12, fontWeight: 600,
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <span aria-hidden="true">⚠</span>
          No season reward skin set — rollover will grant credits only.
        </div>
      )}

      <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
        {loading && <div style={{ color: tokens.textMuted, fontSize: 13, padding: '40px 0', textAlign: 'center' }}>Loading…</div>}
        {!loading && error && (
          <div style={{ padding: '12px 16px', borderRadius: 8, background: 'rgba(229,62,62,0.12)', color: tokens.loss, fontSize: 13 }}>
            {error}
          </div>
        )}
        {!loading && !error && seasons.length === 0 && (
          <div style={{ color: tokens.textMuted, fontSize: 13, padding: '40px 0', textAlign: 'center' }}>
            No seasons yet.
          </div>
        )}

        {!loading && !error && seasons.length > 0 && (
          <div style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 10, overflow: 'hidden',
          }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '50px 1fr 100px 100px 90px 1fr',
              gap: 8, padding: '8px 14px',
              borderBottom: '1px solid rgba(255,255,255,0.07)',
            }}>
              <div style={headerCell}>#</div>
              <div style={headerCell}>Name</div>
              <div style={headerCell}>Start</div>
              <div style={headerCell}>End</div>
              <div style={headerCell}>Status</div>
              <div style={headerCell}>Reward Skin</div>
            </div>

            {seasons.map(s => (
              <SeasonRow key={s.id} season={s} skins={skins} onSetReward={setSeasonReward} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SeasonsManager;
