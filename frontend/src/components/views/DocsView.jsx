import React, { useState } from 'react';
import { Icon } from '../Icon';
import { DEVSPACE_DATA } from '../../data/data';

const { docPages } = DEVSPACE_DATA;

const PLACEHOLDER_CONTENT = {
  overview: {
    title: 'Overview',
    content: `# DevSpace Overview

DevSpace is a personal project management tool built for solo developers and small indie teams. It combines sprint planning, bug tracking, docs, and a dev log in one dark-mode-first interface.

## Why DevSpace?

Most project management tools are optimized for big teams. DevSpace is optimized for a single developer who needs to:

- Track tasks across multiple projects
- Run lightweight sprints without ceremony
- Keep a dev log alongside the code
- Document decisions and architecture

## Current status

Version 0.4 is in active development. Sprint 12 is focused on stabilizing the Kanban DnD and cleaning up empty states.`,
  },
  architecture: {
    title: 'Architecture',
    content: `# Architecture

## Frontend

React 18 + TypeScript, bundled with Vite. State managed with Zustand — one slice per domain (sprint, board, project).

## Backend

Hono + tRPC on Fly.io. tRPC gives end-to-end type safety without a codegen step.

## Database

Neon Postgres (serverless). Drizzle ORM for schema + migrations.

## Auth

Clerk — single-tenant setup. No multi-user complexity for now.`,
  },
  decisions: {
    title: 'Decision log',
    content: `# Decision Log

## 2024-04-26 · Keep markdown, skip rich-text

Considered switching the editor to TipTap. Decided against — the whole point is that this is a developer tool, and markdown is the format devs already think in.

## 2024-04-28 · Use react-dnd over dnd-kit

Tried dnd-kit first — beautiful API, but the drop animation lagged on lists >50 items. react-dnd is older but the HTML5 backend is rock solid.

## 2024-04-20 · Defer React 19 upgrade

react-dnd compatibility unknown. Tracked as DS-074.`,
  },
  shortcuts: {
    title: 'Keyboard shortcuts',
    content: `# Keyboard shortcuts

| Shortcut | Action |
|----------|--------|
| ⌘K | Command palette |
| ⌘B | Toggle sidebar |
| ⌘/ | Focus search |
| ⌘N | New task |
| Esc | Close panel / modal |
| ⌘↵ | Save (in editors) |

*Editor shortcuts*

| Shortcut | Action |
|----------|--------|
| ⌘B | Bold |
| ⌘I | Italic |
| ⌘K | Insert link |`,
  },
};

export const DocsView = ({ project }) => {
  const [activePage, setActivePage] = useState('overview');
  const [saveStatus, setSaveStatus] = useState('saved'); // 'saved' | 'saving'
  const [content, setContent] = useState(
    Object.fromEntries(docPages.map(p => [p.id, PLACEHOLDER_CONTENT[p.id]?.content || `# ${p.title}\n\nStart writing…`]))
  );

  const page = docPages.find(p => p.id === activePage);
  const pageContent = content[activePage] || '';

  const handleContentChange = (val) => {
    setContent(prev => ({ ...prev, [activePage]: val }));
    setSaveStatus('saving');
    clearTimeout(window._docSaveTimer);
    window._docSaveTimer = setTimeout(() => setSaveStatus('saved'), 1000);
  };

  return (
    <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
      {/* Doc sidebar */}
      <div style={{ width: 200, borderRight: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ padding: '14px 12px 10px', borderBottom: '1px solid var(--border-subtle)' }}>
          <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--fg-faint)', fontWeight: 500 }}>Pages</span>
        </div>
        <div style={{ padding: '8px 8px', flex: 1, overflowY: 'auto' }}>
          {docPages.map(p => (
            <button
              key={p.id}
              onClick={() => setActivePage(p.id)}
              className={`nav-item${activePage === p.id ? ' nav-item--active' : ''}`}
            >
              <Icon name={p.icon} size={14} className="nav-item__icon" />
              {p.title}
            </button>
          ))}
        </div>
        <div style={{ padding: '10px 10px', borderTop: '1px solid var(--border-subtle)' }}>
          <button className="btn btn--ghost btn--sm" style={{ width: '100%', justifyContent: 'center' }}>
            <Icon name="plus" size={13} />
            New page
          </button>
        </div>
      </div>

      {/* Editor area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Editor toolbar */}
        <div style={{ padding: '10px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--fg)' }}>{page?.title}</span>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--fg-faint)' }}>
              {saveStatus === 'saving' ? 'Saving…' : 'Saved'}
            </span>
            <div style={{ display: 'flex', gap: 2 }}>
              {[
                { icon: 'bold', title: 'Bold' },
                { icon: 'italic', title: 'Italic' },
                { icon: 'h1', title: 'H1' },
                { icon: 'h2', title: 'H2' },
                { icon: 'inlineCode', title: 'Inline code' },
                { icon: 'codeBlock', title: 'Code block' },
                { icon: 'link', title: 'Link' },
                { icon: 'divider', title: 'Divider' },
              ].map(tool => (
                <button key={tool.icon} title={tool.title} className="btn btn--ghost btn--icon btn--sm">
                  <Icon name={tool.icon} size={14} />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Textarea */}
        <div style={{ flex: 1, overflow: 'hidden', padding: '24px 40px' }}>
          <textarea
            value={pageContent}
            onChange={e => handleContentChange(e.target.value)}
            style={{
              width: '100%', height: '100%',
              background: 'transparent', border: 'none', outline: 'none',
              color: 'var(--fg)', fontFamily: 'var(--font-mono)', fontSize: 13,
              lineHeight: 1.7, resize: 'none',
            }}
            spellCheck={false}
          />
        </div>
      </div>
    </div>
  );
};
