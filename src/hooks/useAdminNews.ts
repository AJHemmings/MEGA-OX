import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export type NewsCategory = 'update' | 'patch' | 'season' | 'tournament';

export interface NewsImage {
  id?: string;
  image_url: string;
  sort_order: number;
}

export interface NewsLink {
  id?: string;
  icon_key: string | null;
  custom_icon_url: string | null;
  url: string;
  sort_order: number;
}

export interface AdminNewsPost {
  id: string;
  title: string;
  content: string;
  category: NewsCategory;
  image_url: string | null;
  published_at: string;
  images: NewsImage[];
  links: NewsLink[];
}

export interface NewsPostInput {
  title: string;
  content: string;
  category: NewsCategory;
  image_url: string | null;
  // sort_order on these is renumbered from array position on save (see
  // saveChildren) — kept here only so the form can reuse NewsImage/NewsLink
  // directly instead of near-duplicate anonymous shapes.
  images: NewsImage[];
  links: NewsLink[];
}

export function useAdminNews() {
  const [posts, setPosts]     = useState<AdminNewsPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const loadPosts = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);

    const { data, error: err } = await supabase
      .from('news_posts')
      .select('*, news_images(*), news_links(*)')
      .order('published_at', { ascending: false });

    if (err) {
      setError('Failed to load news posts.');
      setLoading(false);
      return;
    }

    const mapped: AdminNewsPost[] = (data ?? []).map((p: any) => ({
      id: p.id,
      title: p.title,
      content: p.content,
      category: p.category,
      image_url: p.image_url,
      published_at: p.published_at,
      images: (p.news_images ?? []).slice().sort((a: NewsImage, b: NewsImage) => a.sort_order - b.sort_order),
      links: (p.news_links ?? []).slice().sort((a: NewsLink, b: NewsLink) => a.sort_order - b.sort_order),
    }));

    setPosts(mapped);
    setError(null);
    setLoading(false);
  }, []);

  useEffect(() => { loadPosts(); }, [loadPosts]);

  const createPost = useCallback(async (input: NewsPostInput): Promise<string | null> => {
    const { data: post, error: postErr } = await supabase
      .from('news_posts')
      .insert({
        title: input.title,
        content: input.content,
        category: input.category,
        image_url: input.image_url,
      })
      .select('id')
      .single();

    if (postErr || !post) return postErr?.message ?? 'Failed to create post';

    const err = await saveChildren(post.id, input);
    if (err) return err;

    await loadPosts(true);
    return null;
  }, [loadPosts]);

  const updatePost = useCallback(async (postId: string, input: NewsPostInput): Promise<string | null> => {
    const { error: postErr } = await supabase
      .from('news_posts')
      .update({
        title: input.title,
        content: input.content,
        category: input.category,
        image_url: input.image_url,
      })
      .eq('id', postId);

    if (postErr) return postErr.message;

    // Simplest correct approach for a low-traffic admin form: replace the
    // full set of child rows rather than diffing individual adds/removes/reorders.
    await supabase.from('news_images').delete().eq('post_id', postId);
    await supabase.from('news_links').delete().eq('post_id', postId);

    const err = await saveChildren(postId, input);
    if (err) return err;

    await loadPosts(true);
    return null;
  }, [loadPosts]);

  const deletePost = useCallback(async (postId: string): Promise<string | null> => {
    const { error: err } = await supabase.from('news_posts').delete().eq('id', postId);
    if (err) return err.message;
    await loadPosts(true);
    return null;
  }, [loadPosts]);

  return { posts, loading, error, refetch: loadPosts, createPost, updatePost, deletePost };
}

async function saveChildren(postId: string, input: NewsPostInput): Promise<string | null> {
  if (input.images.length > 0) {
    const { error } = await supabase.from('news_images').insert(
      input.images.map((img, i) => ({ post_id: postId, image_url: img.image_url, sort_order: i }))
    );
    if (error) return error.message;
  }

  if (input.links.length > 0) {
    const { error } = await supabase.from('news_links').insert(
      input.links.map((link, i) => ({
        post_id: postId,
        icon_key: link.icon_key,
        custom_icon_url: link.custom_icon_url,
        url: link.url,
        sort_order: i,
      }))
    );
    if (error) return error.message;
  }

  return null;
}
