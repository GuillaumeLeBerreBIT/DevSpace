import { useState, useEffect, useRef, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Icon } from '../Icon';
import { Button } from '../ui/button';
import { Skeleton } from '../ui/skeleton';
import { EmptyState } from '../EmptyState';
import { useDocs, useCreateDoc, useUpdateDoc, useDeleteDoc } from '../../hooks/useDocs';
import { useSnippets } from '../../hooks/useSnippets';

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
  const { data: pages = [], isLoading: pagesLoading } = useDocs(project.id);
  const { data: snippets = [] } = useSnippets(project.id);
  const createDoc = useCreateDoc();
  const updateDoc = useUpdateDoc();
  const deleteDoc = useDeleteDoc();
  const textareaRef = useRef(null);
  const saveTimerRef = useRef(null);

  const [activePageId, setActivePageId] = useState(null);
  const [content, setContent] = useState('');
  const [saveStatus, setSaveStatus] = useState('saved');
  const [previewMode, setPreviewMode] = useState(false);
  const [showSnippetPicker, setShowSnippetPicker] = useState(false);

  // Map snippet id → snippet for fast lookup during markdown rendering
  const snippetMap = useMemo(() => {
    const m = new Map();
    snippets.forEach(s => m.set(String(s.id), s));
    return m;
  }, [snippets]);

  // Custom <a> renderer for ReactMarkdown.
  // Intercepts hrefs like "snippet:7" and renders an inline embedded snippet card.
  // Optional "?expanded" suffix renders the card already open.
  const markdownComponents = useMemo(() => ({
    a: ({ href, children, ...props }) => {
      if (href?.startsWith('snippet:')) {
        const rest = href.slice('snippet:'.length);
        const [idPart, query] = rest.split('?');
        const snippet = snippetMap.get(idPart);
        if (!snippet) {
          return <span style={{ color: 'var(--red)', fontSize: 12 }}>[missing snippet:{idPart}]</span>;
        }
        return <EmbeddedSnippet snippet={snippet} initialOpen={query === 'expanded'} label={children} />;
      }
      // External link: open in new tab, prevent SPA reload
      return <a href={href} target="_blank" rel="noopener noreferrer" {...props}>{children}</a>;
    },
  }), [snippetMap]);

  // ReactMarkdown sanitizes link URIs by default and strips unknown schemes
  // (including our `snippet:`). This identity transform preserves them — safe
  // here because all doc content is authored by the project's own owner.
  const urlTransform = (url) => url;

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

  // Insert a snippet link at the current cursor: [Title](snippet:ID)
  const insertSnippetLink = (snippet) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const insert = `[${snippet.title}](snippet:${snippet.id})`;
    const newContent = content.substring(0, start) + insert + content.substring(end);
    const newCursor = start + insert.length;
    setContent(newContent);
    scheduleSave(newContent);
    setShowSnippetPicker(false);
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
          {pagesLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: '4px 0' }}>
              {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-7 w-full rounded-md" />)}
            </div>
          ) : pages.map(p => (
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
                  disabled={!activePage || previewMode}
                >
                  <Icon name={action.icon} size={14} />
                </Button>
              ))}
              {/* Snippet picker — inserts a [Title](snippet:ID) link at the cursor */}
              <div style={{ position: 'relative' }}>
                <Button
                  title="Insert snippet link"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setShowSnippetPicker(s => !s)}
                  disabled={!activePage || previewMode}
                >
                  <Icon name="snippet" size={14} />
                </Button>
                {showSnippetPicker && (
                  <div
                    style={{
                      position: 'absolute', top: 'calc(100% + 4px)', right: 0, zIndex: 50,
                      width: 280, maxHeight: 320, overflowY: 'auto',
                      background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 8,
                      boxShadow: '0 8px 24px rgba(0,0,0,0.3)', padding: 4,
                    }}
                  >
                    {snippets.length === 0 ? (
                      <div style={{ padding: 12, fontSize: 12, color: 'var(--fg-faint)' }}>
                        No snippets in this project yet.
                      </div>
                    ) : (
                      snippets.map(s => (
                        <button
                          key={s.id}
                          onClick={() => insertSnippetLink(s)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                            padding: '8px 10px', textAlign: 'left',
                            background: 'transparent', border: 'none', cursor: 'pointer',
                            color: 'var(--fg)', fontSize: 12, borderRadius: 4,
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-surface-2)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          <Icon name="snippet" size={12} style={{ color: 'var(--fg-faint)', flexShrink: 0 }} />
                          <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {s.title}
                          </span>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--fg-faint)' }}>
                            {s.language}
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Preview/edit toggle — visually separated from format buttons */}
              <div style={{ width: 1, background: 'var(--border-subtle)', margin: '4px 4px' }} />
              <Button
                title={previewMode ? 'Edit raw markdown' : 'Preview rendered'}
                variant={previewMode ? 'default' : 'ghost'}
                size="icon"
                className="h-7 w-7"
                onClick={() => setPreviewMode(p => !p)}
                disabled={!activePage}
              >
                <Icon name={previewMode ? 'code' : 'eye'} size={14} />
              </Button>
            </div>
          </div>
        </div>

        {/* Editor / Preview */}
        <div style={{ flex: 1, overflow: previewMode ? 'auto' : 'hidden', padding: '24px 40px' }}>
          {activePage ? (
            previewMode ? (
              <div className="docs-prose">
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents} urlTransform={urlTransform}>{content}</ReactMarkdown>
              </div>
            ) : (
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
            )
          ) : (
            <EmptyState
              icon="docs"
              heading={pages.length === 0 ? 'No pages yet' : 'Select a page'}
              subtext={pages.length === 0 ? 'Create your first page to start documenting this project.' : undefined}
            />
          )}
        </div>
      </div>
    </div>
  );
};

// ─── EmbeddedSnippet ───────────────────────────────────────────────────────
// Rendered inline inside doc previews when a [label](snippet:ID) link is found.
// Collapsed by default — title bar with language + tag chips, click to expand.
const EmbeddedSnippet = ({ snippet, initialOpen = false, label }) => {
  const [open, setOpen] = useState(initialOpen);
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(snippet.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* clipboard unavailable */ }
  };

  // The label override lets users write [my custom label](snippet:7) and have
  // that text shown instead of the snippet's title.
  const displayLabel = (typeof label === 'string' && label && label !== snippet.title) ? label : snippet.title;

  return (
    <div
      className="embedded-snippet"
      style={{
        margin: '10px 0',
        border: '1px solid var(--border)',
        borderRadius: 8,
        background: 'var(--bg-surface-2)',
        overflow: 'hidden',
      }}
    >
      {/* Header row — click to toggle open */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: 10, width: '100%',
          padding: '8px 12px', background: 'transparent', border: 'none', cursor: 'pointer',
          color: 'var(--fg)', textAlign: 'left',
        }}
      >
        <Icon name={open ? 'chevronDown' : 'chevronRight'} size={13} style={{ color: 'var(--fg-faint)', flexShrink: 0 }} />
        <Icon name="snippet" size={13} style={{ color: 'var(--accent)', flexShrink: 0 }} />
        <span style={{ fontSize: 13, fontWeight: 500, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {displayLabel}
        </span>
        <span style={{
          fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--fg-faint)',
          padding: '1px 6px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 4,
        }}>
          {snippet.language}
        </span>
        <span
          role="button"
          tabIndex={0}
          onClick={handleCopy}
          onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') handleCopy(e); }}
          title="Copy code"
          style={{
            color: copied ? 'var(--accent)' : 'var(--fg-faint)',
            padding: 2, display: 'flex', alignItems: 'center', cursor: 'pointer',
          }}
        >
          <Icon name={copied ? 'check' : 'copy'} size={13} />
        </span>
      </button>

      {/* Description + code (only when open) */}
      {open && (
        <>
          {snippet.description && (
            <div style={{
              padding: '0 12px 8px', fontSize: 12, color: 'var(--fg-muted)',
              borderBottom: '1px solid var(--border-subtle)', marginBottom: 0,
            }}>
              {snippet.description}
            </div>
          )}
          <pre style={{
            margin: 0, padding: '12px 14px',
            background: 'var(--bg-canvas)',
            fontFamily: 'var(--font-mono)', fontSize: 12, lineHeight: 1.6,
            color: 'var(--fg)', overflow: 'auto',
            borderTop: snippet.description ? 'none' : '1px solid var(--border-subtle)',
          }}>
            <code>{snippet.code}</code>
          </pre>
          {snippet.tags?.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, padding: '8px 12px', borderTop: '1px solid var(--border-subtle)' }}>
              {snippet.tags.map(t => (
                <span key={t} style={{
                  fontSize: 10, fontFamily: 'var(--font-mono)',
                  color: 'var(--fg-muted)', padding: '1px 6px',
                  background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 4,
                }}>
                  {t}
                </span>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};
