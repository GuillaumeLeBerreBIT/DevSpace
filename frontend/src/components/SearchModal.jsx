import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Icon } from './Icon';
import { useSearch } from '../hooks/useSearch';

// Maps each result category to a display label and icon
const CATEGORIES = [
  { key: 'tasks',    label: 'Tasks',    icon: 'list'    },
  { key: 'docs',     label: 'Docs',     icon: 'docs'    },
  { key: 'snippets', label: 'Snippets', icon: 'code'    },
  { key: 'devlog',   label: 'Dev log',  icon: 'log'     },
  { key: 'projects', label: 'Projects', icon: 'box'     },
];

const TYPE_COLORS = {
  Feature: 'var(--blue)', Bug: 'var(--red)', Fix: 'var(--amber)',
  Chore: 'var(--fg-dim)', Idea: 'var(--green)', Docs: 'var(--accent)',
};

// Flatten grouped results into a single ordered list for keyboard nav
function flattenResults(results) {
  if (!results) return [];
  const flat = [];
  for (const { key } of CATEGORIES) {
    for (const item of results[key] || []) {
      flat.push({ ...item, _type: key });
    }
  }
  return flat;
}

export const SearchModal = ({ onClose, onNavigate }) => {
  const [query, setQuery] = useState('');
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  const { data: results, isFetching } = useSearch(query);

  const flat = flattenResults(results);

  // Keep cursor in bounds when results change
  useEffect(() => {
    setCursor(0);
  }, [results]);

  // Scroll active item into view
  useEffect(() => {
    const el = listRef.current?.querySelector('[data-active="true"]');
    el?.scrollIntoView({ block: 'nearest' });
  }, [cursor]);

  const handleSelect = useCallback((item) => {
    onNavigate(item);
    onClose();
  }, [onNavigate, onClose]);

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setCursor(c => Math.min(c + 1, flat.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setCursor(c => Math.max(c - 1, 0));
    } else if (e.key === 'Enter' && flat[cursor]) {
      e.preventDefault();
      handleSelect(flat[cursor]);
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  const hasResults = flat.length > 0;
  const showEmpty = query.trim().length >= 2 && !isFetching && !hasResults;

  // Build a cursor-index lookup: for each category, which flat index does it start at?
  let globalIndex = 0;

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: '12vh' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ width: '100%', maxWidth: 600, background: 'var(--bg-surface)', borderRadius: 12, border: '1px solid var(--border)', boxShadow: '0 24px 64px rgba(0,0,0,0.5)', overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '70vh' }}>

        {/* Search input */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderBottom: '1px solid var(--border-subtle)' }}>
          <Icon name="search" size={16} style={{ color: 'var(--fg-dim)', flexShrink: 0 }} />
          <input
            ref={inputRef}
            autoFocus
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search tasks, docs, snippets…"
            style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: 15, color: 'var(--fg)', '::placeholder': { color: 'var(--fg-faint)' } }}
          />
          {isFetching && (
            <span style={{ fontSize: 11, color: 'var(--fg-faint)', fontFamily: 'var(--font-mono)' }}>searching…</span>
          )}
          <kbd style={{ fontSize: 11, color: 'var(--fg-faint)', background: 'var(--bg-surface-2)', border: '1px solid var(--border)', borderRadius: 4, padding: '2px 6px', flexShrink: 0 }}>esc</kbd>
        </div>

        {/* Results */}
        <div ref={listRef} style={{ overflowY: 'auto', flex: 1 }}>
          {query.trim().length < 2 && (
            <div style={{ padding: '20px 16px', textAlign: 'center', color: 'var(--fg-faint)', fontSize: 13 }}>
              Type at least 2 characters to search
            </div>
          )}

          {showEmpty && (
            <div style={{ padding: '20px 16px', textAlign: 'center', color: 'var(--fg-faint)', fontSize: 13 }}>
              No results for "{query}"
            </div>
          )}

          {hasResults && CATEGORIES.map(({ key, label, icon }) => {
            const items = results[key] || [];
            if (items.length === 0) return null;

            return (
              <div key={key}>
                {/* Category header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px 4px', fontSize: 11, fontWeight: 600, color: 'var(--fg-faint)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  <Icon name={icon} size={12} />
                  {label}
                </div>

                {/* Result rows */}
                {items.map((item) => {
                  const isActive = flat[cursor]?._type === key && flat[cursor]?.id === item.id;
                  globalIndex++;

                  return (
                    <button
                      key={`${key}-${item.id}`}
                      data-active={isActive}
                      onClick={() => handleSelect({ ...item, _type: key })}
                      style={{
                        width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                        padding: '8px 16px', background: isActive ? 'var(--bg-surface-2)' : 'transparent',
                        border: 'none', cursor: 'pointer', textAlign: 'left',
                        borderLeft: isActive ? '2px solid var(--accent)' : '2px solid transparent',
                        transition: 'background 0.1s',
                      }}
                    >
                      <ResultRow item={item} type={key} />
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Footer hint */}
        {hasResults && (
          <div style={{ padding: '8px 16px', borderTop: '1px solid var(--border-subtle)', display: 'flex', gap: 16, fontSize: 11, color: 'var(--fg-faint)' }}>
            <span><kbd style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border)', borderRadius: 3, padding: '1px 5px' }}>↑↓</kbd> navigate</span>
            <span><kbd style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border)', borderRadius: 3, padding: '1px 5px' }}>↵</kbd> select</span>
            <span><kbd style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border)', borderRadius: 3, padding: '1px 5px' }}>esc</kbd> close</span>
          </div>
        )}
      </div>
    </div>
  );
};

// Renders one result row differently per type
const ResultRow = ({ item, type }) => {
  if (type === 'tasks') {
    return (
      <>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-faint)', flexShrink: 0 }}>{item.id}</span>
        <span style={{ fontSize: 13, color: 'var(--fg)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</span>
        <span style={{ fontSize: 11, color: TYPE_COLORS[item.type] || 'var(--fg-dim)', flexShrink: 0 }}>{item.type}</span>
        <StatusDot status={item.status} />
      </>
    );
  }
  if (type === 'projects') {
    return (
      <>
        <span style={{ width: 8, height: 8, borderRadius: 50, background: item.color, flexShrink: 0 }} />
        <span style={{ fontSize: 13, color: 'var(--fg)', flex: 1 }}>{item.name}</span>
        <span style={{ fontSize: 11, color: 'var(--fg-faint)' }}>{item.status}</span>
      </>
    );
  }
  // docs, snippets, devlog — just title + optional context
  return (
    <>
      <span style={{ fontSize: 13, color: 'var(--fg)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</span>
      {type === 'snippets' && item.language && (
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-faint)', background: 'var(--bg-surface-2)', padding: '1px 6px', borderRadius: 4, border: '1px solid var(--border)' }}>{item.language}</span>
      )}
    </>
  );
};

const STATUS_COLORS = {
  'To do': 'var(--fg-dim)', 'In progress': 'var(--amber)', 'Blocked': 'var(--red)',
  'In review': 'var(--blue)', 'Done': 'var(--green)', 'Backlog': 'var(--fg-faint)',
};

const StatusDot = ({ status }) => (
  <span style={{ width: 7, height: 7, borderRadius: 50, background: STATUS_COLORS[status] || 'var(--fg-dim)', flexShrink: 0 }} />
);
