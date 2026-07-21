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
  onUpdate: (seasonId: string, name: string | null, startDate: string | null, endDate: string | null) => Promise<string | null>;
}

const SeasonRow: React.FC<RowProps> = ({ season, skins, onSetReward, onUpdate }) => {
  const [saving, setSaving] = useState(false);
  const [rowError, setRowError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(season.name);
  const [editStart, setEditStart] = useState(season.start_date);
  const [editEnd, setEditEnd] = useState(season.end_date);
  const isActive = season.status === 'active';
  const isUpcoming = season.status === 'upcoming';

  const selectStyle: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box',
    background: tokens.bgCard, border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 6, padding: '5px 8px', fontSize: 12, color: tokens.text,
    fontFamily: tokens.font, outline: 'none', colorScheme: 'dark',
    cursor: saving ? 'wait' : 'pointer',
  };

  const editInputStyle: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box',
    background: tokens.bgCard, color: tokens.text,
    border: '1px solid rgba(255,255,255,0.12)', borderRadius: 6,
    padding: '4px 6px', fontSize: 11, fontFamily: tokens.font, outline: 'none',
    colorScheme: 'dark',
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

  const startEdit = () => {
    setEditName(season.name);
    setEditStart(season.start_date);
    setEditEnd(season.end_date);
    setRowError(null);
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditing(false);
    setRowError(null);
  };

  const saveEdit = async () => {
    setSaving(true);
    const err = await onUpdate(season.id, editName.trim() || null, editStart || null, editEnd || null);
    setSaving(false);
    setRowError(err);
    if (!err) setEditing(false);
  };

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '50px 1fr 100px 100px 90px 1fr',
      gap: 8, padding: '10px 14px', alignItems: 'center',
      borderBottom: '1px solid rgba(255,255,255,0.04)',
    }}>
      <div style={{ fontSize: 12, color: tokens.text, fontWeight: 700 }}>#{season.number ?? '—'}</div>

      {editing ? (
        <input value={editName} onChange={e => setEditName(e.target.value)} style={editInputStyle} disabled={saving} />
      ) : (
        <div style={{ fontSize: 12, color: tokens.text, fontWeight: 600 }}>{season.name}</div>
      )}

      {editing ? (
        <input type="date" value={editStart} onChange={e => setEditStart(e.target.value)} style={editInputStyle} disabled={saving} />
      ) : (
        <div style={{ fontSize: 11, color: tokens.textDim }}>{fmtDate(season.start_date)}</div>
      )}

      {editing ? (
        <input type="date" value={editEnd} onChange={e => setEditEnd(e.target.value)} style={editInputStyle} disabled={saving} />
      ) : (
        <div style={{ fontSize: 11, color: tokens.textDim }}>{fmtDate(season.end_date)}</div>
      )}

      <div><span style={statusChip(season.status)}>{season.status}</span></div>

      {editing ? (
        <div style={{ display: 'flex', gap: 6 }}>
          <button style={controlButton(false, saving)} disabled={saving} onClick={saveEdit}>
            {saving ? 'Saving…' : 'Save'}
          </button>
          <button style={controlButton(false, saving)} disabled={saving} onClick={cancelEdit}>Cancel</button>
        </div>
      ) : isActive ? (
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
        </div>
      ) : isUpcoming ? (
        <button style={controlButton(false, saving)} disabled={saving} onClick={startEdit}>Edit</button>
      ) : (
        <div style={{ fontSize: 12, color: tokens.textMuted }}>{season.reward_skin_name ?? '—'}</div>
      )}

      {rowError && (
        <div style={{ gridColumn: '1 / -1', fontSize: 10, color: tokens.loss, marginTop: 2 }}>{rowError}</div>
      )}
    </div>
  );
};

interface RankedControlsProps {
  rankedEnabled: boolean | null;
  activeSeasonNumber: number | null;
  onToggle: (next: boolean) => Promise<string | null>;
  onEndSeason: (expectedNumber: number) => Promise<string | null>;
}

const controlButton = (danger: boolean, disabled: boolean): React.CSSProperties => ({
  padding: '6px 14px', borderRadius: 6, fontSize: 12, fontWeight: 700,
  fontFamily: tokens.font, cursor: disabled ? 'wait' : 'pointer',
  background: danger ? 'rgba(229,62,62,0.14)' : 'rgba(255,255,255,0.06)',
  border: `1px solid ${danger ? 'rgba(229,62,62,0.4)' : 'rgba(255,255,255,0.14)'}`,
  color: danger ? tokens.loss : tokens.text,
  opacity: disabled ? 0.6 : 1,
});

