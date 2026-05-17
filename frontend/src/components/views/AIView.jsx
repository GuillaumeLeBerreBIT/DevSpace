import { useState, useEffect, useRef } from 'react';
import { Icon } from '../Icon';
import {
  useConversations,
  useCreateConversation,
  useDeleteConversation,
  useRenameConversation,
  useMessages,
  useSendMessage,
  useApplyMutations,
  useDiscardMutations,
} from '../../hooks/useChat';

export const AIView = ({ project }) => {
  const [activeId, setActiveId] = useState(null);
  const { data: conversations = [] } = useConversations(project.id);
  const createConv = useCreateConversation();
  const deleteConv = useDeleteConversation();
  const renameConv = useRenameConversation();

  // Auto-select first conversation when list loads / changes
  useEffect(() => {
    if (!activeId && conversations.length > 0) {
      setActiveId(conversations[0].id);
    }
    // If the active conversation got deleted, drop selection
    if (activeId && !conversations.find(c => c.id === activeId)) {
      setActiveId(conversations[0]?.id ?? null);
    }
  }, [conversations, activeId]);

  const handleNewChat = () => {
    createConv.mutate(
      { projectId: project.id, title: 'New chat' },
      { onSuccess: (conv) => setActiveId(conv.id) },
    );
  };

  const handleDelete = (id, e) => {
    e.stopPropagation();
    if (!confirm('Delete this chat?')) return;
    deleteConv.mutate({ id, projectId: project.id });
  };

  const handleRename = (conv, e) => {
    e.stopPropagation();
    const title = prompt('Rename chat', conv.title);
    if (title && title.trim() && title !== conv.title) {
      renameConv.mutate({ id: conv.id, title: title.trim() });
    }
  };

  return (
    <div style={{ display: 'flex', height: '100%', gap: 0 }}>
      {/* ── Chat list ─────────────────────────────────────── */}
      <aside style={{ width: 240, borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ padding: 12, borderBottom: '1px solid var(--border)' }}>
          <button
            onClick={handleNewChat}
            disabled={createConv.isPending}
            style={{
              width: '100%', padding: '8px 12px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: 6, background: 'var(--primary)', color: 'white', border: 'none', borderRadius: 6,
              cursor: 'pointer', fontSize: 13, fontWeight: 500,
            }}
          >
            <Icon name="plus" size={14} />
            New chat
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: 8 }}>
          {conversations.length === 0 ? (
            <div style={{ padding: 16, fontSize: 12, color: 'var(--fg-faint)', textAlign: 'center' }}>
              No chats yet. Start one above.
            </div>
          ) : conversations.map(conv => (
            <div
              key={conv.id}
              onClick={() => setActiveId(conv.id)}
              style={{
                padding: '8px 10px', marginBottom: 2, borderRadius: 6, cursor: 'pointer',
                background: conv.id === activeId ? 'var(--bg-hover)' : 'transparent',
                display: 'flex', alignItems: 'center', gap: 8, fontSize: 13,
                color: conv.id === activeId ? 'var(--fg)' : 'var(--fg-dim)',
                position: 'relative',
              }}
              className="ai-chat-item"
            >
              <Icon name="sparkle" size={14} />
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {conv.title}
              </span>
              <button
                onClick={(e) => handleRename(conv, e)}
                title="Rename"
                style={{ background: 'none', border: 'none', color: 'var(--fg-faint)', cursor: 'pointer', padding: 2, display: 'flex' }}
              >
                <Icon name="settings" size={12} />
              </button>
              <button
                onClick={(e) => handleDelete(conv.id, e)}
                title="Delete"
                style={{ background: 'none', border: 'none', color: 'var(--fg-faint)', cursor: 'pointer', padding: 2, display: 'flex' }}
              >
                <Icon name="trash" size={12} />
              </button>
            </div>
          ))}
        </div>
      </aside>

      {/* ── Chat thread ────────────────────────────────────── */}
      <section style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {activeId ? (
          <ChatThread key={activeId} conversationId={activeId} />
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12, color: 'var(--fg-faint)' }}>
            <Icon name="sparkle" size={32} />
            <div>Create a new chat to start.</div>
          </div>
        )}
      </section>
    </div>
  );
};


