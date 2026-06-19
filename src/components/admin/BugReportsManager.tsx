import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useAdminBugReports, BugReport, BugReportStatus } from '../../hooks/useAdminBugReports';
import { tokens } from '../../styles/tokens';
import Glass from '../common/Glass';

// ─── Types ────────────────────────────────────────────────────────────────────

type TabKey = 'all' | BugReportStatus;

interface Tab {
  key: TabKey;
  label: string;
}

const TABS: Tab[] = [
  { key: 'all',         label: 'All'         },
  { key: 'open',        label: 'Open'        },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'resolved',    label: 'Resolved'    },
  { key: 'dismissed',   label: 'Dismissed'   },
];

// ─── Status badge ─────────────────────────────────────────────────────────────

const STATUS_COLOURS: Record<BugReportStatus, { bg: string; text: string }> = {
  open:        { bg: 'rgba(229,62,62,0.18)',   text: '#ff6b6b' },
  in_progress: { bg: 'rgba(249,168,37,0.18)',  text: '#f9a825' },
  resolved:    { bg: 'rgba(0,212,170,0.18)',   text: '#00d4aa' },
  dismissed:   { bg: 'rgba(160,174,192,0.18)', text: '#a0aec0' },
};

const STATUS_LABELS: Record<BugReportStatus, string> = {
  open:        'Open',
  in_progress: 'In Progress',
  resolved:    'Resolved',
  dismissed:   'Dismissed',
};

const StatusBadge: React.FC<{ status: BugReportStatus }> = ({ status }) => {
  const colours = STATUS_COLOURS[status];
  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 10px',
      borderRadius: tokens.rPill,
      fontSize: 11,
      fontWeight: 700,
      background: colours.bg,
      color: colours.text,
      whiteSpace: 'nowrap',
    }}>
      {STATUS_LABELS[status]}
    </span>
  );
};

// ─── Detail panel ─────────────────────────────────────────────────────────────

interface DetailPanelProps {
  report: BugReport;
  updateStatus: (id: string, status: BugReportStatus) => Promise<void>;
  updateNotes: (id: string, notes: string) => Promise<void>;
}

