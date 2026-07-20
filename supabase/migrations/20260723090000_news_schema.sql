-- News admin tab (Phase 11): fix stale RLS on news_posts, add gallery images
-- and icon-links as their own tables.
--
-- news_posts' write policy predates the Phase 7 admin_roles/is_admin()
-- system — it checks profiles.role = 'admin', a field nothing sets anymore
-- (verified: zero profiles currently have that role). Every other admin
-- surface uses is_admin(), which this now matches.

DROP POLICY "Admins can manage news" ON public.news_posts;
CREATE POLICY "Admins can manage news" ON public.news_posts
  FOR ALL USING (is_admin());

-- Gallery images, separate from the single banner (news_posts.image_url).
-- Zero rows = no gallery, one row = single body image, many = gallery.
CREATE TABLE public.news_images (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id uuid NOT NULL REFERENCES public.news_posts(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0
);
CREATE INDEX news_images_post_id ON public.news_images (post_id, sort_order);

ALTER TABLE public.news_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "News images are publicly readable" ON public.news_images FOR SELECT USING (true);
CREATE POLICY "Admins can manage news images" ON public.news_images FOR ALL USING (is_admin());

-- Row of clickable logo/icon links (Discord, Reddit, store page, etc.).
-- icon_key is one of a small preset brand-icon set rendered client-side;
-- custom_icon_url is an uploaded fallback for anything not in the preset.
CREATE TABLE public.news_links (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id uuid NOT NULL REFERENCES public.news_posts(id) ON DELETE CASCADE,
  icon_key text,
  custom_icon_url text,
  url text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0
);
CREATE INDEX news_links_post_id ON public.news_links (post_id, sort_order);

ALTER TABLE public.news_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "News links are publicly readable" ON public.news_links FOR SELECT USING (true);
CREATE POLICY "Admins can manage news links" ON public.news_links FOR ALL USING (is_admin());
