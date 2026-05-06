import React, { useState, useMemo } from 'react';
import { Icon } from '../Icon';
import { LabelChip } from '../Components';
import { DEVSPACE_DATA } from '../../data/data';

const { snippets: initialSnippets } = DEVSPACE_DATA;

const LANG_COLORS = {
  Python: '#3572A5',
  TypeScript: '#3178c6',
  JavaScript: '#f1e05a',
  SQL: '#e38c00',
  Bash: '#89e051',
  Rust: '#dea584',
  Go: '#00ADD8',
};

export const SnippetVaultView = () => {
  const [snippets] = useState(initialSnippets);
  const [search, setSearch] = useState('');
  const [langFilter, setLangFilter] = useState('All');
  const [activeSnippet, setActiveSnippet] = useState(snippets[0] || null);
  const [copied, setCopied] = useState(false);

  const languages = ['All', ...Array.from(new Set(snippets.map(s => s.language)))];

  const filtered = useMemo(() => {
    return snippets.filter(s => {
      if (langFilter !== 'All' && s.language !== langFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return s.title.toLowerCase().includes(q) || s.description.toLowerCase().includes(q) || s.tags.some(t => t.includes(q));
      }
      return true;
    });
  }, [snippets, langFilter, search]);

  const handleCopy = () => {
    if (!activeSnippet) return;
    navigator.clipboard.writeText(activeSnippet.code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
      {/* Snippet list */}
      <div style={{ width: 280, borderRight: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        {/* Search + filter */}
        <div style={{ padding: '12px 12px 10px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ position: 'relative' }}>
            <Icon name="search" size={13} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: 'var(--fg-dim)', pointerEvents: 'none' }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search snippets…"
              style={{ width: '100%', padding: '6px 10px 6px 28px', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 5, color: 'var(--fg)', fontSize: 12, outline: 'none' }}
            />
          </div>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {languages.map(lang => (
              <button
                key={lang}
                onClick={() => setLangFilter(lang)}
                style={{ padding: '2px 8px', borderRadius: 100, fontSize: 11, fontWeight: 500, background: langFilter === lang ? 'var(--accent-soft)' : 'var(--bg-surface-2)', color: langFilter === lang ? '#b3acef' : 'var(--fg-muted)', border: `1px solid ${langFilter === lang ? 'var(--accent-line)' : 'var(--border)'}`, cursor: 'pointer' }}
              >
                {lang}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
          {filtered.length === 0 ? (
            <div style={{ padding: 20, textAlign: 'center', color: 'var(--fg-faint)', fontSize: 12 }}>No snippets found</div>
          ) : filtered.map(s => (
            <button
              key={s.id}
              onClick={() => setActiveSnippet(s)}
              style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: '10px 10px', borderRadius: 7, width: '100%', textAlign: 'left', background: activeSnippet?.id === s.id ? 'var(--accent-soft)' : 'transparent', border: `1px solid ${activeSnippet?.id === s.id ? 'var(--accent-line)' : 'transparent'}`, cursor: 'pointer', marginBottom: 2 }}
              onMouseEnter={e => { if (activeSnippet?.id !== s.id) e.currentTarget.style.background = 'var(--bg-hover)'; }}
              onMouseLeave={e => { if (activeSnippet?.id !== s.id) e.currentTarget.style.background = 'transparent'; }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 8, height: 8, borderRadius: 50, background: LANG_COLORS[s.language] || 'var(--fg-dim)', flexShrink: 0 }} />
                <span style={{ fontSize: 12, fontWeight: 500, color: activeSnippet?.id === s.id ? 'var(--fg)' : 'var(--fg)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.title}</span>
              </div>
              <span style={{ fontSize: 11, color: 'var(--fg-dim)', paddingLeft: 16, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.description}</span>
            </button>
          ))}
        </div>

        <div style={{ padding: '10px', borderTop: '1px solid var(--border-subtle)' }}>
          <button className="btn btn--ghost btn--sm" style={{ width: '100%', justifyContent: 'center' }}>
            <Icon name="plus" size={13} />
            New snippet
          </button>
        </div>
      </div>

      {/* Snippet detail */}
      {activeSnippet ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Header */}
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 50, background: LANG_COLORS[activeSnippet.language] || 'var(--fg-dim)' }} />
                  <span style={{ fontSize: 12, color: 'var(--fg-muted)' }}>{activeSnippet.language}</span>
                </div>
                <h2 style={{ margin: 0, fontSize: 15, fontWeight: 500, color: 'var(--fg)' }}>{activeSnippet.title}</h2>
                <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--fg-muted)' }}>{activeSnippet.description}</p>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button className="btn btn--sm" onClick={handleCopy}>
                  <Icon name={copied ? 'check' : 'copy'} size={13} />
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 4, marginTop: 10, flexWrap: 'wrap' }}>
              {activeSnippet.tags.map(tag => (
                <LabelChip key={tag} label={tag} />
              ))}
            </div>
          </div>

          {/* Code */}
          <div style={{ flex: 1, overflow: 'auto', padding: '20px' }}>
            <pre style={{ margin: 0, background: 'var(--bg-surface-2)', border: '1px solid var(--border)', borderRadius: 8, padding: '16px 20px', fontFamily: 'var(--font-mono)', fontSize: 12, lineHeight: 1.7, color: 'var(--fg)', overflow: 'auto', whiteSpace: 'pre' }}>
              <code>{activeSnippet.code}</code>
            </pre>
          </div>
        </div>
      ) : (
        <div style={{ flex: 1, display: 'grid', placeItems: 'center', color: 'var(--fg-faint)', fontSize: 13 }}>
          Select a snippet to view
        </div>
      )}
    </div>
  );
};
