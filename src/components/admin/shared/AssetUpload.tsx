import React, { useRef, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { tokens } from '../../../styles/tokens';

interface Props {
  value: string;
  onChange: (url: string) => void;
  accept?: string;
  hint?: string;
  label?: string;
}

export const AssetUpload: React.FC<Props> = ({
  value, onChange,
  accept = '.svg,.png,.json',
  hint = 'Drop SVG / PNG / JSON here, or click to browse',
  label = 'Asset',
}) => {
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
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: tokens.textMuted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.8 }}>{label}</div>

      {value ? (
        <div style={{
          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 8, padding: 14, display: 'flex', alignItems: 'center', gap: 14,
        }}>
          <img
            src={value} alt="preview"
            style={{ width: 64, height: 64, objectFit: 'contain', borderRadius: 6, background: 'rgba(255,255,255,0.06)' }}
            onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0.3'; }}
          />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, color: tokens.text, fontWeight: 600, marginBottom: 8 }}>Image uploaded</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                style={{
                  fontSize: 11, fontWeight: 700, color: tokens.accent, cursor: 'pointer',
                  background: 'rgba(0,212,170,0.1)', border: `1px solid rgba(0,212,170,0.3)`,
                  padding: '4px 10px', borderRadius: 4, fontFamily: tokens.font,
                }}
              >
                {uploading ? 'Uploading…' : 'Replace'}
              </button>
              <button
                type="button"
                onClick={() => onChange('')}
                style={{
                  fontSize: 11, fontWeight: 700, color: tokens.textMuted, cursor: 'pointer',
                  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                  padding: '4px 10px', borderRadius: 4, fontFamily: tokens.font,
                }}
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div
          style={{
            border: '2px dashed rgba(255,255,255,0.15)', borderRadius: 8,
            padding: '20px 12px', textAlign: 'center', cursor: 'pointer',
          }}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
        >
          <div style={{ fontSize: 13, color: uploading ? tokens.accent : tokens.textMuted, fontWeight: 600 }}>
            {uploading ? 'Uploading…' : hint}
          </div>
          <div style={{ fontSize: 11, color: tokens.textDim, marginTop: 4 }}>Max 2MB</div>
        </div>
      )}

      <input ref={inputRef} type="file" accept={accept} style={{ display: 'none' }}
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />

      {uploadError && (
        <div style={{ fontSize: 12, color: tokens.loss, marginTop: 6 }}>{uploadError}</div>
      )}
    </div>
  );
};
