import React, { useState, useEffect, useRef } from 'react';
import { Icon } from '../Icon';
import { Button } from '../ui/button';
import { useDocs, useCreateDoc, useUpdateDoc, useDeleteDoc } from '../../hooks/useDocs';

// Markdown insertion specs.
// `wrap`: surrounds the current selection (e.g. **bold**)
// `prefix`: prepends to the start of the current line (e.g. # heading)
// `block`: inserts a multi-line block (code fence, divider)
const TOOLBAR_ACTIONS = [
  { icon: 'bold',       title: 'Bold (⌘B)',       wrap: '**', placeholder: 'bold text' },
  { icon: 'italic',     title: 'Italic (⌘I)',     wrap: '*',  placeholder: 'italic text' },
  { icon: 'h1',         title: 'Heading 1',       prefix: '# ' },
  { icon: 'h2',         title: 'Heading 2',       prefix: '## ' },
  { icon: 'inlineCode', title: 'Inline code',     wrap: '`',  placeholder: 'code' },
  { icon: 'codeBlock',  title: 'Code block',      block: '\n```\n', blockEnd: '\n```\n', placeholder: 'code' },
  { icon: 'link',       title: 'Link (⌘K)',       link: true },
  { icon: 'divider',    title: 'Divider',         block: '\n---\n' },
];

