import React, { useState, useEffect } from 'react';
import {
  useAdminNews, AdminNewsPost, NewsPostInput, NewsCategory, NewsImage, NewsLink,
} from '../../hooks/useAdminNews';
import { NEWS_ICON_PRESETS, NEWS_ICON_LABELS, NEWS_ICON_COMPONENTS, NewsIconPreset } from '../../lib/newsIcons';
import { tokens } from '../../styles/tokens';
import Glass from '../common/Glass';
import PrimaryButton from '../common/PrimaryButton';
import SecondaryButton from '../common/SecondaryButton';
import { AssetUpload } from './shared/AssetUpload';

const CATEGORIES: NewsCategory[] = ['update', 'patch', 'season', 'tournament'];

const categoryColour: Record<NewsCategory, string> = {
  update: tokens.accent, patch: '#4299e1', season: tokens.credits, tournament: '#ff6b35',
};

const inputStyle: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box',
  background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 6, padding: '8px 10px', fontSize: 13, color: tokens.text,
  fontFamily: tokens.font, outline: 'none',
};

const selectStyle: React.CSSProperties = { ...inputStyle, colorScheme: 'dark', background: tokens.bgCard };

const field = (label: string, children: React.ReactNode) => (
  <div style={{ marginBottom: 14 }}>
    <div style={{ fontSize: 11, fontWeight: 700, color: tokens.textMuted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.8 }}>
      {label}
    </div>
    {children}
  </div>
);

const removeBtn: React.CSSProperties = {
  fontSize: 11, fontWeight: 700, color: tokens.loss, cursor: 'pointer',
  background: 'rgba(255,107,107,0.1)', border: '1px solid rgba(255,107,107,0.3)',
  padding: '4px 10px', borderRadius: 4, fontFamily: tokens.font, flexShrink: 0,
};

const addBtn: React.CSSProperties = {
  fontSize: 12, fontWeight: 700, color: tokens.accent, cursor: 'pointer',
  background: 'rgba(0,212,170,0.1)', border: `1px solid ${tokens.accent}55`,
  padding: '6px 12px', borderRadius: 6, fontFamily: tokens.font,
};

// ── Gallery images sub-editor ───────────────────────────────────

const GalleryEditor: React.FC<{ images: NewsImage[]; onChange: (imgs: NewsImage[]) => void }> = ({ images, onChange }) => {
  const setImage = (i: number, url: string) => {
    const next = images.slice();
    next[i] = { ...next[i], image_url: url };
    onChange(next);
  };
  const remove = (i: number) => onChange(images.filter((_, idx) => idx !== i));
  const add = () => onChange([...images, { image_url: '', sort_order: images.length }]);

  return (
    <div>
      {images.map((img, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 10 }}>
          <div style={{ flex: 1 }}>
            <AssetUpload
              value={img.image_url}
              onChange={url => setImage(i, url)}
              accept=".jpg,.jpeg,.png,.webp"
              hint="Drop JPG / PNG / WEBP here, or click to browse"
            />
          </div>
          <button type="button" style={{ ...removeBtn, marginTop: 4 }} onClick={() => remove(i)}>Remove</button>
        </div>
      ))}
      <button type="button" style={addBtn} onClick={add}>+ Add gallery image</button>
    </div>
  );
};

// ── Icon-links sub-editor ───────────────────────────────────────

const LinkEditor: React.FC<{ links: NewsLink[]; onChange: (links: NewsLink[]) => void }> = ({ links, onChange }) => {
  const setLink = (i: number, patch: Partial<NewsLink>) => {
    const next = links.slice();
    next[i] = { ...next[i], ...patch };
    onChange(next);
  };
  const remove = (i: number) => onChange(links.filter((_, idx) => idx !== i));
  const add = () => onChange([...links, { icon_key: NEWS_ICON_PRESETS[0], custom_icon_url: null, url: '', sort_order: links.length }]);

  return (
    <div>
      {links.map((link, i) => (
        <div key={i} style={{
          border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: 12, marginBottom: 10,
        }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: tokens.text,
            }}>
              {link.icon_key ? React.createElement(NEWS_ICON_COMPONENTS[link.icon_key as NewsIconPreset], { size: 16 }) : null}
              {!link.icon_key && link.custom_icon_url && (
                <img src={link.custom_icon_url} alt="" style={{ width: 16, height: 16, objectFit: 'contain' }} />
              )}
            </div>
            <select
              value={link.custom_icon_url ? 'custom' : (link.icon_key ?? NEWS_ICON_PRESETS[0])}
              onChange={e => {
                const val = e.target.value;
                if (val === 'custom') setLink(i, { icon_key: null });
                else setLink(i, { icon_key: val as NewsIconPreset, custom_icon_url: null });
              }}
              style={{ ...selectStyle, width: 160, flexShrink: 0 }}
            >
              {NEWS_ICON_PRESETS.map(k => (
                <option key={k} value={k} style={{ background: tokens.bgCard, color: tokens.text }}>{NEWS_ICON_LABELS[k]}</option>
              ))}
              <option value="custom" style={{ background: tokens.bgCard, color: tokens.text }}>Custom logo…</option>
            </select>
            <input
              value={link.url}
              onChange={e => setLink(i, { url: e.target.value })}
              placeholder="https://…"
              style={inputStyle}
            />
            <button type="button" style={removeBtn} onClick={() => remove(i)}>Remove</button>
          </div>
          {link.custom_icon_url !== null || (!link.icon_key) ? (
            <AssetUpload
              value={link.custom_icon_url ?? ''}
              onChange={url => setLink(i, { custom_icon_url: url || null })}
              accept=".svg,.png,.jpg,.jpeg,.webp"
              hint="Drop a small logo image, or click to browse"
            />
          ) : null}
        </div>
      ))}
      <button type="button" style={addBtn} onClick={add}>+ Add link</button>
    </div>
  );
};

