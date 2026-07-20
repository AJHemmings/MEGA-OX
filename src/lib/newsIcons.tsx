import React from 'react';

// Small preset set of link icons for news articles (Discord, Reddit, store
// page, etc.). Simplified generic glyphs matching this app's hand-drawn icon
// style (see src/components/icons) rather than exact brand marks — these are
// link-type indicators, not brand assets.

export const NEWS_ICON_PRESETS = ['discord', 'reddit', 'twitter', 'youtube', 'website', 'store'] as const;
export type NewsIconPreset = typeof NEWS_ICON_PRESETS[number];

export const NEWS_ICON_LABELS: Record<NewsIconPreset, string> = {
  discord: 'Discord',
  reddit: 'Reddit',
  twitter: 'X / Twitter',
  youtube: 'YouTube',
  website: 'Website',
  store: 'Store Page',
};

type IconFC = React.FC<{ size?: number }>;

const Discord: IconFC = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <rect x="3" y="8" width="18" height="10" rx="5" />
    <circle cx="9" cy="13" r="1.2" fill="currentColor" stroke="none" />
    <circle cx="15" cy="13" r="1.2" fill="currentColor" stroke="none" />
    <path d="M8 8l1-3h6l1 3" />
  </svg>
);

const Reddit: IconFC = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <circle cx="12" cy="14" r="7" />
    <circle cx="9" cy="14" r="1" fill="currentColor" stroke="none" />
    <circle cx="15" cy="14" r="1" fill="currentColor" stroke="none" />
    <path d="M8.5 17.5c1 .8 2.2 1.2 3.5 1.2s2.5-.4 3.5-1.2" />
    <path d="M12 7V3M12 3l3 1.5" />
    <circle cx="18" cy="10" r="1.4" />
  </svg>
);

const Twitter: IconFC = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M4 4l7.5 9.5L4.5 20h2.4l6-6.7 4.6 6.7H21l-7.8-9.9L19.8 4h-2.4l-5.5 6.2L7.1 4z" />
  </svg>
);

const YouTube: IconFC = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <rect x="3" y="6" width="18" height="12" rx="4" />
    <polygon points="10,9.5 10,14.5 15,12" fill="currentColor" stroke="none" />
  </svg>
);

const Website: IconFC = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18M12 3c2.4 2.5 3.6 5.5 3.6 9s-1.2 6.5-3.6 9c-2.4-2.5-3.6-5.5-3.6-9s1.2-6.5 3.6-9z" />
  </svg>
);

const Store: IconFC = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M4 9l1-5h14l1 5" />
    <path d="M4 9a2.5 2.5 0 0 0 5 0 2.5 2.5 0 0 0 5 0 2.5 2.5 0 0 0 5 0" />
    <path d="M5 9v10h14V9" />
    <path d="M10 19v-5h4v5" />
  </svg>
);

export const NEWS_ICON_COMPONENTS: Record<NewsIconPreset, IconFC> = {
  discord: Discord,
  reddit: Reddit,
  twitter: Twitter,
  youtube: YouTube,
  website: Website,
  store: Store,
};

export const LinkIcon: IconFC = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M9 15l6-6" />
    <path d="M11 6l1-1a3.5 3.5 0 0 1 5 5l-1 1M13 18l-1 1a3.5 3.5 0 0 1-5-5l1-1" />
  </svg>
);
