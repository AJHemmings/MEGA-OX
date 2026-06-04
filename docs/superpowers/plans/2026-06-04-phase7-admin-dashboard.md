# Phase 7 — Admin Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a protected `/admin` area with two role tiers (super_admin / editor) covering 5 sections: Skins, Emojis, Achievements, Shop, and AI Tuner.

**Architecture:** New `admin_roles` and `ai_config` Supabase tables + RLS policies gate all writes. A shared `ContentTable` + `ItemFormModal` + `AssetUpload` pattern is composed for Skins, Emojis, and Achievements. Shop and AI Tuner are purpose-built. `AdminRoute` guards all `/admin/*` routes; `AdminLayout` provides the persistent sidebar. The existing `aiPlayer.ts` AI functions are extended to accept config overrides read from `ai_config`.

**Tech Stack:** React (CRA, TypeScript), Supabase Postgres + Storage, React Router nested routes, inline CSS using `src/styles/tokens.ts` design tokens. No CSS framework.

**Spec:** `docs/superpowers/specs/2026-06-04-phase7-admin-dashboard-design.md`

---

## File Map

**Create:**
- `supabase/migrations/20260604000001_phase7_admin.sql` — schema + RLS + seed
- `src/hooks/useAdminRole.ts` — fetch current user's admin role
- `src/hooks/useAdminItems.ts` — CRUD on `cosmetic_items` for admin
- `src/hooks/useAdminAchievements.ts` — CRUD on `achievements` for admin
- `src/hooks/useAdminTransactions.ts` — read-only fetch of `transactions` with joins
- `src/hooks/useAiConfig.ts` — fetch `ai_config` rows; used by game AI and AI Tuner
- `src/components/admin/AdminRoute.tsx` — role-based route guard
- `src/components/admin/AdminLayout.tsx` — sidebar + content shell
- `src/components/admin/shared/ContentTable.tsx` — reusable item table with filter tabs + archive/restore
- `src/components/admin/shared/ItemFormModal.tsx` — reusable add/edit modal
- `src/components/admin/shared/AssetUpload.tsx` — file upload → Supabase Storage → live preview
- `src/components/admin/SkinsManager.tsx` — skins section (editor+)
- `src/components/admin/EmojiManager.tsx` — emojis section (editor+, filtered skins view)
- `src/components/admin/AchievementsManager.tsx` — achievements section (editor+)
- `src/components/admin/ShopManager.tsx` — shop items + transactions (super_admin)
- `src/components/admin/AiTuner.tsx` — AI difficulty sliders (super_admin)

**Modify:**
- `src/App.tsx` — add `/admin/*` routes inside the existing `<Route element={<ProtectedRoute />}>` block
- `src/components/MainMenu.tsx` — add conditional "Admin" nav link (desktop + mobile) using `useAdminRole`
- `src/hooks/useShop.ts` — add `.eq('archived', false)` filter; expand `ShopItem.type` union
- `src/ai/aiPlayer.ts` — extend `mediumMove` and `hardMove` to accept optional config parameter

---

## Task 1: DB Migration

**Files:**
- Create: `supabase/migrations/20260604000001_phase7_admin.sql`

- [ ] **Step 1: Write the migration**

Create `supabase/migrations/20260604000001_phase7_admin.sql`:

```sql
-- Phase 7: Admin Dashboard
-- Creates admin_roles, ai_config; adds visible/featured/archived to cosmetic_items; RLS policies.

-- ── 1. admin_roles ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.admin_roles (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role       TEXT NOT NULL CHECK (role IN ('super_admin', 'editor')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

ALTER TABLE public.admin_roles ENABLE ROW LEVEL SECURITY;

-- Every admin can read their own row (required for useAdminRole hook)
CREATE POLICY "admin_roles_self_read" ON public.admin_roles
  FOR SELECT USING (user_id = auth.uid());

-- Super admins can read all rows (for admin management UI)
CREATE POLICY "admin_roles_super_read" ON public.admin_roles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.admin_roles
      WHERE user_id = auth.uid() AND role = 'super_admin'
    )
  );

CREATE POLICY "admin_roles_super_write" ON public.admin_roles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.admin_roles
      WHERE user_id = auth.uid() AND role = 'super_admin'
    )
  );

-- ── 2. ai_config ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.ai_config (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  difficulty TEXT NOT NULL CHECK (difficulty IN ('medium', 'hard')),
  rule_name  TEXT NOT NULL,
  strength   INTEGER NOT NULL CHECK (strength >= 0 AND strength <= 100),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES public.profiles(id),
  UNIQUE (difficulty, rule_name),
  CONSTRAINT ai_config_minimax_depth_range
    CHECK (rule_name <> 'minimax_depth' OR (strength >= 1 AND strength <= 5))
);

ALTER TABLE public.ai_config ENABLE ROW LEVEL SECURITY;

-- Public read — game AI reads config at game start
CREATE POLICY "ai_config_public_read" ON public.ai_config
  FOR SELECT USING (true);

-- Super admin write only
CREATE POLICY "ai_config_super_write" ON public.ai_config
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.admin_roles
      WHERE user_id = auth.uid() AND role = 'super_admin'
    )
  );

-- Seed with current hardcoded AI constants
INSERT INTO public.ai_config (difficulty, rule_name, strength) VALUES
  ('medium', 'win_rule_strength',      80),
  ('medium', 'poison_filter_strength', 70),
  ('hard',   'win_rule_strength',      95),
  ('hard',   'poison_filter_strength', 90),
  ('hard',   'minimax_depth',           3)
ON CONFLICT (difficulty, rule_name) DO NOTHING;

-- ── 3. cosmetic_items — add admin columns ─────────────────────────────────────
ALTER TABLE public.cosmetic_items
  ADD COLUMN IF NOT EXISTS visible  BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS featured BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS archived BOOLEAN NOT NULL DEFAULT false;

-- ── 4. RLS — cosmetic_items admin write ───────────────────────────────────────
CREATE POLICY "cosmetic_items_editor_write" ON public.cosmetic_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.admin_roles
      WHERE user_id = auth.uid()
    )
  );

-- ── 5. RLS — achievements admin write ────────────────────────────────────────
CREATE POLICY "achievements_editor_write" ON public.achievements
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.admin_roles
      WHERE user_id = auth.uid()
    )
  );

-- ── 6. RLS — transactions super_admin read ───────────────────────────────────
CREATE POLICY "transactions_super_admin_read" ON public.transactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.admin_roles
      WHERE user_id = auth.uid() AND role = 'super_admin'
    )
  );
```

- [ ] **Step 2: Apply the migration via Supabase MCP**

Use `mcp__plugin_supabase_supabase__apply_migration` with:
- `project_id: "qioxtkcjtvvkzcoupdfk"`
- `name: "phase7_admin"`
- `query`: full SQL above

- [ ] **Step 3: Create the Supabase Storage bucket**

In the Supabase dashboard (or via MCP if available): create a public bucket named `admin-assets`. Set a 2MB file size limit. Allowed MIME types: `image/svg+xml`, `image/png`, `application/json`.

Add a storage policy allowing authenticated admins to upload:
```sql
CREATE POLICY "admin_assets_upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'admin-assets'
    AND EXISTS (
      SELECT 1 FROM public.admin_roles WHERE user_id = auth.uid()
    )
  );
CREATE POLICY "admin_assets_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'admin-assets');
```

- [ ] **Step 4: Verify migration**

Run via Supabase MCP `execute_sql`:
```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('admin_roles', 'ai_config');

SELECT difficulty, rule_name, strength FROM public.ai_config ORDER BY difficulty, rule_name;

SELECT column_name FROM information_schema.columns
WHERE table_name = 'cosmetic_items'
  AND column_name IN ('visible', 'featured', 'archived');
```