const ChatThread = ({ conversationId }) => {
  const { data: messages = [], isLoading } = useMessages(conversationId);
  const sendMessage = useSendMessage();
  const [input, setInput] = useState('');
  const scrollRef = useRef(null);

  // Auto-scroll to bottom on new messages or send-in-progress
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, sendMessage.isPending]);

  const handleSend = (e) => {
    e.preventDefault();
    const content = input.trim();
    if (!content || sendMessage.isPending) return;
    setInput('');
    sendMessage.mutate({ conversationId, content });
  };

  return (
    <>
      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
        {isLoading ? (
          <div style={{ color: 'var(--fg-faint)', fontSize: 13 }}>Loading…</div>
        ) : messages.length === 0 ? (
          <div style={{ color: 'var(--fg-faint)', fontSize: 13, textAlign: 'center', marginTop: 60 }}>
            Ask anything about this project, your code, or get help thinking through a problem.
          </div>
        ) : messages.map(m => (
          <MessageBubble key={m.id} message={m} conversationId={conversationId} />
        ))}
        {sendMessage.isPending && (
          <div style={{ color: 'var(--fg-faint)', fontSize: 12, marginTop: 8, fontStyle: 'italic' }}>
            DevSpace AI is thinking…
          </div>
        )}
        {sendMessage.isError && (
          <div style={{ color: 'var(--red)', fontSize: 12, marginTop: 8 }}>
            {sendMessage.error?.response?.data?.detail || 'Something went wrong.'}
          </div>
        )}
      </div>

      <form
        onSubmit={handleSend}
        style={{ padding: 16, borderTop: '1px solid var(--border)', display: 'flex', gap: 8 }}
      >
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend(e);
            }
          }}
          placeholder="Ask anything… (Enter to send, Shift+Enter for newline)"
          rows={2}
          style={{
            flex: 1, padding: 10, fontSize: 13, background: 'var(--bg-input)', color: 'var(--fg)',
            border: '1px solid var(--border)', borderRadius: 6, outline: 'none', resize: 'none',
            fontFamily: 'inherit',
          }}
        />
        <button
          type="submit"
          disabled={!input.trim() || sendMessage.isPending}
          style={{
            padding: '0 14px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: 6,
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 13,
            opacity: !input.trim() || sendMessage.isPending ? 0.5 : 1,
          }}
        >
          <Icon name="send" size={14} />
        </button>
      </form>
    </>
  );
};


const MessageBubble = ({ message, conversationId }) => {
  const isUser = message.role === 'user';
  return (
    <div style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start', marginBottom: 12, flexDirection: 'column', alignItems: isUser ? 'flex-end' : 'flex-start' }}>
      <div style={{
        maxWidth: '75%', padding: '10px 14px', borderRadius: 10, fontSize: 13, lineHeight: 1.5,
        background: isUser ? 'var(--primary)' : 'var(--bg-elevated)',
        color: isUser ? 'white' : 'var(--fg)',
        whiteSpace: 'pre-wrap', wordBreak: 'break-word',
      }}>
        {message.content || '(no reply)'}
      </div>

      {/* Tool calls (read tools that ran live + applied write results) */}
      {!isUser && message.tool_calls?.length > 0 && (
        <ToolCallsList toolCalls={message.tool_calls} />
      )}

      {/* Queued mutations awaiting confirmation */}
      {!isUser && message.pending_mutations?.length > 0 && !message.applied_at && (
        <MutationsPanel
          mutations={message.pending_mutations}
          conversationId={conversationId}
          messageId={message.id}
        />
      )}

      {/* Marker if mutations were applied */}
      {!isUser && message.applied_at && (() => {
        // Detect whether any tool_call result had ok=false (partial-failure case)
        const failed = (message.tool_calls || []).filter(
          tc => tc.result && typeof tc.result === 'object' && tc.result.ok === false
        );
        const ok = failed.length === 0;
        return (
          <div style={{
            fontSize: 11,
            color: ok ? 'var(--green, #46a758)' : 'var(--red, #e5484d)',
            marginTop: 4, display: 'flex', alignItems: 'center', gap: 4,
          }}>
            <Icon name={ok ? 'check' : 'x'} size={11} />
            {ok ? 'Applied' : `Applied with ${failed.length} error${failed.length > 1 ? 's' : ''} — expand tool calls for details`}
          </div>
        );
      })()}
    </div>
  );
};