export const DocsView = ({ project }) => {
  const { data: pages = [] } = useDocs(project.id);
  const createDoc = useCreateDoc();
  const updateDoc = useUpdateDoc();
  const deleteDoc = useDeleteDoc();
  const textareaRef = useRef(null);
  const saveTimerRef = useRef(null);

  const [activePageId, setActivePageId] = useState(null);
  const [content, setContent] = useState('');
  const [saveStatus, setSaveStatus] = useState('saved');

  // Set first page as active once pages load
  useEffect(() => {
    if (pages.length > 0 && !activePageId) {
      setActivePageId(pages[0].id);
    }
  }, [pages]);

  // Sync local content when active page changes (or its content reloads from server)
  const activePage = pages.find(p => p.id === activePageId);
  useEffect(() => {
    setContent(activePage?.content ?? '');
  }, [activePage?.id]);

  // Debounced save: write to the server after 1s of typing inactivity
  const scheduleSave = (val) => {
    if (!activePageId) return;
    setSaveStatus('saving');
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      updateDoc.mutate(
        { id: activePageId, content: val },
        { onSuccess: () => setSaveStatus('saved') }
      );
    }, 1000);
  };

  const handleContentChange = (val) => {
    setContent(val);
    scheduleSave(val);
  };

  const handleNewPage = () => {
    createDoc.mutate(
      { title: 'New page', content: '# New page\n\nStart writing…', project: project.id, order: pages.length },
      { onSuccess: (newPage) => setActivePageId(newPage.id) }
    );
  };

  const handleDeletePage = () => {
    if (!activePage) return;
    if (!window.confirm(`Delete "${activePage.title}"? This cannot be undone.`)) return;
    deleteDoc.mutate(
      { id: activePage.id, projectId: project.id },
      {
        onSuccess: () => {
          // Pick another page if any are left, otherwise clear selection
          const remaining = pages.filter(p => p.id !== activePage.id);
          setActivePageId(remaining[0]?.id ?? null);
        },
      }
    );
  };

  // Insert markdown into the textarea at the current selection.
  // After mutating the value we re-focus and re-position the cursor so
  // the user can keep typing without manually clicking back into the field.
  const applyMarkdown = (action) => {
    const ta = textareaRef.current;
    if (!ta) return;

    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = content.substring(start, end);
    let newContent = content;
    let newCursor = end;

    if (action.wrap) {
      // Wrap the selection with markers (e.g. **bold**)
      const inner = selected || action.placeholder || '';
      const insert = `${action.wrap}${inner}${action.wrap}`;
      newContent = content.substring(0, start) + insert + content.substring(end);
      newCursor = start + action.wrap.length + inner.length + action.wrap.length;
    } else if (action.prefix) {
      // Add a prefix to the start of the current line (e.g. "# ")
      const lineStart = content.lastIndexOf('\n', start - 1) + 1;
      newContent = content.substring(0, lineStart) + action.prefix + content.substring(lineStart);
      newCursor = end + action.prefix.length;
    } else if (action.link) {
      const text = selected || 'link text';
      const insert = `[${text}](url)`;
      newContent = content.substring(0, start) + insert + content.substring(end);
      // Place cursor inside (url) for fast editing
      newCursor = start + insert.length - 1;
    } else if (action.block) {
      const inner = selected || action.placeholder || '';
      const insert = `${action.block}${inner}${action.blockEnd ?? ''}`;
      newContent = content.substring(0, start) + insert + content.substring(end);
      newCursor = start + insert.length;
    }

    setContent(newContent);
    scheduleSave(newContent);

    // Need to wait a tick for React to flush the new value before we can move the cursor
    setTimeout(() => {
      ta.focus();
      ta.setSelectionRange(newCursor, newCursor);
    }, 0);
  };

  // Keyboard shortcuts: ⌘B, ⌘I, ⌘K
  const handleKeyDown = (e) => {
    if (!(e.metaKey || e.ctrlKey)) return;
    const key = e.key.toLowerCase();
    const shortcut = { b: 'bold', i: 'italic', k: 'link' }[key];
    if (!shortcut) return;
    const action = TOOLBAR_ACTIONS.find(a => a.icon === shortcut);
    if (action) {
      e.preventDefault();
      applyMarkdown(action);
    }
  };

  return (
    <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
      {/* Doc sidebar */}
      <div style={{ width: 200, borderRight: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ padding: '14px 12px 10px', borderBottom: '1px solid var(--border-subtle)' }}>
          <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--fg-faint)', fontWeight: 500 }}>Pages</span>
        </div>
        <div style={{ padding: '8px 8px', flex: 1, overflowY: 'auto' }}>
          {pages.map(p => (
            <button
              key={p.id}
              onClick={() => setActivePageId(p.id)}
              className={`nav-item${activePageId === p.id ? ' nav-item--active' : ''}`}
            >
              <Icon name="docs" size={14} className="nav-item__icon" />
              {p.title}
            </button>
          ))}
        </div>
        <div style={{ padding: '10px 10px', borderTop: '1px solid var(--border-subtle)' }}>
          <Button variant="ghost" size="sm" className="w-full justify-center" onClick={handleNewPage} disabled={createDoc.isPending}>
            <Icon name="plus" size={13} />
            New page
          </Button>
        </div>
      </div>

      {/* Editor area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Editor toolbar */}
        <div style={{ padding: '10px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--fg)' }}>{activePage?.title}</span>
          {activePage && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-muted-foreground hover:text-destructive"
              title="Delete page"
              onClick={handleDeletePage}
            >
              <Icon name="trash" size={12} />
            </Button>
          )}
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--fg-faint)' }}>
              {saveStatus === 'saving' ? 'Saving…' : 'Saved'}
            </span>
            <div style={{ display: 'flex', gap: 2 }}>
              {TOOLBAR_ACTIONS.map(action => (
                <Button
                  key={action.icon}
                  title={action.title}
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => applyMarkdown(action)}
                  disabled={!activePage}
                >
                  <Icon name={action.icon} size={14} />
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Textarea */}
        <div style={{ flex: 1, overflow: 'hidden', padding: '24px 40px' }}>
          {activePage ? (
            <textarea
              ref={textareaRef}
              value={content}
              onChange={e => handleContentChange(e.target.value)}
              onKeyDown={handleKeyDown}
              style={{
                width: '100%', height: '100%',
                background: 'transparent', border: 'none', outline: 'none',
                color: 'var(--fg)', fontFamily: 'var(--font-mono)', fontSize: 13,
                lineHeight: 1.7, resize: 'none',
              }}
              spellCheck={false}
            />
          ) : (
            <div style={{ color: 'var(--fg-faint)', fontSize: 13 }}>
              {pages.length === 0 ? 'No pages yet — create one to get started.' : 'Select a page'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
