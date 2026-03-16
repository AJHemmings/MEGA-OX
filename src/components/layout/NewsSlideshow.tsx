import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

interface NewsPost {
  id: string;
  title: string;
  content: string;
  category: string;
  image_url: string | null;
  published_at: string;
}

const categoryColour: Record<string, string> = {
  update: '#00d4aa', patch: '#4299e1', season: '#ffd700', tournament: '#ff6b35'
};

const NewsSlideshow: React.FC = () => {
  const [posts, setPosts] = useState<NewsPost[]>([]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    supabase.from('news_posts').select('*').order('published_at', { ascending: false }).limit(5)
      .then(({ data }) => setPosts((data as NewsPost[]) ?? []));
  }, []);

  useEffect(() => {
    if (posts.length < 2) return;
    const timer = setInterval(() => setIndex(i => (i + 1) % posts.length), 5000);
    return () => clearInterval(timer);
  }, [posts]);

  if (posts.length === 0) return <div style={{ color: '#a0aec0', fontSize: '14px', padding: '16px' }}>No news yet.</div>;

  const post = posts[index];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
      <button onClick={() => setIndex(i => (i - 1 + posts.length) % posts.length)}
        style={{ background: 'none', border: 'none', color: '#a0aec0', cursor: 'pointer', fontSize: '20px' }}>◀</button>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <span style={{ background: categoryColour[post.category] ?? '#a0aec0', color: '#1a2332', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase' }}>
            {post.category}
          </span>
          <span style={{ color: '#a0aec0', fontSize: '12px' }}>{new Date(post.published_at).toLocaleDateString()}</span>
        </div>
        <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{post.title}</div>
        <div style={{ color: '#a0aec0', fontSize: '14px' }}>{post.content.substring(0, 100)}{post.content.length > 100 ? '...' : ''}</div>
      </div>
      <button onClick={() => setIndex(i => (i + 1) % posts.length)}
        style={{ background: 'none', border: 'none', color: '#a0aec0', cursor: 'pointer', fontSize: '20px' }}>▶</button>
      <div style={{ display: 'flex', gap: '4px' }}>
        {posts.map((_, i) => (
          <div key={i} onClick={() => setIndex(i)}
            style={{ width: '6px', height: '6px', borderRadius: '50%', background: i === index ? '#00d4aa' : '#3a4a5a', cursor: 'pointer' }} />
        ))}
      </div>
    </div>
  );
};

export default NewsSlideshow;