// ── Post modal ───────────────────────────────────────────────────

interface ModalProps {
  post: AdminNewsPost | null;
  onSave: (input: NewsPostInput) => Promise<string | null>;
  onClose: () => void;
}

const emptyInput = (): NewsPostInput => ({
  title: '', content: '', category: 'update', image_url: null, images: [], links: [],
});

const NewsPostModal: React.FC<ModalProps> = ({ post, onSave, onClose }) => {
  const [form, setForm] = useState<NewsPostInput>(emptyInput());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (post) {
      setForm({
        title: post.title,
        content: post.content,
        category: post.category,
        image_url: post.image_url,
        images: post.images.map(i => ({ image_url: i.image_url, sort_order: i.sort_order })),
        links: post.links.map(l => ({ icon_key: l.icon_key, custom_icon_url: l.custom_icon_url, url: l.url, sort_order: l.sort_order })),
      });
    } else {
      setForm(emptyInput());
    }
    setError(null);
  }, [post]);

  const handleSave = async () => {
    if (!form.title.trim())   { setError('Title is required.'); return; }
    if (!form.content.trim()) { setError('Content is required.'); return; }
    if (form.links.some(l => !l.url.trim())) { setError('Every link needs a URL (or remove it).'); return; }
    setSaving(true);
    const err = await onSave(form);
    setSaving(false);
    if (err) { setError(err); return; }
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 300,
        background: 'rgba(6,13,31,0.80)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
      }}
      onClick={saving ? undefined : onClose}
    >
      <Glass style={{ maxWidth: 640, width: '100%', padding: 0 }}>
        <div
          style={{ padding: 24, fontFamily: tokens.font, maxHeight: 'calc(100vh - 48px)', overflowY: 'auto' }}
          onClick={e => e.stopPropagation()}
        >
          <div style={{ fontSize: 16, fontWeight: 800, color: tokens.text, marginBottom: 20 }}>
            {post ? `Edit — ${post.title}` : 'New Article'}
          </div>

          {field('Title',
            <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              style={inputStyle} placeholder="Headline" />
          )}
          {field('Category',
            <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value as NewsCategory }))}
              style={selectStyle}>
              {CATEGORIES.map(c => (
                <option key={c} value={c} style={{ background: tokens.bgCard, color: tokens.text }}>{c}</option>
              ))}
            </select>
          )}
          {field('Content',
            <textarea
              value={form.content}
              onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
              placeholder="Article text — line breaks become paragraphs, URLs become clickable links automatically."
              rows={8}
              style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }}
            />
          )}
          {field('Banner image (optional)',
            <AssetUpload
              value={form.image_url ?? ''}
              onChange={url => setForm(f => ({ ...f, image_url: url || null }))}
              accept=".jpg,.jpeg,.png,.webp"
              hint="Drop JPG / PNG / WEBP here, or click to browse"
            />
          )}
          {field('Gallery images (optional)',
            <GalleryEditor images={form.images} onChange={images => setForm(f => ({ ...f, images }))} />
          )}
          {field('Icon links (optional)',
            <LinkEditor links={form.links} onChange={links => setForm(f => ({ ...f, links }))} />
          )}

          {error && (
            <div style={{ marginTop: 4, marginBottom: 14, padding: '8px 12px', borderRadius: 6, background: 'rgba(229,62,62,0.12)', color: tokens.loss, fontSize: 12 }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <SecondaryButton onClick={onClose} disabled={saving} style={{ flex: 1 }}>Cancel</SecondaryButton>
            <PrimaryButton onClick={handleSave} disabled={saving} style={{ flex: 1 }}>
              {saving ? 'Saving…' : 'Save'}
            </PrimaryButton>
          </div>
        </div>
      </Glass>
    </div>
  );
};

// ── Main manager ──────────────────────────────────────────────────

const NewsManager: React.FC = () => {
  const { posts, loading, error, createPost, updatePost, deletePost } = useAdminNews();
  const [modalTarget, setModalTarget] = useState<AdminNewsPost | null | undefined>(undefined);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleSave = async (input: NewsPostInput): Promise<string | null> => {
    if (modalTarget === null) return createPost(input);
    if (modalTarget)          return updatePost(modalTarget.id, input);
    return null;
  };

  const handleDelete = async (id: string) => {
    setDeleting(true);
    await deletePost(id);
    setDeleting(false);
    setConfirmDelete(null);
  };

  const fmtDate = (iso: string) => {
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString();
  };

  return (
    <div style={{ fontFamily: tokens.font, display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 800, color: tokens.text }}>News</div>
          <div style={{ fontSize: 11, color: tokens.textMuted, marginTop: 2 }}>
            {posts.length} article{posts.length !== 1 ? 's' : ''}
          </div>
        </div>
        <button onClick={() => setModalTarget(null)} style={{
          background: 'rgba(0,212,170,0.18)', border: `1px solid ${tokens.accent}`,
          borderRadius: 20, padding: '6px 16px', fontSize: 12, fontWeight: 800,
          color: tokens.accent, cursor: 'pointer', fontFamily: tokens.font,
        }}>
          + New Article
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
        {loading && <div style={{ color: tokens.textMuted, fontSize: 13, padding: '40px 0', textAlign: 'center' }}>Loading…</div>}
        {!loading && error && (
          <div style={{ padding: '12px 16px', borderRadius: 8, background: 'rgba(229,62,62,0.12)', color: tokens.loss, fontSize: 13 }}>
            {error}
          </div>
        )}
        {!loading && !error && posts.length === 0 && (
          <div style={{ color: tokens.textMuted, fontSize: 13, padding: '40px 0', textAlign: 'center' }}>
            No articles yet.
          </div>
        )}

        {!loading && !error && posts.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
            {posts.map(p => (
              <div key={p.id} style={{
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)',
                borderRadius: 10, overflow: 'hidden', display: 'flex', flexDirection: 'column',
              }}>
                {p.image_url ? (
                  <div style={{ height: 110, overflow: 'hidden' }}>
                    <img src={p.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                ) : (
                  <div style={{ height: 110, background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: tokens.textDim, fontSize: 11 }}>
                    No banner
                  </div>
                )}
                <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{
                      fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5,
                      color: categoryColour[p.category], background: `${categoryColour[p.category]}22`,
                      padding: '2px 8px', borderRadius: 20,
                    }}>
                      {p.category}
                    </span>
                    <span style={{ fontSize: 11, color: tokens.textDim }}>{fmtDate(p.published_at)}</span>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: tokens.text }}>{p.title}</div>
                  <div style={{ fontSize: 12, color: tokens.textMuted, lineHeight: 1.4, flex: 1 }}>
                    {p.content.slice(0, 100)}{p.content.length > 100 ? '…' : ''}
                  </div>
                  <div style={{ fontSize: 10, color: tokens.textDim }}>
                    {p.images.length > 0 && `${p.images.length} gallery image${p.images.length !== 1 ? 's' : ''}`}
                    {p.images.length > 0 && p.links.length > 0 && ' · '}
                    {p.links.length > 0 && `${p.links.length} link${p.links.length !== 1 ? 's' : ''}`}
                  </div>

                  {confirmDelete === p.id ? (
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        onClick={() => handleDelete(p.id)}
                        disabled={deleting}
                        style={{ ...removeBtn, flex: 1, textAlign: 'center' as const }}
                      >
                        {deleting ? 'Deleting…' : 'Confirm delete'}
                      </button>
                      <button
                        onClick={() => setConfirmDelete(null)}
                        disabled={deleting}
                        style={{ flex: 1, fontSize: 11, fontWeight: 700, color: tokens.textMuted, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '6px 0', borderRadius: 5, cursor: 'pointer', fontFamily: tokens.font }}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => setModalTarget(p)} style={{
                        flex: 1, fontSize: 11, fontWeight: 700, color: tokens.accent,
                        background: 'rgba(0,212,170,0.1)', border: 'none',
                        padding: '6px 0', borderRadius: 5, cursor: 'pointer', fontFamily: tokens.font,
                      }}>
                        Edit
                      </button>
                      <button onClick={() => setConfirmDelete(p.id)} style={{
                        flex: 1, fontSize: 11, fontWeight: 700, color: tokens.loss,
                        background: 'rgba(255,107,107,0.1)', border: 'none',
                        padding: '6px 0', borderRadius: 5, cursor: 'pointer', fontFamily: tokens.font,
                      }}>
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {modalTarget !== undefined && (
        <NewsPostModal
          post={modalTarget}
          onSave={handleSave}
          onClose={() => setModalTarget(undefined)}
        />
      )}
    </div>
  );
};

export default NewsManager;