Expected: 2 tables, 5 seed rows, 3 columns.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/20260604000001_phase7_admin.sql
git commit -m "feat: Phase 7 migration — admin_roles, ai_config, cosmetic_items admin columns"
```

---

## Task 2: `useAdminRole` hook

**Files:**
- Create: `src/hooks/useAdminRole.ts`

- [ ] **Step 1: Write the hook**

```typescript
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export type AdminRole = 'super_admin' | 'editor';

export function useAdminRole(): { role: AdminRole | null; loading: boolean } {
  const { user } = useAuth();
  const [role, setRole]       = useState<AdminRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setRole(null); setLoading(false); return; }

    supabase
      .from('admin_roles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        setRole((data?.role as AdminRole) ?? null);
        setLoading(false);
      });
  }, [user]);

  return { role, loading };
}
```

- [ ] **Step 2: Verify TypeScript compiles cleanly**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useAdminRole.ts
git commit -m "feat: add useAdminRole hook"
```

---

## Task 3: `AdminRoute` + `AdminLayout` + routes + nav

**Files:**
- Create: `src/components/admin/AdminRoute.tsx`
- Create: `src/components/admin/AdminLayout.tsx`
- Modify: `src/App.tsx`
- Modify: `src/components/MainMenu.tsx`

- [ ] **Step 1: Write `AdminRoute`**

Create `src/components/admin/AdminRoute.tsx`:

```typescript
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAdminRole, AdminRole } from '../../hooks/useAdminRole';
import PageBackground from '../common/PageBackground';
import { tokens } from '../../styles/tokens';

interface Props {
  requiredRole?: 'super_admin';
  children: React.ReactNode;
}

export const AdminRoute: React.FC<Props> = ({ requiredRole, children }) => {
  const { role, loading } = useAdminRole();

  if (loading) {
    return (
      <PageBackground>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          minHeight: '60vh', color: tokens.textMuted, fontFamily: tokens.font, fontSize: 14,
        }}>
          Loading...
        </div>
      </PageBackground>
    );
  }

  if (role === null) return <Navigate to="/menu" replace />;
  if (requiredRole === 'super_admin' && role !== 'super_admin') {
    return <Navigate to="/admin/skins" replace />;
  }

  return <>{children}</>;
};
```

- [ ] **Step 2: Write `AdminLayout`**

Create `src/components/admin/AdminLayout.tsx`:

```typescript
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAdminRole } from '../../hooks/useAdminRole';
import { tokens } from '../../styles/tokens';

const NAV_EDITOR = [
  { label: 'Skins',        path: '/admin/skins'        },
  { label: 'Achievements', path: '/admin/achievements'  },
  { label: 'Emojis',       path: '/admin/emojis'        },
];

const NAV_SUPER = [
  { label: 'Shop',     path: '/admin/shop'      },
  { label: 'AI Tuner', path: '/admin/ai-tuner'  },
];

interface Props { children: React.ReactNode }

export const AdminLayout: React.FC<Props> = ({ children }) => {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { role }  = useAdminRole();

  const isActive = (path: string) => location.pathname === path;

  const linkStyle = (active: boolean): React.CSSProperties => ({
    display: 'block', padding: '6px 8px', borderRadius: 5,
    fontSize: 12, fontWeight: active ? 700 : 500,
    color:      active ? tokens.accent : tokens.textMuted,
    background: active ? 'rgba(0,212,170,0.12)' : 'transparent',
    borderLeft: active ? `2px solid ${tokens.accent}` : '2px solid transparent',
    cursor: 'pointer', fontFamily: tokens.font,
  });

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: tokens.bg }}>
      {/* Sidebar */}
      <div style={{
        width: 140, flexShrink: 0,
        background: 'rgba(255,255,255,0.03)',
        borderRight: '1px solid rgba(255,255,255,0.07)',
        padding: '20px 12px',
      }}>
        <div style={{
          color: tokens.accent, fontWeight: 800, fontSize: 10,
          letterSpacing: 1.5, marginBottom: 16, fontFamily: tokens.font,
        }}>
          ADMIN
        </div>

        {NAV_EDITOR.map(({ label, path }) => (
          <div key={path} style={linkStyle(isActive(path))} onClick={() => navigate(path)}>
            {label}
          </div>
        ))}

        {role === 'super_admin' && (
          <>
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', margin: '10px 0' }} />
            {NAV_SUPER.map(({ label, path }) => (
              <div key={path} style={linkStyle(isActive(path))} onClick={() => navigate(path)}>
                {label}
              </div>
            ))}
          </>
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, padding: 24, overflowY: 'auto' }}>
        {children}
      </div>
    </div>
  );
};
```

- [ ] **Step 3: Add `/admin/*` routes to `App.tsx`**

Add these imports at the top of `src/App.tsx` with the other page imports:

```typescript
import { AdminRoute } from './components/admin/AdminRoute';
import { AdminLayout } from './components/admin/AdminLayout';
import SkinsManager from './components/admin/SkinsManager';
import EmojiManager from './components/admin/EmojiManager';
import AchievementsManager from './components/admin/AchievementsManager';
import ShopManager from './components/admin/ShopManager';
import AiTuner from './components/admin/AiTuner';
```

Then inside the `<Route element={<ProtectedRoute />}>` block (after the `/shop` route, before closing `</Route>`):

```tsx
<Route path="/admin" element={<Navigate to="/admin/skins" replace />} />
<Route path="/admin/skins" element={
  <AdminRoute><AdminLayout><SkinsManager /></AdminLayout></AdminRoute>
} />
<Route path="/admin/achievements" element={
  <AdminRoute><AdminLayout><AchievementsManager /></AdminLayout></AdminRoute>
} />
<Route path="/admin/emojis" element={
  <AdminRoute><AdminLayout><EmojiManager /></AdminLayout></AdminRoute>
} />
<Route path="/admin/shop" element={
  <AdminRoute requiredRole="super_admin"><AdminLayout><ShopManager /></AdminLayout></AdminRoute>
} />
<Route path="/admin/ai-tuner" element={
  <AdminRoute requiredRole="super_admin"><AdminLayout><AiTuner /></AdminLayout></AdminRoute>
} />
```

- [ ] **Step 4: Add Admin nav link to `MainMenu.tsx`**

In `src/components/MainMenu.tsx`, import `useAdminRole` at the top:
```typescript
import { useAdminRole } from '../hooks/useAdminRole';
```

Inside the `MainMenu` component, call the hook:
```typescript
const { role: adminRole } = useAdminRole();
```

In `DESKTOP_NAV` (wherever the nav array is defined), this is already a static const — instead, conditionally render an extra link inline after the nav loop. Find the desktop nav rendering and add an "Admin" link that only shows when `adminRole !== null`. Follow the exact same JSX pattern the other nav links use.

Do the same in the mobile drawer nav.

- [ ] **Step 5: Create placeholder components** (so App.tsx compiles before the real implementations)

Create each of the following as a minimal placeholder — they will be replaced in later tasks:

`src/components/admin/SkinsManager.tsx`:
```typescript
import React from 'react';
const SkinsManager: React.FC = () => <div style={{color:'white'}}>Skins Manager — coming soon</div>;
export default SkinsManager;
```

Same pattern for `EmojiManager.tsx`, `AchievementsManager.tsx`, `ShopManager.tsx`, `AiTuner.tsx`.

- [ ] **Step 6: Verify TypeScript compiles cleanly**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 7: Start the dev server and manually verify routing**

```bash
npm start
```

- Log in and confirm "Admin" does NOT appear in the nav for a regular user
- Navigating to `/admin/skins` directly should redirect to `/menu` for non-admins
- Manually insert a row in `admin_roles` via Supabase dashboard for your account, then reload — confirm "Admin" appears and `/admin/skins` loads the placeholder

- [ ] **Step 8: Commit**

```bash
git add src/components/admin/AdminRoute.tsx src/components/admin/AdminLayout.tsx \
  src/components/admin/SkinsManager.tsx src/components/admin/EmojiManager.tsx \
  src/components/admin/AchievementsManager.tsx src/components/admin/ShopManager.tsx \
  src/components/admin/AiTuner.tsx src/App.tsx src/components/MainMenu.tsx
git commit -m "feat: AdminRoute, AdminLayout, admin routes, conditional nav link"
```

