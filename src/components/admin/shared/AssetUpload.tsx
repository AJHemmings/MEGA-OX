import React, { useRef, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { tokens } from '../../../styles/tokens';

interface Props {
  value: string;
  onChange: (url: string) => void;
}

export const AssetUpload: React.FC<Props> = ({ value, onChange }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    if (file.size > 2 * 1024 * 1024) {
      setUploadError('File too large (max 2MB)');
      return;
    }
    setUploading(true);
    setUploadError(null);
    const ext  = file.name.split('.').pop();
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from('admin-assets').upload(path, file, { upsert: false });
    if (error) { setUploadError(error.message); setUploading(false); return; }
    const { data } = supabase.storage.from('admin-assets').getPublicUrl(path);
    onChange(data.publicUrl);
    setUploading(false);
  };

  return (
    <div>
      <div style={{ fontSize: 9, color: tokens.textMuted, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.8 }}>Asset</div>

      <div
        style={{
          border: `2px dashed ${value ? tokens.accent : 'rgba(255,255,255,0.15)'}`,
          borderRadius: 8, padding: 12, textAlign: 'center',
          cursor: 'pointer', marginBottom: value ? 8 : 0,
          background: value ? 'rgba(0,212,170,0.04)' : 'transparent',
        }}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
      >
        <input ref={inputRef} type="file" accept=".svg,.png,.json" style={{ display: 'none' }}
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
        <div style={{ fontSize: 9, color: uploading ? tokens.accent : tokens.textMuted }}>
          {uploading ? 'Uploading...' : value ? '↑ Upload new file' : '📁 Drop SVG / PNG / JSON or click to browse'}
        </div>
      </div>

      {uploadError && (
        <div style={{ fontSize: 9, color: tokens.loss, marginTop: 4 }}>{uploadError}</div>
      )}

      {value && (
        <div style={{
          marginTop: 8, background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6,
          padding: 8, display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <img
            src={value} alt="preview"
            style={{ width: 40, height: 40, objectFit: 'contain', borderRadius: 4 }}
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
          <div style={{ fontSize: 9, color: tokens.textMuted, wordBreak: 'break-all', flex: 1 }}>{value}</div>
        </div>
      )}
    </div>
  );
};
