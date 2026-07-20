import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { tokens } from '../../styles/tokens';
import { Modal } from '../modal';
import { linkifyContent } from '../../lib/linkify';
import { NEWS_ICON_COMPONENTS, NewsIconPreset, LinkIcon } from '../../lib/newsIcons';

interface NewsImage { image_url: string; sort_order: number; }
interface NewsLink { icon_key: string | null; custom_icon_url: string | null; url: string; sort_order: number; }

interface NewsPost {
  id: string;
  title: string;
  content: string;
  category: string;
  image_url: string | null;
  published_at: string;
  news_images: NewsImage[];
  news_links: NewsLink[];
}

const categoryColour: Record<string, string> = {
  update: '#00d4aa', patch: '#4299e1', season: '#ffd700', tournament: '#ff6b35'
};

const LinkChip: React.FC<{ link: NewsLink }> = ({ link }) => {
  const Preset = link.icon_key ? NEWS_ICON_COMPONENTS[link.icon_key as NewsIconPreset] : null;
  return (
    <a
      href={link.url} target="_blank" rel="noopener noreferrer"
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: 40, height: 40, borderRadius: '50%',
        background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
        color: tokens.text, flexShrink: 0,
      }}
      title={link.url}
    >
      {link.custom_icon_url ? (
        <img src={link.custom_icon_url} alt="" style={{ width: 20, height: 20, objectFit: 'contain' }} />
      ) : Preset ? (
        <Preset size={18} />
      ) : (
        <LinkIcon size={18} />
      )}
    </a>
  );
};

const ArticleModal: React.FC<{ post: NewsPost; onClose: () => void }> = ({ post, onClose }) => {
  const images = post.news_images.slice().sort((a, b) => a.sort_order - b.sort_order);
  const links = post.news_links.slice().sort((a, b) => a.sort_order - b.sort_order);

  return (
    <Modal isOpen onClose={onClose} title={post.title}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, textAlign: 'left' as const }}>
        {post.image_url && (
          <img src={post.image_url} alt="" style={{ width: '100%', borderRadius: 10, objectFit: 'cover', maxHeight: 220 }} />
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ background: categoryColour[post.category] ?? '#a0aec0', color: '#1a2332', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700, textTransform: 'uppercase' as const }}>
            {post.category}
          </span>
          <span style={{ color: '#a0aec0', fontSize: 12 }}>{new Date(post.published_at).toLocaleDateString()}</span>
        </div>

        <div style={{ color: '#e2e8f0', fontSize: 14, lineHeight: 1.6 }}>
          {linkifyContent(post.content, tokens.accent)}
        </div>

        {images.length > 0 && (
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
            {images.map((img, i) => (
              <img key={i} src={img.image_url} alt="" style={{ width: 140, height: 100, objectFit: 'cover', borderRadius: 8, flexShrink: 0 }} />
            ))}
          </div>
        )}

        {links.length > 0 && (
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' as const, paddingTop: 4 }}>
            {links.map((l, i) => <LinkChip key={i} link={l} />)}
          </div>
        )}
      </div>
    </Modal>
  );
};

const NewsSlideshow: React.FC = () => {
  const [posts, setPosts] = useState<NewsPost[]>([]);
  const [index, setIndex] = useState(0);
  const [openPost, setOpenPost] = useState<NewsPost | null>(null);

  useEffect(() => {
    supabase.from('news_posts').select('*, news_images(*), news_links(*)').order('published_at', { ascending: false }).limit(5)
      .then(({ data }) => setPosts((data as NewsPost[]) ?? []));
  }, []);

  useEffect(() => {
    if (posts.length < 2 || openPost) return;
    const timer = setInterval(() => setIndex(i => (i + 1) % posts.length), 5000);
    return () => clearInterval(timer);
  }, [posts, openPost]);

  if (posts.length === 0) return <div style={{ color: '#a0aec0', fontSize: '14px', padding: '16px' }}>No news yet.</div>;

  const post = posts[index];
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <button onClick={() => setIndex(i => (i - 1 + posts.length) % posts.length)}
          style={{ background: 'none', border: 'none', color: '#a0aec0', cursor: 'pointer', fontSize: '20px', flexShrink: 0 }}>◀</button>

        <button
          onClick={() => setOpenPost(post)}
          style={{
            flex: 1, display: 'flex', alignItems: 'center', gap: 12, minWidth: 0,
            background: 'none', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'left' as const,
          }}
        >
          {post.image_url ? (
            <img src={post.image_url} alt="" style={{ width: 52, height: 52, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
          ) : (
            <div style={{ width: 52, height: 52, borderRadius: 8, flexShrink: 0, background: 'rgba(255,255,255,0.06)' }} />
          )}
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
              <span style={{ background: categoryColour[post.category] ?? '#a0aec0', color: '#1a2332', padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }}>
                {post.category}
              </span>
            </div>
            <div style={{ fontWeight: 'bold', color: tokens.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{post.title}</div>
          </div>
        </button>

        <button onClick={() => setIndex(i => (i + 1) % posts.length)}
          style={{ background: 'none', border: 'none', color: '#a0aec0', cursor: 'pointer', fontSize: '20px', flexShrink: 0 }}>▶</button>
        <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
          {posts.map((_, i) => (
            <div key={i} onClick={() => setIndex(i)}
              style={{ width: '6px', height: '6px', borderRadius: '50%', background: i === index ? '#00d4aa' : '#3a4a5a', cursor: 'pointer' }} />
          ))}
        </div>
      </div>

      {openPost && <ArticleModal post={openPost} onClose={() => setOpenPost(null)} />}
    </>
  );
};

export default NewsSlideshow;