---

## Task 4: `useAdminItems` hook

**Files:**
- Create: `src/hooks/useAdminItems.ts`

- [ ] **Step 1: Write the hook**

```typescript
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface AdminItem {
  id: string;
  name: string;
  type: string;
  asset_url: string | null;
  price: number | null;
  rarity: string;
  source: string;
  animated: boolean;
  visible: boolean;
  featured: boolean;
  archived: boolean;
}

export interface ItemFormData {
  name: string;
  type: string;
  asset_url: string;
  price: number;
  rarity: string;
  animated: boolean;
  source?: string;
}

export function useAdminItems(typeFilter?: string | string[]) {
  const [items, setItems]   = useState<AdminItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from('cosmetic_items')
      .select('id,name,type,asset_url,price,rarity,source,animated,visible,featured,archived')
      .order('type').order('name');

    if (typeFilter) {
      const types = Array.isArray(typeFilter) ? typeFilter : [typeFilter];
      query = query.in('type', types);
    }

    const { data, error: err } = await query;
    if (err) { setError('Failed to load items.'); setLoading(false); return; }
    setItems((data ?? []) as AdminItem[]);
    setError(null);
    setLoading(false);
  }, [typeFilter]);

  useEffect(() => { fetch(); }, [fetch]);

  const addItem = useCallback(async (form: ItemFormData): Promise<string | null> => {
    const { error: err } = await supabase.from('cosmetic_items').insert({
      name:      form.name,
      type:      form.type,
      asset_url: form.asset_url || null,
      price:     form.price,
      rarity:    form.rarity,
      animated:  form.animated,
      source:    form.source ?? 'shop',
    });
    if (err) return err.message;
    await fetch();
    return null;
  }, [fetch]);

  const updateItem = useCallback(async (id: string, form: Partial<ItemFormData> & { visible?: boolean; featured?: boolean }): Promise<string | null> => {
    const { error: err } = await supabase.from('cosmetic_items').update(form).eq('id', id);
    if (err) return err.message;
    await fetch();
    return null;
  }, [fetch]);

  const archiveItem = useCallback(async (id: string): Promise<string | null> => {
    const { error: err } = await supabase.from('cosmetic_items').update({ archived: true }).eq('id', id);
    if (err) return err.message;
    await fetch();
    return null;
  }, [fetch]);

  const restoreItem = useCallback(async (id: string): Promise<string | null> => {
    const { error: err } = await supabase.from('cosmetic_items').update({ archived: false }).eq('id', id);
    if (err) return err.message;
    await fetch();
    return null;
  }, [fetch]);

  return { items, loading, error, refetch: fetch, addItem, updateItem, archiveItem, restoreItem };
}
```

- [ ] **Step 2: Verify TypeScript compiles cleanly**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useAdminItems.ts
git commit -m "feat: add useAdminItems hook — CRUD on cosmetic_items"
```

---

## Task 5: Shared admin components — `AssetUpload`, `ContentTable`, `ItemFormModal`

**Files:**
- Create: `src/components/admin/shared/AssetUpload.tsx`
- Create: `src/components/admin/shared/ContentTable.tsx`
- Create: `src/components/admin/shared/ItemFormModal.tsx`

- [ ] **Step 1: Write `AssetUpload`**

Create `src/components/admin/shared/AssetUpload.tsx`:

```typescript
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

      {/* Upload zone */}
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

      {/* Preview after upload */}
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
```

- [ ] **Step 2: Write `ContentTable`**

Create `src/components/admin/shared/ContentTable.tsx`:

```typescript
import React from 'react';
import { AdminItem } from '../../../hooks/useAdminItems';
import { tokens } from '../../../styles/tokens';

interface Tab { key: string; label: string; types: string[] }

interface Props {
  items: AdminItem[];
  loading: boolean;
  error: string | null;
  tabs?: Tab[];
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  onAdd: () => void;
  onEdit: (item: AdminItem) => void;
  onArchive: (id: string) => void;
  onRestore: (id: string) => void;
  sectionTitle: string;
}

