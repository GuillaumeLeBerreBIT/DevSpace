import React, { useState, useEffect } from 'react';
import { Icon } from './Icon';
import { DEVSPACE_DATA } from '../data/data';

const { projectColors } = DEVSPACE_DATA;

export const ProjectSettingsModal = ({ project, onClose, onSave }) => {
  const [name, setName] = useState(project.name);
  const [tagline, setTagline] = useState(project.tagline || '');
  const [color, setColor] = useState(project.color);
  const [stack, setStack] = useState((project.stack || []).join(', '));

  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ ...project, name, tagline, color, stack: stack.split(',').map(s => s.trim()).filter(Boolean) });
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
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: 'var(--fg)' }}>Project settings</h3>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--fg-dim)' }}>{project.key} · {project.id}</p>
          </div>
          <button className="btn btn--ghost btn--icon" onClick={onClose}>
            <Icon name="x" size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Field label="Project name" required>
            <input
              autoFocus
              value={name}
              onChange={e => setName(e.target.value)}
              style={inputStyle}
              required
            />
          </Field>

          <Field label="Tagline">
            <input
              value={tagline}
              onChange={e => setTagline(e.target.value)}
              placeholder="Short description"
              style={inputStyle}
            />
          </Field>

          <Field label="Stack (comma-separated)">
            <input
              value={stack}
              onChange={e => setStack(e.target.value)}
              placeholder="React, TypeScript, Postgres"
              style={inputStyle}
            />
          </Field>

          <Field label="Color">
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {projectColors.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  style={{
                    width: 28, height: 28, borderRadius: 6, background: c,
                    border: color === c ? '2px solid white' : '2px solid transparent',
                    cursor: 'pointer', outline: color === c ? `2px solid ${c}` : 'none', outlineOffset: 2,
                  }}
                />
              ))}
            </div>
          </Field>

          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, paddingTop: 8, borderTop: '1px solid var(--border-subtle)' }}>
            <button type="button" className="btn btn--ghost" style={{ color: 'var(--red)' }}>
              <Icon name="trash" size={14} />
              Delete project
            </button>
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" className="btn btn--ghost" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn btn--primary">Save changes</button>
            </div>
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