const DetailPanel: React.FC<DetailPanelProps> = ({ report, updateStatus, updateNotes }) => {
  const [notes, setNotes] = useState(report.admin_notes ?? '');
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, []);

  const handleNotesChange = useCallback((value: string) => {
    setNotes(value);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      updateNotes(report.id, value);
    }, 500);
  }, [report.id, updateNotes]);

  const ctx = report.context ?? {};
  const userAgent = typeof ctx.user_agent === 'string' ? ctx.user_agent.slice(0, 60) : null;
  const page      = typeof ctx.page    === 'string' ? ctx.page    : null;
  const screen    = typeof ctx.screen  === 'string' ? ctx.screen  : null;
  const gameId    = typeof ctx.game_id === 'string' ? ctx.game_id : null;
  const recentErrors = Array.isArray(ctx.recent_errors) && ctx.recent_errors.length > 0
    ? ctx.recent_errors as string[]
    : null;
  const gameState = ctx.game_state && typeof ctx.game_state === 'object'
    ? ctx.game_state as Record<string, unknown>
    : null;

  const inputStyle: React.CSSProperties = {
    width: '100%',
    boxSizing: 'border-box',
    background: 'rgba(255,255,255,0.07)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 6,
    padding: '8px 10px',
    fontSize: 13,
    color: tokens.text,
    fontFamily: tokens.font,
    outline: 'none',
    colorScheme: 'dark',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 11,
    fontWeight: 700,
    color: tokens.textMuted,
    marginBottom: 5,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  };

  const sectionStyle: React.CSSProperties = {
    marginBottom: 16,
  };

  return (
    <Glass style={{ marginTop: 4, borderRadius: 10 }} padding="18px 20px">
      <div style={{ fontFamily: tokens.font }}>

        {/* Title / description / category */}
        <div style={sectionStyle}>
          <div style={{ fontSize: 15, fontWeight: 800, color: tokens.text, marginBottom: 4 }}>
            {report.title}
          </div>
          <div style={{
            display: 'inline-block',
            padding: '2px 8px',
            borderRadius: tokens.rPill,
            fontSize: 11,
            fontWeight: 700,
            background: 'rgba(255,255,255,0.07)',
            color: tokens.textMuted,
            marginBottom: 8,
          }}>
            {report.category}
          </div>
          <div style={{ fontSize: 13, color: tokens.textMuted, lineHeight: 1.6 }}>
            {report.description}
          </div>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.07)', margin: '14px 0' }} />

        {/* Context breakdown */}
        <div style={{ ...sectionStyle, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 20px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: tokens.textMuted, gridColumn: '1 / -1', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 }}>
            Context
          </div>
          {page && (
            <div>
              <div style={labelStyle}>Page</div>
              <div style={{ fontSize: 12, color: tokens.text }}>{page}</div>
            </div>
          )}
          {screen && (
            <div>
              <div style={labelStyle}>Screen</div>
              <div style={{ fontSize: 12, color: tokens.text }}>{screen}</div>
            </div>
          )}
          {gameId && (
            <div>
              <div style={labelStyle}>Game ID</div>
              <div style={{ fontSize: 12, color: tokens.text, wordBreak: 'break-all' }}>{gameId}</div>
            </div>
          )}
          {userAgent && (
            <div>
              <div style={labelStyle}>Browser</div>
              <div style={{ fontSize: 12, color: tokens.text }}>{userAgent}</div>
            </div>
          )}
        </div>

        {/* Recent errors */}
        {recentErrors && (
          <div style={sectionStyle}>
            <div style={labelStyle}>Recent Errors</div>
            <div style={{
              background: 'rgba(229,62,62,0.07)',
              border: '1px solid rgba(229,62,62,0.15)',
              borderRadius: 6,
              padding: '8px 12px',
            }}>
              {recentErrors.map((err, i) => (
                <div key={i} style={{ fontSize: 12, color: tokens.loss, fontFamily: 'monospace', marginBottom: i < recentErrors.length - 1 ? 4 : 0 }}>
                  {String(err)}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Game state */}
        {gameState && (
          <div style={sectionStyle}>
            <div style={labelStyle}>Game State</div>
            <div style={{
              display: 'flex',
              gap: 16,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 6,
              padding: '8px 12px',
            }}>
              {gameState.currentPlayer !== undefined && (
                <div style={{ fontSize: 12, color: tokens.textMuted }}>
                  Current player: <span style={{ color: tokens.text, fontWeight: 700 }}>{String(gameState.currentPlayer)}</span>
                </div>
              )}
              {gameState.macroBoard !== undefined && (
                <div style={{ fontSize: 12, color: tokens.textMuted }}>
                  Macro winner cells:{' '}
                  <span style={{ color: tokens.text, fontWeight: 700 }}>
                    {Array.isArray(gameState.macroBoard)
                      ? (gameState.macroBoard as unknown[]).filter(Boolean).length
                      : '–'}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.07)', margin: '14px 0' }} />

        {/* Admin controls */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 16, alignItems: 'start' }}>
          <div>
            <div style={labelStyle}>Admin Notes</div>
            <textarea
              value={notes}
              onChange={e => handleNotesChange(e.target.value)}
              placeholder="Internal notes visible only to admins…"
              rows={3}
              style={{
                ...inputStyle,
                resize: 'vertical',
                lineHeight: 1.5,
              }}
            />
          </div>
          <div>
            <div style={labelStyle}>Status</div>
            <select
              value={report.status}
              onChange={e => updateStatus(report.id, e.target.value as BugReportStatus)}
              style={{
                ...inputStyle,
                width: 'auto',
                minWidth: 130,
                background: tokens.bgCard,
              }}
            >
              {(['open', 'in_progress', 'resolved', 'dismissed'] as BugReportStatus[]).map(s => (
                <option key={s} value={s} style={{ background: tokens.bgCard, color: tokens.text }}>
                  {STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </div>
        </div>

      </div>
    </Glass>
  );
};

// ─── Report row ───────────────────────────────────────────────────────────────

interface ReportRowProps {
  report: BugReport;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

const ReportRow: React.FC<ReportRowProps> = ({ report, isSelected, onSelect }) => {
  const username = report.profiles?.username ?? report.user_id;
  const date = new Date(report.created_at).toLocaleDateString();

  return (
    <div
      onClick={() => onSelect(report.id)}
      style={{
        display: 'grid',
        gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr',
        gap: 12,
        alignItems: 'center',
        padding: '10px 14px',
        borderRadius: isSelected ? '8px 8px 0 0' : 8,
        cursor: 'pointer',
        background: isSelected
          ? 'rgba(0,212,170,0.08)'
          : 'rgba(255,255,255,0.03)',
        border: isSelected
          ? `1px solid rgba(0,212,170,0.25)`
          : '1px solid rgba(255,255,255,0.06)',
        borderBottom: isSelected ? 'none' : undefined,
        transition: 'background 0.15s',
        marginBottom: isSelected ? 0 : 4,
      }}
    >
      <div style={{ fontSize: 13, fontWeight: 700, color: tokens.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {report.title}
      </div>
      <div style={{ fontSize: 12, color: tokens.textMuted }}>
        {report.category}
      </div>
      <div style={{ fontSize: 12, color: tokens.textMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {username}
      </div>
      <div style={{ fontSize: 12, color: tokens.textMuted }}>
        {date}
      </div>
      <div>
        <StatusBadge status={report.status} />
      </div>
    </div>
  );
};

// ─── Main manager ─────────────────────────────────────────────────────────────

const BugReportsManager: React.FC = () => {
  const { reports, loading, error, updateStatus, updateNotes } = useAdminBugReports();
  const [activeTab, setActiveTab] = useState<TabKey>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = activeTab === 'all'
    ? reports
    : reports.filter(r => r.status === activeTab);

  const selectedReport = reports.find(r => r.id === selectedId) ?? null;

  const handleSelect = (id: string) => {
    setSelectedId(prev => (prev === id ? null : id));
  };

  return (
    <div style={{ fontFamily: tokens.font, display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>

      {/* Header */}
      <div style={{ flexShrink: 0, marginBottom: 20 }}>
        <div style={{ fontSize: 18, fontWeight: 800, color: tokens.text }}>Bug Reports</div>
        <div style={{ fontSize: 11, color: tokens.textMuted, marginTop: 2 }}>
          {reports.length} report{reports.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Filter tabs */}
      <div style={{ flexShrink: 0, display: 'flex', gap: 4, marginBottom: 16 }}>
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => { setActiveTab(tab.key); setSelectedId(null); }}
            style={{
              padding: '6px 14px',
              borderRadius: tokens.rPill,
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: tokens.font,
              border: activeTab === tab.key
                ? `1px solid ${tokens.accent}`
                : '1px solid rgba(255,255,255,0.10)',
              background: activeTab === tab.key
                ? 'rgba(0,212,170,0.15)'
                : 'rgba(255,255,255,0.04)',
              color: activeTab === tab.key ? tokens.accent : tokens.textMuted,
              transition: 'all 0.15s',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Column headers */}
      {!loading && !error && filtered.length > 0 && (
        <div style={{
          flexShrink: 0,
          display: 'grid',
          gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr',
          gap: 12,
          padding: '0 14px',
          marginBottom: 6,
        }}>
          {['Title', 'Category', 'User', 'Date', 'Status'].map(col => (
            <div key={col} style={{ fontSize: 10, fontWeight: 700, color: tokens.textDim, textTransform: 'uppercase', letterSpacing: 0.8 }}>
              {col}
            </div>
          ))}
        </div>
      )}

      {/* Scrollable list */}
      <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
        {loading && (
          <div style={{ color: tokens.textMuted, fontSize: 13, padding: '40px 0', textAlign: 'center' }}>
            Loading…
          </div>
        )}
        {!loading && error && (
          <div style={{ padding: '12px 16px', borderRadius: 8, background: 'rgba(229,62,62,0.12)', color: tokens.loss, fontSize: 13 }}>
            {error}
          </div>
        )}
        {!loading && !error && filtered.length === 0 && (
          <div style={{ color: tokens.textMuted, fontSize: 13, padding: '40px 0', textAlign: 'center' }}>
            No reports{activeTab !== 'all' ? ` with status "${STATUS_LABELS[activeTab as BugReportStatus]}"` : ''}.
          </div>
        )}

        {!loading && !error && filtered.map(report => (
          <ReportRow
            key={report.id}
            report={report}
            isSelected={selectedId === report.id}
            onSelect={handleSelect}
          />
        ))}

        {selectedReport && (
          <DetailPanel
            key={selectedReport.id}
            report={selectedReport}
            updateStatus={updateStatus}
            updateNotes={updateNotes}
          />
        )}
      </div>

    </div>
  );
};

export default BugReportsManager;