export const ContentTable: React.FC<Props> = ({
  items, loading, error, tabs, activeTab, onTabChange,
  onAdd, onEdit, onArchive, onRestore, sectionTitle,
}) => {
  const filtered = tabs && activeTab
    ? items.filter(i => tabs.find(t => t.key === activeTab)?.types.includes(i.type))
    : items;

  return (
    <div style={{ fontFamily: tokens.font }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 800, color: tokens.text }}>{sectionTitle}</div>
          <div style={{ fontSize: 11, color: tokens.textMuted, marginTop: 2 }}>
            {items.length} item{items.length !== 1 ? 's' : ''} · cosmetic_items
          </div>
        </div>
        <button onClick={onAdd} style={{
          background: 'rgba(0,212,170,0.18)', border: `1px solid ${tokens.accent}`,
          borderRadius: 20, padding: '6px 14px', fontSize: 12, fontWeight: 800,
          color: tokens.accent, cursor: 'pointer', fontFamily: tokens.font,
        }}>
          + Add Item
        </button>
      </div>

      {/* Filter tabs */}
      {tabs && (
        <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
          {tabs.map(tab => (
            <button key={tab.key} onClick={() => onTabChange?.(tab.key)} style={{
              padding: '4px 12px', borderRadius: 20, border: 'none', cursor: 'pointer',
              background: activeTab === tab.key ? 'rgba(0,212,170,0.15)' : 'rgba(255,255,255,0.04)',
              color: activeTab === tab.key ? tokens.accent : tokens.textMuted,
              fontWeight: activeTab === tab.key ? 700 : 500, fontSize: 11, fontFamily: tokens.font,
            }}>{tab.label}</button>
          ))}
        </div>
      )}

      {/* States */}
      {loading && <div style={{ color: tokens.textMuted, fontSize: 13, padding: 20 }}>Loading…</div>}
      {error   && <div style={{ color: tokens.loss,     fontSize: 13, padding: 20 }}>{error}</div>}

      {/* Table */}
      {!loading && !error && (
        <div style={{
          background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 10, overflow: 'hidden',
        }}>
          {/* Header row */}
          <div style={{
            display: 'grid', gridTemplateColumns: '36px 1fr 80px 70px 80px 110px',
            gap: 8, padding: '8px 14px',
            borderBottom: '1px solid rgba(255,255,255,0.07)',
            fontSize: 9, color: tokens.textMuted, fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: 0.8,
          }}>
            <div />
            <div>Name</div><div>Type</div><div>Price</div><div>Rarity</div><div />
          </div>

          {filtered.length === 0 && (
            <div style={{ padding: 24, textAlign: 'center', color: tokens.textMuted, fontSize: 13 }}>
              No items.
            </div>
          )}

          {filtered.map(item => (
            <div key={item.id} style={{
              display: 'grid', gridTemplateColumns: '36px 1fr 80px 70px 80px 110px',
              gap: 8, padding: '8px 14px', alignItems: 'center',
              borderBottom: '1px solid rgba(255,255,255,0.04)',
              opacity: item.archived ? 0.4 : 1,
            }}>
              {/* Preview */}
              <div style={{ width: 28, height: 28, borderRadius: 4, overflow: 'hidden', background: 'rgba(255,255,255,0.06)' }}>
                {item.asset_url && (
                  <img src={item.asset_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                )}
              </div>

              <div style={{
                fontSize: 12, color: tokens.text, fontWeight: 600,
                textDecoration: item.archived ? 'line-through' : 'none',
              }}>{item.name}</div>
              <div style={{ fontSize: 11, color: tokens.textMuted }}>{item.type}</div>
              <div style={{ fontSize: 11, color: tokens.credits }}>{item.price != null ? `${item.price} cr` : '—'}</div>
              <div style={{ fontSize: 11, color: tokens.textMuted }}>{item.rarity}</div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 6 }}>
                {!item.archived ? (
                  <>
                    <button onClick={() => onEdit(item)} style={{
                      fontSize: 10, color: tokens.accent, cursor: 'pointer',
                      background: 'rgba(0,212,170,0.1)', border: 'none',
                      padding: '3px 8px', borderRadius: 4, fontFamily: tokens.font, fontWeight: 700,
                    }}>Edit</button>
                    <button onClick={() => onArchive(item.id)} style={{
                      fontSize: 10, color: tokens.textMuted, cursor: 'pointer',
                      background: 'rgba(255,255,255,0.05)', border: 'none',
                      padding: '3px 8px', borderRadius: 4, fontFamily: tokens.font,
                    }}>Archive</button>
                  </>
                ) : (
                  <button onClick={() => onRestore(item.id)} style={{
                    fontSize: 10, color: tokens.textMuted, cursor: 'pointer',
                    background: 'rgba(255,255,255,0.05)', border: 'none',
                    padding: '3px 8px', borderRadius: 4, fontFamily: tokens.font,
                  }}>Restore</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
```

- [ ] **Step 3: Write `ItemFormModal`**

Create `src/components/admin/shared/ItemFormModal.tsx`:

```typescript
import React, { useState, useEffect } from 'react';
import { AdminItem, ItemFormData } from '../../../hooks/useAdminItems';
import { tokens } from '../../../styles/tokens';
import Glass from '../../common/Glass';
import PrimaryButton from '../../common/PrimaryButton';
import SecondaryButton from '../../common/SecondaryButton';
import { AssetUpload } from './AssetUpload';

interface Props {
  item: AdminItem | null;       // null = add mode
  typeOptions: string[];
  onSave: (form: ItemFormData) => Promise<string | null>;
  onClose: () => void;
}

const RARITY_OPTIONS = ['common', 'rare', 'epic', 'legendary'];

const empty = (): ItemFormData => ({
  name: '', type: '', asset_url: '', price: 0, rarity: 'common', animated: false,
});

export const ItemFormModal: React.FC<Props> = ({ item, typeOptions, onSave, onClose }) => {
  const [form, setForm]     = useState<ItemFormData>(empty());
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState<string | null>(null);

  useEffect(() => {
    if (item) {
      setForm({
        name:      item.name,
        type:      item.type,
        asset_url: item.asset_url ?? '',
        price:     item.price ?? 0,
        rarity:    item.rarity,
        animated:  item.animated,
      });
    } else {
      setForm({ ...empty(), type: typeOptions[0] ?? '' });
    }
    setError(null);
  }, [item, typeOptions]);

  const handleSave = async () => {
    if (!form.name.trim()) { setError('Name is required.'); return; }
    setSaving(true);
    const err = await onSave(form);
    setSaving(false);
    if (err) { setError(err); return; }
    onClose();
  };

  const field = (label: string, children: React.ReactNode) => (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 9, color: tokens.textMuted, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.8 }}>
        {label}
      </div>
      {children}
    </div>
  );

  const inputStyle: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box',
    background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 6, padding: '6px 10px', fontSize: 12, color: tokens.text,
    fontFamily: tokens.font, outline: 'none',
  };

  const selectStyle: React.CSSProperties = { ...inputStyle };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 300,
        background: 'rgba(6,13,31,0.80)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
      }}
      onClick={saving ? undefined : onClose}
    >
      <Glass style={{ maxWidth: 400, width: '100%', padding: 0 }}>
        <div style={{ padding: 24, fontFamily: tokens.font }} onClick={(e) => e.stopPropagation()}>
          <div style={{ fontSize: 16, fontWeight: 800, color: tokens.text, marginBottom: 20 }}>
            {item ? `Edit — ${item.name}` : 'Add Item'}
          </div>

          {field('Name',
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              style={inputStyle} placeholder="Item name" />
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {field('Type',
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                style={selectStyle}>
                {typeOptions.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            )}
            {field('Price (credits)',
              <input type="number" min={0} value={form.price}
                onChange={e => setForm(f => ({ ...f, price: Number(e.target.value) }))}
                style={inputStyle} />
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {field('Rarity',
              <select value={form.rarity} onChange={e => setForm(f => ({ ...f, rarity: e.target.value }))}
                style={selectStyle}>
                {RARITY_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            )}
            {field('Animated',
              <select value={form.animated ? 'yes' : 'no'}
                onChange={e => setForm(f => ({ ...f, animated: e.target.value === 'yes' }))}
                style={selectStyle}>
                <option value="no">No</option>
                <option value="yes">Yes (Lottie JSON)</option>
              </select>
            )}
          </div>

          <AssetUpload
            value={form.asset_url}
            onChange={url => setForm(f => ({ ...f, asset_url: url }))}
          />

          {error && (
            <div style={{
              marginTop: 12, padding: '8px 12px', borderRadius: 6,
              background: 'rgba(229,62,62,0.12)', color: tokens.loss, fontSize: 12,
            }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
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
```

- [ ] **Step 4: Verify TypeScript compiles cleanly**

```bash
npx tsc --noEmit
```

- [ ] **Step 5: Commit**

```bash
git add src/components/admin/shared/AssetUpload.tsx \
  src/components/admin/shared/ContentTable.tsx \
  src/components/admin/shared/ItemFormModal.tsx
git commit -m "feat: shared admin components — AssetUpload, ContentTable, ItemFormModal"
```

---

## Task 6: `SkinsManager`

**Files:**
- Modify: `src/components/admin/SkinsManager.tsx` (replace placeholder)

- [ ] **Step 1: Replace the placeholder**

```typescript
import React, { useState } from 'react';
import { useAdminItems, AdminItem, ItemFormData } from '../../hooks/useAdminItems';
import { ContentTable } from './shared/ContentTable';
import { ItemFormModal } from './shared/ItemFormModal';

const TABS = [
  { key: 'all',    label: 'All',    types: ['avatar','badge','banner','board','marker','theme'] },
  { key: 'avatar', label: 'Avatar', types: ['avatar'] },
  { key: 'badge',  label: 'Badge',  types: ['badge']  },
  { key: 'banner', label: 'Banner', types: ['banner'] },
  { key: 'board',  label: 'Board',  types: ['board']  },
  { key: 'marker', label: 'Marker', types: ['marker'] },
];

const TYPE_OPTIONS = ['avatar', 'badge', 'banner', 'board', 'marker', 'theme'];

const SkinsManager: React.FC = () => {
  const { items, loading, error, addItem, updateItem, archiveItem, restoreItem } =
    useAdminItems(['avatar','badge','banner','board','marker','theme']);

  const [activeTab, setActiveTab] = useState('all');
  const [modalItem, setModalItem] = useState<AdminItem | null | undefined>(undefined);
  // undefined = closed, null = add mode, AdminItem = edit mode

  const handleSave = async (form: ItemFormData) => {
    if (modalItem === null) return addItem(form);
    if (modalItem)          return updateItem(modalItem.id, form);
    return null;
  };

  return (
    <>
      <ContentTable
        items={items} loading={loading} error={error}
        tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab}
        sectionTitle="Skins"
        onAdd={() => setModalItem(null)}
        onEdit={item => setModalItem(item)}
        onArchive={archiveItem}
        onRestore={restoreItem}
      />
      {modalItem !== undefined && (
        <ItemFormModal
          item={modalItem}
          typeOptions={TYPE_OPTIONS}
          onSave={handleSave}
          onClose={() => setModalItem(undefined)}
        />
      )}
    </>
  );
};

export default SkinsManager;
```

- [ ] **Step 2: Verify TypeScript + smoke test in browser**

```bash
npx tsc --noEmit
```

Navigate to `/admin/skins` as an admin — confirm the table loads, "Add Item" opens the modal, and "Archive" soft-deletes a row.

- [ ] **Step 3: Commit**

```bash
git add src/components/admin/SkinsManager.tsx
git commit -m "feat: SkinsManager — add/edit/archive cosmetic_items"
```

---

## Task 7: `EmojiManager`

**Files:**
- Modify: `src/components/admin/EmojiManager.tsx` (replace placeholder)

- [ ] **Step 1: Replace the placeholder**

```typescript
import React, { useState } from 'react';
import { useAdminItems, AdminItem, ItemFormData } from '../../hooks/useAdminItems';
import { ContentTable } from './shared/ContentTable';
import { ItemFormModal } from './shared/ItemFormModal';

const EmojiManager: React.FC = () => {
  const { items, loading, error, addItem, updateItem, archiveItem, restoreItem } =
    useAdminItems('emoji');

  const [modalItem, setModalItem] = useState<AdminItem | null | undefined>(undefined);

  const handleSave = async (form: ItemFormData) => {
    const payload = { ...form, type: 'emoji', source: 'shop' };
    if (modalItem === null) return addItem(payload);
    if (modalItem)          return updateItem(modalItem.id, payload);
    return null;
  };

  return (
    <>
      <ContentTable
        items={items} loading={loading} error={error}
        sectionTitle="Emojis"
        onAdd={() => setModalItem(null)}
        onEdit={item => setModalItem(item)}
        onArchive={archiveItem}
        onRestore={restoreItem}
      />
      {modalItem !== undefined && (
        <ItemFormModal
          item={modalItem}
          typeOptions={['emoji']}
          onSave={handleSave}
          onClose={() => setModalItem(undefined)}
        />
      )}
    </>
  );
};

export default EmojiManager;
```

- [ ] **Step 2: Verify TypeScript + smoke test**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/components/admin/EmojiManager.tsx
git commit -m "feat: EmojiManager — emoji cosmetic_items (filtered Skins view)"
```

---

## Task 8: `useAdminAchievements` + `AchievementsManager`

**Files:**
- Create: `src/hooks/useAdminAchievements.ts`
- Modify: `src/components/admin/AchievementsManager.tsx` (replace placeholder)

- [ ] **Step 1: Write `useAdminAchievements`**

```typescript
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface AdminAchievement {
  id: string;
  name: string;
  description: string;
  condition_type: string;
  condition_value: number;
  xp_reward: number;
  credit_reward: number;
}

export interface AchievementFormData {
  name: string;
  description: string;
  condition_type: string;
  condition_value: number;
  xp_reward: number;
  credit_reward: number;
}

const CONDITION_TYPES = ['wins', 'games_played', 'win_streak', 'draws', 'losses'];

export { CONDITION_TYPES };

export function useAdminAchievements() {
  const [achievements, setAchievements] = useState<AdminAchievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data, error: err } = await supabase
      .from('achievements')
      .select('id,name,description,condition_type,condition_value,xp_reward,credit_reward')
      .order('name');
    if (err) { setError('Failed to load achievements.'); setLoading(false); return; }
    setAchievements((data ?? []) as AdminAchievement[]);
    setError(null);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const add = useCallback(async (form: AchievementFormData): Promise<string | null> => {
    const { error: err } = await supabase.from('achievements').insert(form);
    if (err) return err.message;
    await fetch();
    return null;
  }, [fetch]);

  const update = useCallback(async (id: string, form: AchievementFormData): Promise<string | null> => {
    const { error: err } = await supabase.from('achievements').update(form).eq('id', id);
    if (err) return err.message;
    await fetch();
    return null;
  }, [fetch]);

  return { achievements, loading, error, add, update };
}
```

- [ ] **Step 2: Replace `AchievementsManager` placeholder**

```typescript
import React, { useState } from 'react';
import { useAdminAchievements, AdminAchievement, AchievementFormData, CONDITION_TYPES } from '../../hooks/useAdminAchievements';
import { tokens } from '../../styles/tokens';
import Glass from '../common/Glass';
import PrimaryButton from '../common/PrimaryButton';
import SecondaryButton from '../common/SecondaryButton';

const empty = (): AchievementFormData => ({
  name: '', description: '', condition_type: CONDITION_TYPES[0],
  condition_value: 1, xp_reward: 50, credit_reward: 0,
});

const AchievementsManager: React.FC = () => {
  const { achievements, loading, error, add, update } = useAdminAchievements();
  const [modalItem, setModalItem] = useState<AdminAchievement | null | undefined>(undefined);
  const [form, setForm]   = useState<AchievementFormData>(empty());
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const openAdd  = () => { setForm(empty()); setFormError(null); setModalItem(null); };
  const openEdit = (a: AdminAchievement) => {
    setForm({ name: a.name, description: a.description, condition_type: a.condition_type,
              condition_value: a.condition_value, xp_reward: a.xp_reward, credit_reward: a.credit_reward });
    setFormError(null);
    setModalItem(a);
  };
  const close = () => setModalItem(undefined);

  const handleSave = async () => {
    if (!form.name.trim()) { setFormError('Name is required.'); return; }
    setSaving(true);
    const err = modalItem === null ? await add(form) : await update(modalItem!.id, form);
    setSaving(false);
    if (err) { setFormError(err); return; }
    close();
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box',
    background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 6, padding: '6px 10px', fontSize: 12, color: tokens.text,
    fontFamily: tokens.font, outline: 'none',
  };

  const label = (t: string) => (
    <div style={{ fontSize: 9, color: tokens.textMuted, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.8 }}>{t}</div>
  );

  return (
    <div style={{ fontFamily: tokens.font }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ fontSize: 18, fontWeight: 800, color: tokens.text }}>Achievements</div>
        <button onClick={openAdd} style={{
          background: 'rgba(0,212,170,0.18)', border: `1px solid ${tokens.accent}`,
          borderRadius: 20, padding: '6px 14px', fontSize: 12, fontWeight: 800,
          color: tokens.accent, cursor: 'pointer', fontFamily: tokens.font,
        }}>+ Add Achievement</button>
      </div>

      {loading && <div style={{ color: tokens.textMuted, padding: 20 }}>Loading…</div>}
      {error   && <div style={{ color: tokens.loss,     padding: 20 }}>{error}</div>}

      {!loading && !error && (
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px 80px 80px 60px', gap: 8, padding: '8px 14px', borderBottom: '1px solid rgba(255,255,255,0.07)', fontSize: 9, color: tokens.textMuted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8 }}>
            <div>Name</div><div>Condition</div><div>XP</div><div>Credits</div><div />
          </div>
          {achievements.map(a => (
            <div key={a.id} style={{ display: 'grid', gridTemplateColumns: '1fr 100px 80px 80px 60px', gap: 8, padding: '8px 14px', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: tokens.text }}>{a.name}</div>
                <div style={{ fontSize: 10, color: tokens.textMuted }}>{a.description}</div>
              </div>
              <div style={{ fontSize: 10, color: tokens.textMuted }}>{a.condition_type} ≥ {a.condition_value}</div>
              <div style={{ fontSize: 11, color: tokens.accent }}>{a.xp_reward} XP</div>
              <div style={{ fontSize: 11, color: tokens.credits }}>{a.credit_reward} cr</div>
              <button onClick={() => openEdit(a)} style={{ fontSize: 10, color: tokens.accent, cursor: 'pointer', background: 'rgba(0,212,170,0.1)', border: 'none', padding: '3px 8px', borderRadius: 4, fontFamily: tokens.font, fontWeight: 700 }}>Edit</button>
            </div>
          ))}
        </div>
      )}

      {modalItem !== undefined && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(6,13,31,0.80)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={saving ? undefined : close}>
          <Glass style={{ maxWidth: 420, width: '100%', padding: 0 }}>
            <div style={{ padding: 24, fontFamily: tokens.font }} onClick={e => e.stopPropagation()}>
              <div style={{ fontSize: 16, fontWeight: 800, color: tokens.text, marginBottom: 20 }}>
                {modalItem === null ? 'Add Achievement' : `Edit — ${modalItem.name}`}
              </div>
              <div style={{ marginBottom: 10 }}>{label('Name')}<input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} style={inputStyle} /></div>
              <div style={{ marginBottom: 10 }}>{label('Description')}<textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} style={{ ...inputStyle, minHeight: 60, resize: 'vertical' }} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 10 }}>
                <div>{label('Condition Type')}<select value={form.condition_type} onChange={e => setForm(f => ({ ...f, condition_type: e.target.value }))} style={inputStyle}>{CONDITION_TYPES.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                <div>{label('Threshold')}<input type="number" min={1} value={form.condition_value} onChange={e => setForm(f => ({ ...f, condition_value: Number(e.target.value) }))} style={inputStyle} /></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                <div>{label('XP Reward')}<input type="number" min={0} value={form.xp_reward} onChange={e => setForm(f => ({ ...f, xp_reward: Number(e.target.value) }))} style={inputStyle} /></div>
                <div>{label('Credit Reward')}<input type="number" min={0} value={form.credit_reward} onChange={e => setForm(f => ({ ...f, credit_reward: Number(e.target.value) }))} style={inputStyle} /></div>
              </div>
              {formError && <div style={{ marginBottom: 12, padding: '8px 12px', borderRadius: 6, background: 'rgba(229,62,62,0.12)', color: tokens.loss, fontSize: 12 }}>{formError}</div>}
              <div style={{ display: 'flex', gap: 10 }}>
                <SecondaryButton onClick={close} disabled={saving} style={{ flex: 1 }}>Cancel</SecondaryButton>
                <PrimaryButton onClick={handleSave} disabled={saving} style={{ flex: 1 }}>{saving ? 'Saving…' : 'Save'}</PrimaryButton>
              </div>
            </div>
          </Glass>
        </div>
      )}
    </div>
  );
};

export default AchievementsManager;
```

- [ ] **Step 3: Verify TypeScript + smoke test**

```bash
npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add src/hooks/useAdminAchievements.ts src/components/admin/AchievementsManager.tsx
git commit -m "feat: useAdminAchievements + AchievementsManager"
```

---

## Task 9: `useAdminTransactions` + `ShopManager`

**Files:**
- Create: `src/hooks/useAdminTransactions.ts`
- Modify: `src/components/admin/ShopManager.tsx` (replace placeholder)

- [ ] **Step 1: Write `useAdminTransactions`**

Note: `transactions.item_id` has a FK to `cosmetic_items(id)` (confirmed in initial schema), so PostgREST join syntax works.

```typescript
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface AdminTransaction {
  id: string;
  created_at: string;
  amount: number;
  player_username: string;
  item_name: string;
}

export function useAdminTransactions(search: string) {
  const [rows, setRows]       = useState<AdminTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    // Join via foreign key: transactions → profiles (username), transactions → cosmetic_items (name)
    const { data, error: err } = await supabase
      .from('transactions')
      .select('id, created_at, amount, profiles(username), cosmetic_items(name)')
      .eq('type', 'purchase')
      .order('created_at', { ascending: false })
      .limit(200);

    if (err) { setError('Failed to load transactions.'); setLoading(false); return; }

    const mapped: AdminTransaction[] = (data ?? []).map((r: any) => ({
      id:              r.id,
      created_at:      r.created_at,
      amount:          r.amount,
      player_username: r.profiles?.username ?? '—',
      item_name:       r.cosmetic_items?.name ?? '—',
    }));

    setRows(mapped);
    setError(null);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const filtered = rows.filter(r => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return r.player_username.toLowerCase().includes(q) || r.item_name.toLowerCase().includes(q);
  });

  return { rows: filtered, loading, error };
}
```

- [ ] **Step 2: Replace `ShopManager` placeholder**

```typescript
import React, { useState } from 'react';
import { useAdminItems, AdminItem } from '../../hooks/useAdminItems';
import { useAdminTransactions } from '../../hooks/useAdminTransactions';
import { tokens } from '../../styles/tokens';

type Tab = 'items' | 'transactions';

const ShopManager: React.FC = () => {
  const [tab, setTab]     = useState<Tab>('items');
  const [search, setSearch] = useState('');
  const { items, loading: itemsLoading, updateItem } = useAdminItems();
  const { rows, loading: txLoading, error: txError } = useAdminTransactions(search);

  const shopItems = items.filter(i => i.source === 'shop');

  const tabStyle = (active: boolean): React.CSSProperties => ({
    padding: '6px 16px', borderRadius: 20, border: 'none', cursor: 'pointer',
    background: active ? 'rgba(0,212,170,0.15)' : 'rgba(255,255,255,0.04)',
    color: active ? tokens.accent : tokens.textMuted,
    fontWeight: active ? 700 : 500, fontSize: 12, fontFamily: tokens.font,
  });

  return (
    <div style={{ fontFamily: tokens.font }}>
      <div style={{ fontSize: 18, fontWeight: 800, color: tokens.text, marginBottom: 16 }}>Shop</div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <button style={tabStyle(tab === 'items')}        onClick={() => setTab('items')}>Items</button>
        <button style={tabStyle(tab === 'transactions')} onClick={() => setTab('transactions')}>Transactions</button>
      </div>

      {tab === 'items' && (
        <div>
          {itemsLoading && <div style={{ color: tokens.textMuted, padding: 20 }}>Loading…</div>}
          {!itemsLoading && (
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, overflow: 'hidden' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '36px 1fr 70px 80px 80px 80px', gap: 8, padding: '8px 14px', borderBottom: '1px solid rgba(255,255,255,0.07)', fontSize: 9, color: tokens.textMuted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8 }}>
                <div /><div>Name</div><div>Price</div><div>Visible</div><div>Featured</div><div>Type</div>
              </div>
              {shopItems.map(item => (
                <div key={item.id} style={{ display: 'grid', gridTemplateColumns: '36px 1fr 70px 80px 80px 80px', gap: 8, padding: '8px 14px', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <div style={{ width: 28, height: 28, borderRadius: 4, overflow: 'hidden', background: 'rgba(255,255,255,0.06)' }}>
                    {item.asset_url && <img src={item.asset_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />}
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: tokens.text }}>{item.name}</div>
                  <div style={{ fontSize: 11, color: tokens.credits }}>{item.price} cr</div>

                  {/* Visible toggle */}
                  <button onClick={() => updateItem(item.id, { visible: !item.visible })} style={{
                    fontSize: 10, cursor: 'pointer', border: 'none', borderRadius: 4,
                    padding: '3px 8px', fontFamily: tokens.font, fontWeight: 700,
                    background: item.visible ? 'rgba(0,212,170,0.1)' : 'rgba(255,255,255,0.05)',
                    color: item.visible ? tokens.accent : tokens.textMuted,
                  }}>{item.visible ? 'Visible' : 'Hidden'}</button>

                  {/* Featured toggle */}
                  <button onClick={() => updateItem(item.id, { featured: !item.featured })} style={{
                    fontSize: 10, cursor: 'pointer', border: 'none', borderRadius: 4,
                    padding: '3px 8px', fontFamily: tokens.font, fontWeight: 700,
                    background: item.featured ? 'rgba(249,168,37,0.15)' : 'rgba(255,255,255,0.05)',
                    color: item.featured ? tokens.credits : tokens.textMuted,
                  }}>{item.featured ? '★ Featured' : 'Feature'}</button>

                  <div style={{ fontSize: 11, color: tokens.textMuted }}>{item.type}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'transactions' && (
        <div>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by player or item…"
            style={{
              width: '100%', maxWidth: 320, boxSizing: 'border-box', marginBottom: 14,
              background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 8, padding: '7px 12px', fontSize: 12, color: tokens.text,
              fontFamily: tokens.font, outline: 'none',
            }}
          />
          {txLoading && <div style={{ color: tokens.textMuted, padding: 20 }}>Loading…</div>}
          {txError   && <div style={{ color: tokens.loss,     padding: 20 }}>{txError}</div>}
          {!txLoading && !txError && (
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, overflow: 'hidden' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 70px 130px', gap: 8, padding: '8px 14px', borderBottom: '1px solid rgba(255,255,255,0.07)', fontSize: 9, color: tokens.textMuted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8 }}>
                <div>Player</div><div>Item</div><div>Credits</div><div>Date</div>
              </div>
              {rows.map(r => (
                <div key={r.id} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 70px 130px', gap: 8, padding: '8px 14px', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <div style={{ fontSize: 12, color: tokens.text }}>{r.player_username}</div>
                  <div style={{ fontSize: 12, color: tokens.textMuted }}>{r.item_name}</div>
                  <div style={{ fontSize: 11, color: tokens.credits }}>{r.amount} cr</div>
                  <div style={{ fontSize: 11, color: tokens.textMuted }}>{new Date(r.created_at).toLocaleString()}</div>
                </div>
              ))}
              {rows.length === 0 && <div style={{ padding: 24, textAlign: 'center', color: tokens.textMuted, fontSize: 13 }}>No transactions found.</div>}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ShopManager;
```

- [ ] **Step 3: Verify TypeScript + smoke test**

```bash
npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add src/hooks/useAdminTransactions.ts src/components/admin/ShopManager.tsx
git commit -m "feat: useAdminTransactions + ShopManager (items + transactions)"
```

---

## Task 10: `useAiConfig` + `AiTuner` + wire `aiPlayer.ts`

**Files:**
- Create: `src/hooks/useAiConfig.ts`
- Modify: `src/components/admin/AiTuner.tsx` (replace placeholder)
- Modify: `src/ai/aiPlayer.ts`

- [ ] **Step 1: Write `useAiConfig`**

```typescript
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface AiConfigValues {
  medium: { win_rule_strength: number; poison_filter_strength: number };
  hard:   { win_rule_strength: number; poison_filter_strength: number; minimax_depth: number };
}

// Fallback to hardcoded defaults if DB is unavailable
export const AI_CONFIG_DEFAULTS: AiConfigValues = {
  medium: { win_rule_strength: 80, poison_filter_strength: 70 },
  hard:   { win_rule_strength: 95, poison_filter_strength: 90, minimax_depth: 3 },
};

export function useAiConfig() {
  const [config, setConfig]   = useState<AiConfigValues>(AI_CONFIG_DEFAULTS);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    const { data } = await supabase.from('ai_config').select('difficulty,rule_name,strength');
    if (!data) { setLoading(false); return; }

    const next = structuredClone(AI_CONFIG_DEFAULTS);
    for (const row of data as { difficulty: string; rule_name: string; strength: number }[]) {
      if (row.difficulty === 'medium') {
        if (row.rule_name === 'win_rule_strength')      next.medium.win_rule_strength      = row.strength;
        if (row.rule_name === 'poison_filter_strength') next.medium.poison_filter_strength = row.strength;
      }
      if (row.difficulty === 'hard') {
        if (row.rule_name === 'win_rule_strength')      next.hard.win_rule_strength      = row.strength;
        if (row.rule_name === 'poison_filter_strength') next.hard.poison_filter_strength = row.strength;
        if (row.rule_name === 'minimax_depth')          next.hard.minimax_depth          = row.strength;
      }
    }
    setConfig(next);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { config, loading, refetch: fetch };
}
```

- [ ] **Step 2: Extend `aiPlayer.ts` to accept optional config**

In `src/ai/aiPlayer.ts`, update `mediumMove` and `hardMove` signatures:

```typescript
// Add this type near the top (after existing exports):
export interface AiConfig {
  winRuleStrength:      number;
  poisonFilterStrength: number;
  minimaxDepth?:        number;
}

// Update mediumMove:
export function mediumMove(game: Game, config?: AiConfig): Move {
  const winStrength    = config?.winRuleStrength      ?? MEDIUM_WIN_RULE_STRENGTH;
  const poisonStrength = config?.poisonFilterStrength ?? MEDIUM_POISON_RULE_STRENGTH;
  // ... replace MEDIUM_WIN_RULE_STRENGTH with winStrength,
  //     replace MEDIUM_POISON_RULE_STRENGTH with poisonStrength
  // (rest of function unchanged)
}

// Update hardMove:
export function hardMove(game: Game, config?: AiConfig): Move {
  const winStrength    = config?.winRuleStrength      ?? HARD_WIN_RULE_STRENGTH;
  const poisonStrength = config?.poisonFilterStrength ?? HARD_POISON_RULE_STRENGTH;
  const depth          = config?.minimaxDepth         ?? HARD_MINIMAX_DEPTH;
  // ... replace HARD_WIN_RULE_STRENGTH with winStrength,
  //     replace HARD_POISON_RULE_STRENGTH with poisonStrength,
  //     replace HARD_MINIMAX_DEPTH with depth
  // (rest of function unchanged)
}
```

The constants remain as defaults — no other callers break. Find where `mediumMove` and `hardMove` are called (search `src/` for these function names) and update the call sites to pass `useAiConfig().config` values translated to the `AiConfig` shape.

- [ ] **Step 3: Replace `AiTuner` placeholder**

```typescript
import React, { useState, useEffect } from 'react';
import { useAiConfig, AiConfigValues, AI_CONFIG_DEFAULTS } from '../../hooks/useAiConfig';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { tokens } from '../../styles/tokens';
import PrimaryButton from '../common/PrimaryButton';

type Difficulty = 'medium' | 'hard';

interface SliderProps {
  label: string;
  description: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}

const RuleSlider: React.FC<SliderProps> = ({ label, description, value, min, max, onChange }) => (
  <div style={{
    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 8, padding: '12px 14px', marginBottom: 10,
  }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
      <div>
        <div style={{ fontSize: 12, fontWeight: 700, color: tokens.text }}>{label}</div>
        <div style={{ fontSize: 10, color: tokens.textMuted, marginTop: 2 }}>{description}</div>
      </div>
      <div style={{ fontSize: 14, fontWeight: 800, color: tokens.accent, minWidth: 28, textAlign: 'right' }}>
        {value}
      </div>
    </div>
    <input
      type="range" min={min} max={max} step={1} value={value}
      onChange={e => onChange(Number(e.target.value))}
      style={{ width: '100%', maxWidth: 340, accentColor: tokens.accent, cursor: 'pointer' }}
    />
    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, maxWidth: 340 }}>
      <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)' }}>{min} — {min === 0 ? 'random' : 'min'}</span>
      <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)' }}>{max} — {max === 100 ? 'always' : 'max'}</span>
    </div>
  </div>
);

const AiTuner: React.FC = () => {
  const { config: saved, loading, refetch } = useAiConfig();
  const { user } = useAuth();
  const [tab, setTab]       = useState<Difficulty>('medium');
  const [local, setLocal]   = useState<AiConfigValues>(AI_CONFIG_DEFAULTS);
  const [dirty, setDirty]   = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  useEffect(() => { if (!loading) { setLocal(saved); setDirty(false); } }, [saved, loading]);

  const set = (difficulty: Difficulty, rule: string, value: number) => {
    setLocal(prev => ({
      ...prev,
      [difficulty]: { ...prev[difficulty], [rule]: value },
    }));
    setDirty(true);
    setSaveMsg(null);
  };

  const handleSave = async () => {
    setSaving(true);
    const rows = [
      { difficulty: 'medium', rule_name: 'win_rule_strength',      strength: local.medium.win_rule_strength,      updated_by: user?.id },
      { difficulty: 'medium', rule_name: 'poison_filter_strength', strength: local.medium.poison_filter_strength, updated_by: user?.id },
      { difficulty: 'hard',   rule_name: 'win_rule_strength',      strength: local.hard.win_rule_strength,        updated_by: user?.id },
      { difficulty: 'hard',   rule_name: 'poison_filter_strength', strength: local.hard.poison_filter_strength,   updated_by: user?.id },
      { difficulty: 'hard',   rule_name: 'minimax_depth',          strength: local.hard.minimax_depth,            updated_by: user?.id },
    ];
    const { error } = await supabase.from('ai_config').upsert(rows, { onConflict: 'difficulty,rule_name' });
    setSaving(false);
    if (error) { setSaveMsg(`Error: ${error.message}`); return; }
    await refetch();
    setDirty(false);
    setSaveMsg('Saved! Changes take effect on the next game start.');
  };

  const tabStyle = (active: boolean): React.CSSProperties => ({
    padding: '5px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
    background: active ? 'rgba(0,212,170,0.18)' : 'rgba(255,255,255,0.04)',
    color: active ? tokens.accent : tokens.textMuted,
    fontWeight: active ? 800 : 500, fontSize: 12, fontFamily: tokens.font,
  });

  return (
    <div style={{ fontFamily: tokens.font }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 800, color: tokens.text }}>AI Difficulty Tuner</div>
          <div style={{ fontSize: 11, color: tokens.textMuted, marginTop: 2 }}>Changes take effect on the next game start</div>
        </div>
        <PrimaryButton onClick={handleSave} disabled={!dirty || saving}>
          {saving ? 'Saving…' : dirty ? 'Save Changes' : 'Saved'}
        </PrimaryButton>
      </div>

      {saveMsg && (
        <div style={{ marginBottom: 14, padding: '8px 14px', borderRadius: 8, background: 'rgba(0,212,170,0.08)', border: `1px solid ${tokens.accent}`, fontSize: 12, color: tokens.accent }}>
          {saveMsg}
        </div>
      )}

      <div style={{ display: 'flex', background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: 3, width: 'fit-content', marginBottom: 20 }}>
        <button style={tabStyle(tab === 'medium')} onClick={() => setTab('medium')}>Medium</button>
        <button style={tabStyle(tab === 'hard')}   onClick={() => setTab('hard')}>Hard</button>
      </div>

      {loading ? (
        <div style={{ color: tokens.textMuted, padding: 20 }}>Loading…</div>
      ) : (
        <>
          <RuleSlider label="Win move strength" description="Probability the AI takes a winning micro-board move" min={0} max={100} value={tab === 'medium' ? local.medium.win_rule_strength : local.hard.win_rule_strength} onChange={v => set(tab, 'win_rule_strength', v)} />
          <RuleSlider label="Poison filter strength" description="Probability the AI avoids sending opponent to a board they can win" min={0} max={100} value={tab === 'medium' ? local.medium.poison_filter_strength : local.hard.poison_filter_strength} onChange={v => set(tab, 'poison_filter_strength', v)} />
          {tab === 'hard' && (
            <RuleSlider label="Minimax depth" description="How many moves ahead the AI looks (higher = harder, slower)" min={1} max={5} value={local.hard.minimax_depth} onChange={v => set('hard', 'minimax_depth', v)} />
          )}
        </>
      )}
    </div>
  );
};

export default AiTuner;
```

- [ ] **Step 4: Wire config into the call site in `GameWrapper.tsx`**

The only call site is `src/components/GameWrapper.tsx:128`. It currently uses a difficulty map:
```typescript
const moveMap = { easy: easyMove, medium: mediumMove, hard: hardMove };
```

Update `GameWrapper.tsx`:

1. Import and call `useAiConfig` at the top of the component:
```typescript
import { useAiConfig } from '../hooks/useAiConfig';
// inside GameWrapper:
const { config: aiConfig } = useAiConfig();
```

2. Replace the `moveMap` call with a helper that passes the config:
```typescript
// Replace the moveMap lookup + call with this function:
function getAiMove(difficulty: 'easy' | 'medium' | 'hard', game: Game): Move {
  if (difficulty === 'easy')   return easyMove(game);
  if (difficulty === 'medium') return mediumMove(game, {
    winRuleStrength:      aiConfig.medium.win_rule_strength,
    poisonFilterStrength: aiConfig.medium.poison_filter_strength,
  });
  return hardMove(game, {
    winRuleStrength:      aiConfig.hard.win_rule_strength,
    poisonFilterStrength: aiConfig.hard.poison_filter_strength,
    minimaxDepth:         aiConfig.hard.minimax_depth,
  });
}
// Then use getAiMove(difficulty, game) wherever moveMap[difficulty](game) was called.
```

- [ ] **Step 5: Verify TypeScript compiles cleanly**

```bash
npx tsc --noEmit
```

- [ ] **Step 6: Commit**

```bash
git add src/hooks/useAiConfig.ts src/components/admin/AiTuner.tsx src/ai/aiPlayer.ts
git commit -m "feat: useAiConfig + AiTuner + wire aiPlayer to read from ai_config"
```

---

## Task 11: Fix `useShop.ts`

**Files:**
- Modify: `src/hooks/useShop.ts`

- [ ] **Step 1: Add `archived` filter and expand type union**

In `src/hooks/useShop.ts`:

1. Add `.eq('archived', false)` to the `cosmetic_items` query chain (alongside the existing `.eq('source', 'shop').gt('price', 0)`)
2. Update `ShopItem.type` from `'avatar' | 'banner' | 'board' | 'marker' | 'theme'` to include `'badge' | 'emoji'`

Result:
```typescript
export interface ShopItem {
  id: string;
  name: string;
  type: 'avatar' | 'badge' | 'banner' | 'board' | 'emoji' | 'marker' | 'theme';
  asset_url: string | null;
  price: number;
  rarity: string;
  owned: boolean;
}

// In the query:
supabase
  .from('cosmetic_items')
  .select('id, name, type, asset_url, price, rarity')
  .eq('source', 'shop')
  .eq('archived', false)   // ← add this
  .gt('price', 0),
```

- [ ] **Step 2: Verify TypeScript compiles cleanly**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useShop.ts
git commit -m "fix: exclude archived items from shop, expand ShopItem type union"
```

---

## Task 12: Full smoke test

- [ ] **Step 1: Start the dev server**

```bash
npm start
```

- [ ] **Step 2: Test editor role**

Insert a row in `admin_roles` via Supabase dashboard with `role = 'editor'` for a test account.
Log in as that account and verify:
- "Admin" link appears in the nav
- `/admin/skins` loads with the full table
- `/admin/achievements` and `/admin/emojis` load correctly
- `/admin/shop` and `/admin/ai-tuner` redirect to `/admin/skins`

- [ ] **Step 3: Test super_admin role**

Change the role to `super_admin` in Supabase. Reload and verify:
- All 5 nav links appear (Skins, Achievements, Emojis + divider + Shop, AI Tuner)
- Shop loads with Items and Transactions tabs
- AI Tuner loads with Medium/Hard sliders at 340px width
- Saving a slider change and reloading confirms the DB value persisted

- [ ] **Step 4: Test add + edit flow**

- Add a new skin via the modal — confirm it appears in the table
- Upload an asset file — confirm the preview renders after upload
- Edit the skin — confirm changes persist
- Archive the skin — confirm it appears dimmed with strikethrough
- Restore it — confirm it returns to normal
- Confirm the archived skin does NOT appear in the `/shop` page

- [ ] **Step 5: Verify regular users are unaffected**

Log in as a non-admin account:
- "Admin" link does NOT appear in nav
- Navigating to `/admin/skins` directly redirects to `/menu`
- `/shop` still shows all non-archived items correctly

- [ ] **Step 6: Final commit if any fixups needed**

```bash
git add -p
git commit -m "fix: Phase 7 smoke test fixups"
```

---

## Post-implementation checklist

- [ ] `npx tsc --noEmit` passes with no errors
- [ ] Non-admins cannot access `/admin/*` (redirect to `/menu`)
- [ ] Editors can access Skins, Achievements, Emojis — redirected from Shop/AI Tuner
- [ ] Super admins can access all 5 sections
- [ ] Add/Edit/Archive/Restore flow works for Skins and Emojis
- [ ] Asset upload populates `asset_url` and shows live preview
- [ ] Achievements add/edit persists to DB
- [ ] Shop items: visible/featured toggles work inline
- [ ] Transaction history loads and is searchable
- [ ] AI Tuner saves all rules to `ai_config`; game AI reads from DB on next start
- [ ] Archived items do not appear in the player-facing shop
