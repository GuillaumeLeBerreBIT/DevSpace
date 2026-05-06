import React, { useState, useEffect } from 'react';
import { Icon } from './Icon';

export const CreateSprintModal = ({ onClose, onCreate, nextNum }) => {
  const [name, setName] = useState('');
  const [goal, setGoal] = useState('');
  const [dateRange, setDateRange] = useState('');
  const [capacity, setCapacity] = useState(30);

  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onCreate({ name, goal, dateRange, capacity: Number(capacity) });
    onClose();
  };

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.6)', display: 'grid', placeItems: 'center', animation: 'fadeIn 0.15s ease' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, width: 480, maxWidth: '90vw', animation: 'slideUp 0.2s ease', overflow: 'hidden' }}
      >
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: 'var(--fg)' }}>Create sprint</h3>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--fg-dim)' }}>Sprint #{nextNum}</p>
          </div>
          <button className="btn btn--ghost btn--icon" onClick={onClose}>
            <Icon name="x" size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Field label="Sprint name" required>
            <input
              autoFocus
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder={`Sprint ${nextNum}`}
              style={inputStyle}
              required
            />
          </Field>

          <Field label="Goal">
            <textarea
              value={goal}
              onChange={e => setGoal(e.target.value)}
              placeholder="What does this sprint aim to achieve?"
              rows={3}
              style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }}
            />
          </Field>

          <Field label="Date range">
            <input
              value={dateRange}
              onChange={e => setDateRange(e.target.value)}
              placeholder="e.g. May 6 – May 19"
              style={inputStyle}
            />
          </Field>

          <Field label="Capacity (points)">
            <input
              type="number"
              value={capacity}
              onChange={e => setCapacity(e.target.value)}
              min={1}
              max={200}
              style={{ ...inputStyle, width: 100 }}
            />
          </Field>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 8, borderTop: '1px solid var(--border-subtle)' }}>
            <button type="button" className="btn btn--ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn--primary">
              <Icon name="plus" size={14} />
              Create sprint
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const inputStyle = {
  width: '100%',
  padding: '8px 12px',
  background: 'var(--bg-input)',
  border: '1px solid var(--border)',
  borderRadius: 6,
  color: 'var(--fg)',
  fontSize: 13,
  outline: 'none',
};

const Field = ({ label, required, children }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
    <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--fg-muted)' }}>
      {label}{required && <span style={{ color: 'var(--accent)', marginLeft: 2 }}>*</span>}
    </label>
    {children}
  </div>
);