const ToolCallsList = ({ toolCalls }) => {
  const [expanded, setExpanded] = useState(false);
  const summary = toolCalls.reduce((acc, tc) => {
    acc[tc.tool] = (acc[tc.tool] || 0) + 1;
    return acc;
  }, {});
  const summaryText = Object.entries(summary)
    .map(([tool, n]) => n > 1 ? `${tool} (×${n})` : tool)
    .join(' · ');

  return (
    <div style={{ marginTop: 6, maxWidth: '75%', width: '100%' }}>
      <button
        onClick={() => setExpanded(e => !e)}
        style={{
          display: 'flex', alignItems: 'center', gap: 6, padding: '4px 8px', fontSize: 11,
          background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 4,
          color: 'var(--fg-dim)', cursor: 'pointer',
        }}
      >
        <Icon name={expanded ? 'chevronDown' : 'chevronRight'} size={10} />
        🔧 {summaryText}
      </button>
      {expanded && (
        <div style={{ marginTop: 4, padding: '8px 10px', background: 'var(--bg-input)', borderRadius: 4, fontSize: 11, fontFamily: 'var(--font-mono, monospace)', color: 'var(--fg-dim)' }}>
          {toolCalls.map((tc, i) => (
            <div key={i} style={{ marginBottom: 8 }}>
              <div style={{ color: 'var(--fg)' }}>{tc.tool}({Object.keys(tc.args || {}).join(', ')})</div>
              {tc.result && (
                <div style={{ marginTop: 2, paddingLeft: 12, color: 'var(--fg-faint)', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                  → {typeof tc.result === 'object' ? JSON.stringify(tc.result) : String(tc.result).slice(0, 300)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};


const MUTATION_ICON = {
  create_task: '✚',
  update_task: '↻',
  create_sprint: '✚',
  create_devlog_entry: '✚',
  create_snippet: '✚',
  create_doc_page: '✚',
};


const MutationsPanel = ({ mutations, conversationId, messageId }) => {
  const apply = useApplyMutations();
  const discard = useDiscardMutations();
  const [error, setError] = useState('');

  const handleApply = () => {
    setError('');
    apply.mutate({ conversationId, messageId }, {
      onError: (err) => setError(err.response?.data?.detail || 'Apply failed.'),
    });
  };

  const handleDiscard = () => {
    if (!confirm(`Discard ${mutations.length} proposed change${mutations.length > 1 ? 's' : ''}?`)) return;
    discard.mutate({ conversationId, messageId });
  };

  const isPending = apply.isPending || discard.isPending;

  return (
    <div style={{
      marginTop: 8, padding: 12, maxWidth: '75%', width: '100%',
      background: 'var(--bg-elevated)', border: '1px solid var(--primary)',
      borderRadius: 8,
    }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--fg)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
        <Icon name="sparkle" size={12} />
        {mutations.length} change{mutations.length > 1 ? 's' : ''} proposed
      </div>
      <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 12px 0', fontSize: 12 }}>
        {mutations.map((m, i) => (
          <li key={i} style={{ padding: '4px 0', color: 'var(--fg)', display: 'flex', gap: 8 }}>
            <span style={{ color: 'var(--primary)' }}>{MUTATION_ICON[m.tool] || '•'}</span>
            <span>{m.preview}</span>
          </li>
        ))}
      </ul>
      {error && (
        <div style={{ fontSize: 11, color: 'var(--red)', marginBottom: 8 }}>{error}</div>
      )}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button
          onClick={handleDiscard}
          disabled={isPending}
          style={{
            padding: '6px 12px', fontSize: 12, background: 'transparent',
            color: 'var(--fg-dim)', border: '1px solid var(--border)', borderRadius: 6,
            cursor: isPending ? 'wait' : 'pointer',
          }}
        >
          Discard
        </button>
        <button
          onClick={handleApply}
          disabled={isPending}
          style={{
            padding: '6px 12px', fontSize: 12, background: 'var(--primary)',
            color: 'white', border: 'none', borderRadius: 6,
            cursor: isPending ? 'wait' : 'pointer',
          }}
        >
          {apply.isPending ? 'Applying…' : `Apply all`}
        </button>
      </div>
    </div>
  );
};
