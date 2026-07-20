import React from 'react';

const URL_RE = /(https?:\/\/[^\s]+)/g;

// Splits plain text on raw URLs and turns them into clickable links —
// admins type/paste a URL directly into the content, no markdown syntax
// needed. Newlines become paragraph breaks.
export function linkifyContent(text: string, linkColor: string): React.ReactNode[] {
  return text.split('\n').map((line, li) => {
    // One capturing group in URL_RE means split() interleaves the matched
    // URLs at odd indices — checking index parity avoids re-testing a
    // stateful global regex (which would give wrong results on repeat calls).
    const parts = line.split(URL_RE);
    return (
      <p key={li} style={{ margin: li === 0 ? 0 : '0.75em 0 0' }}>
        {parts.map((part, pi) =>
          pi % 2 === 1
            ? <a key={pi} href={part} target="_blank" rel="noopener noreferrer" style={{ color: linkColor, wordBreak: 'break-all' as const }}>{part}</a>
            : <React.Fragment key={pi}>{part}</React.Fragment>
        )}
      </p>
    );
  });
}