const RankedControls: React.FC<RankedControlsProps> = ({
  rankedEnabled, activeSeasonNumber, onToggle, onEndSeason,
}) => {
  const [busy, setBusy] = useState(false);
  const [ctrlError, setCtrlError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [confirmInput, setConfirmInput] = useState('');

  const confirmMatches =
    activeSeasonNumber !== null && confirmInput.trim() === String(activeSeasonNumber);

  const runToggle = async () => {
    setBusy(true);
    setCtrlError(await onToggle(!rankedEnabled));
    setBusy(false);
  };

  const runEndSeason = async () => {
    if (activeSeasonNumber === null) return;
    setBusy(true);
    const err = await onEndSeason(activeSeasonNumber);
    setBusy(false);
    setCtrlError(err);
    if (!err) { setConfirming(false); setConfirmInput(''); }
  };

  return (
    <div style={{
      flexShrink: 0, marginBottom: 16, padding: '12px 14px', borderRadius: 8,
      background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
      display: 'flex', flexDirection: 'column', gap: 12,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: tokens.text }}>Ranked queue</span>
        {rankedEnabled === null ? (
          <span style={{ fontSize: 10, color: tokens.loss, fontWeight: 600 }}>
            Status unavailable — reload to retry
          </span>
        ) : (
          <>
            <span style={{
              display: 'inline-flex', padding: '3px 10px', borderRadius: tokens.rPill,
              background: `${rankedEnabled ? tokens.win : tokens.loss}22`,
              color: rankedEnabled ? tokens.win : tokens.loss,
              fontSize: 10, fontWeight: 700, letterSpacing: 0.6,
            }}>
              {rankedEnabled ? 'ON' : 'OFF'}
            </span>
            <button style={controlButton(rankedEnabled, busy)} disabled={busy} onClick={runToggle}>
              {rankedEnabled ? 'Turn off' : 'Turn on'}
            </button>
            <span style={{ fontSize: 10, color: tokens.textMuted }}>
              OFF blocks new ranked matches; games in progress still count.
            </span>
          </>
        )}
      </div>

      {activeSeasonNumber !== null && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {!confirming ? (
            <button style={controlButton(true, busy)} disabled={busy} onClick={() => setConfirming(true)}>
              End season now
            </button>
          ) : (
            <>
              <span style={{ fontSize: 11, color: tokens.loss, fontWeight: 600 }}>
                This ends Season {activeSeasonNumber}, grants rewards, and soft-resets all
                ratings. Type the season number to confirm.
              </span>
              <input
                value={confirmInput}
                onChange={e => setConfirmInput(e.target.value)}
                inputMode="numeric"
                style={{
                  width: 60, background: tokens.bgCard, color: tokens.text,
                  border: '1px solid rgba(255,255,255,0.12)', borderRadius: 6,
                  padding: '5px 8px', fontSize: 12, fontFamily: tokens.font, outline: 'none',
                }}
              />
              <button
                style={controlButton(true, busy || !confirmMatches)}
                disabled={busy || !confirmMatches}
                onClick={runEndSeason}
              >
                {busy ? 'Ending…' : 'Confirm'}
              </button>
              <button
                style={controlButton(false, busy)}
                disabled={busy}
                onClick={() => { setConfirming(false); setConfirmInput(''); setCtrlError(null); }}
              >
                Cancel
              </button>
            </>
          )}
        </div>
      )}

      {ctrlError && (
        <div style={{ fontSize: 10, color: tokens.loss }}>{ctrlError}</div>
      )}
    </div>
  );
};

const CreateSeasonControl: React.FC<{
  hasActiveSeason: boolean;
  onCreate: (name: string | null, startDate: string | null, endDate: string | null) => Promise<string | null>;
}> = ({ hasActiveSeason, onCreate }) => {
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inputStyle: React.CSSProperties = {
    background: tokens.bgCard, color: tokens.text,
    border: '1px solid rgba(255,255,255,0.12)', borderRadius: 6,
    padding: '5px 8px', fontSize: 12, fontFamily: tokens.font, outline: 'none',
    colorScheme: 'dark',
  };

  const run = async () => {
    setBusy(true);
    const err = await onCreate(name.trim() || null, startDate || null, endDate || null);
    setBusy(false);
    setError(err);
    if (!err) { setName(''); setStartDate(''); setEndDate(''); }
  };

  return (
    <div style={{
      flexShrink: 0, marginBottom: 16, padding: '12px 14px', borderRadius: 8,
      background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
      display: 'flex', flexDirection: 'column', gap: 10,
    }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: tokens.text }}>
        {hasActiveSeason
          ? 'Schedule the next season — pick a future start date'
          : 'No active season — create one to start ranked play'}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Name (auto-numbered if blank)"
          style={{ ...inputStyle, width: 220 }}
        />
        <input
          type="date"
          value={startDate}
          onChange={e => setStartDate(e.target.value)}
          title={hasActiveSeason ? 'Start date (required — must be in the future)' : 'Start date (defaults to today if blank)'}
          style={{ ...inputStyle, width: 150 }}
        />
        <input
          type="date"
          value={endDate}
          onChange={e => setEndDate(e.target.value)}
          title="End date (defaults to one month after start if blank)"
          style={{ ...inputStyle, width: 150 }}
        />
        <button style={controlButton(false, busy)} disabled={busy} onClick={run}>
          {busy ? 'Creating…' : hasActiveSeason ? 'Schedule season' : 'Create season'}
        </button>
      </div>
      {error && <div style={{ fontSize: 10, color: tokens.loss }}>{error}</div>}
    </div>
  );
};

const SeasonsManager: React.FC = () => {
  const {
    seasons, skins, rankedEnabled, loading, error,
    setSeasonReward, setRankedEnabled, endSeason, createSeason, updateSeason,
  } = useAdminSeasons();

  const activeSeason = seasons.find(s => s.status === 'active');
  const upcomingSeason = seasons.find(s => s.status === 'upcoming');
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

      {!loading && !upcomingSeason && (
        <CreateSeasonControl hasActiveSeason={!!activeSeason} onCreate={createSeason} />
      )}

      {!loading && (
        <RankedControls
          rankedEnabled={rankedEnabled}
          activeSeasonNumber={activeSeason?.number ?? null}
          onToggle={setRankedEnabled}
          onEndSeason={endSeason}
        />
      )}

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
              <SeasonRow key={s.id} season={s} skins={skins} onSetReward={setSeasonReward} onUpdate={updateSeason} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SeasonsManager;
