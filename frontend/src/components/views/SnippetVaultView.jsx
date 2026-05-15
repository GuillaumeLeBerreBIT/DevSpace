import React, { useState, useMemo, useEffect } from 'react';
import { Icon } from '../Icon';
import { LabelChip } from '../Components';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { useSnippets, useDeleteSnippet } from '../../hooks/useSnippets';
import { CreateSnippetModal } from '../CreateSnippetModal';

// Color map keyed on the backend's short-code language values
const LANG_COLORS = {
  Python: '#3572A5',
  TS: '#3178c6',
  JS: '#f1e05a',
  SQL: '#e38c00',
  Bash: '#89e051',
  Other: '#9a9aa6',
};

// Friendly labels for short codes — shown in the UI
const LANG_LABELS = {
  JS: 'JavaScript',
  TS: 'TypeScript',
  Python: 'Python',
  Bash: 'Bash',
  SQL: 'SQL',
  Other: 'Other',
};

const formatLang = (code) => LANG_LABELS[code] || code;

export const SnippetVaultView = ({ project }) => {
  const { data: snippets = [] } = useSnippets(project?.id);
  const deleteSnippet = useDeleteSnippet();
  const [search, setSearch] = useState('');
  const [langFilter, setLangFilter] = useState('All');
  const [activeSnippet, setActiveSnippet] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [copied, setCopied] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Auto-select first snippet once data loads
  useEffect(() => {
    if (snippets.length > 0 && !activeSnippet) setActiveSnippet(snippets[0]);
  }, [snippets]);

  // If the active snippet is gone (e.g. just deleted), pick the next one
  useEffect(() => {
    if (activeSnippet && !snippets.find(s => s.id === activeSnippet.id)) {
      setActiveSnippet(snippets[0] || null);
      setConfirmDelete(false);
    }
  }, [snippets]);

  const languages = ['All', ...Array.from(new Set(snippets.map(s => s.language)))];

  const filtered = useMemo(() => {
    return snippets.filter(s => {
      if (langFilter !== 'All' && s.language !== langFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          s.title.toLowerCase().includes(q)
          || (s.description || '').toLowerCase().includes(q)
          || (s.tags || []).some(t => t.toLowerCase().includes(q))
        );
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

  const handleDelete = () => {
    if (!activeSnippet) return;
    deleteSnippet.mutate({ id: activeSnippet.id });
  };

  return (
    <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
      {/* Snippet list */}
      <div style={{ width: 280, borderRight: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        {/* Search + filter */}
        <div style={{ padding: '12px 12px 10px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div className="relative">
            <Icon name="search" size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search snippets…"
              className="pl-8 h-8 text-xs"
            />
          </div>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {languages.map(lang => (
              <button
                key={lang}
                onClick={() => setLangFilter(lang)}
                style={{ padding: '2px 8px', borderRadius: 100, fontSize: 11, fontWeight: 500, background: langFilter === lang ? 'var(--accent-soft)' : 'var(--bg-surface-2)', color: langFilter === lang ? '#b3acef' : 'var(--fg-muted)', border: `1px solid ${langFilter === lang ? 'var(--accent-line)' : 'var(--border)'}`, cursor: 'pointer' }}
              >
                {lang === 'All' ? 'All' : formatLang(lang)}
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
                <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--fg)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.title}</span>
              </div>
              <span style={{ fontSize: 11, color: 'var(--fg-dim)', paddingLeft: 16, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.description}</span>
            </button>
          ))}
        </div>

        <div className="p-2.5 border-t border-border">
          <Button variant="ghost" size="sm" className="w-full justify-center" onClick={() => setShowCreate(true)}>
            <Icon name="plus" size={13} />
            New snippet
          </Button>
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
                  <span style={{ fontSize: 12, color: 'var(--fg-muted)' }}>{formatLang(activeSnippet.language)}</span>
                </div>
                <h2 style={{ margin: 0, fontSize: 15, fontWeight: 500, color: 'var(--fg)' }}>{activeSnippet.title}</h2>
                <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--fg-muted)' }}>{activeSnippet.description}</p>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <Button size="sm" onClick={handleCopy}>
                  <Icon name={copied ? 'check' : 'copy'} size={13} />
                  {copied ? 'Copied!' : 'Copy'}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setConfirmDelete(true)} title="Delete snippet">
                  <Icon name="trash" size={13} />
                </Button>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 4, marginTop: 10, flexWrap: 'wrap' }}>
              {(activeSnippet.tags || []).map(tag => (
                <LabelChip key={tag} label={tag} />
              ))}
            </div>
            {confirmDelete && (
              <div style={{ marginTop: 12, padding: '10px 12px', background: 'rgba(229,72,77,0.08)', border: '1px solid var(--red)', borderRadius: 6, fontSize: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ flex: 1, color: 'var(--fg)' }}>Delete this snippet? This can't be undone.</span>
                <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(false)}>Cancel</Button>
                <Button size="sm" onClick={handleDelete} disabled={deleteSnippet.isPending} style={{ background: 'var(--red)', color: 'white' }}>
                  {deleteSnippet.isPending ? 'Deleting…' : 'Delete'}
                </Button>
              </div>
            )}
          </div>

          {/* Code */}
          <div style={{ flex: 1, overflow: 'auto', padding: '20px' }}>
            <pre style={{ margin: 0, background: 'var(--bg-surface-2)', border: '1px solid var(--border)', borderRadius: 8, padding: '16px 20px', fontFamily: 'var(--font-mono)', fontSize: 12, lineHeight: 1.7, color: 'var(--fg)', overflow: 'auto', whiteSpace: 'pre' }}>
              <code>{activeSnippet.code}</code>
            </pre>
          </div>
        </div>
      ) : (
        <div style={{ flex: 1, display: 'grid', placeItems: 'center', color: 'var(--fg-faint)', fontSize: 13, textAlign: 'center', padding: 40 }}>
          <div>
            <Icon name="snippet" size={28} style={{ display: 'block', margin: '0 auto 12px', opacity: 0.5 }} />
            <p style={{ margin: '0 0 14px' }}>No snippets yet</p>
            <Button size="sm" onClick={() => setShowCreate(true)}>
              <Icon name="plus" size={13} />
              Create your first snippet
            </Button>
          </div>
        </div>
      )}

      {showCreate && (
        <CreateSnippetModal
          projectId={project?.id}
          onClose={() => setShowCreate(false)}
          onCreated={(newSnippet) => setActiveSnippet(newSnippet)}
        />
      )}
    </div>
  );
};
