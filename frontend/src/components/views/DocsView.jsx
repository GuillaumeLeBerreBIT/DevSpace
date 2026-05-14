import React, { useState, useEffect } from 'react';
import { Icon } from '../Icon';
import { Button } from '../ui/button';
import { useDocs, useCreateDoc, useUpdateDoc } from '../../hooks/useDocs';

export const DocsView = ({ project }) => {
  const { data: pages = [] } = useDocs(project.id);
  const createDoc = useCreateDoc();
  const updateDoc = useUpdateDoc();

  const [activePage, setActivePage] = useState(null);
  const [saveStatus, setSaveStatus] = useState('saved');

  // Set first page as active once pages load
  useEffect(() => {
    if (pages.length > 0 && !activePage) {
      setActivePage(pages[0].id);
    }
  }, [pages]);

  const page = pages.find(p => p.id === activePage);

  const handleContentChange = (val) => {
    if (!page) return;
    setSaveStatus('saving');
    clearTimeout(window._docSaveTimer);
    // Debounce: wait 1s of inactivity before saving to avoid hammering the API
    window._docSaveTimer = setTimeout(() => {
      updateDoc.mutate(
        { id: page.id, content: val },
        { onSuccess: () => setSaveStatus('saved') }
      );
    }, 1000);
  };

  const handleNewPage = () => {
    createDoc.mutate(
      { title: 'New page', content: '# New page\n\nStart writing…', project: project.id, order: pages.length },
      { onSuccess: (newPage) => setActivePage(newPage.id) }
    );
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
              onClick={() => setActivePage(p.id)}
              className={`nav-item${activePage === p.id ? ' nav-item--active' : ''}`}
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
                <Button key={tool.icon} title={tool.title} variant="ghost" size="icon" className="h-7 w-7">
                  <Icon name={tool.icon} size={14} />
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Textarea */}
        <div style={{ flex: 1, overflow: 'hidden', padding: '24px 40px' }}>
          {page ? (
            <textarea
              key={page.id}
              defaultValue={page.content}
              onChange={e => handleContentChange(e.target.value)}
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
