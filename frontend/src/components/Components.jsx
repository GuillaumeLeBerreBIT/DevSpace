import React, { useState } from 'react';
import { Icon } from './Icon';

export const Pill = ({ kind, children, className = '' }) => {
  const k = kind ? kind.toLowerCase().replace(/\s+/g, '-') : '';
  return <span className={`pill pill--${k} ${className}`}>{children}</span>;
};

export const TypePill = ({ type }) => {
  const map = { Feature: { kind: 'feature' }, Bug: { kind: 'bug' }, Fix: { kind: 'fix' }, Chore: { kind: 'chore' }, Idea: { kind: 'idea' }, Docs: { kind: 'docs' } };
  const c = map[type] || map.Feature;
  return <Pill kind={c.kind}>{type}</Pill>;
};

export const StatusPill = ({ status }) => <Pill kind={status}>{status}</Pill>;

export const priorityColor = (p) => {
  if (p === 'Urgent') return '#e5484d';
  if (p === 'High') return '#ff8c4d';
  if (p === 'Medium') return '#d4a83c';
  return null;
};

export const PriorityDot = ({ priority }) => {
  const c = priorityColor(priority);
  if (!c) return <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 50, border: '1px solid var(--border-strong)' }} />;
  return <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 50, background: c }} />;
};

export const LabelChip = ({ label, accent = false }) => (
  <span className={`label-chip ${accent ? 'label-chip--accent' : ''}`}>{label}</span>
);

export const PointsBadge = ({ points }) => (
  <span style={{ display: 'inline-grid', placeItems: 'center', width: 20, height: 20, borderRadius: 4, fontFamily: 'var(--font-mono)', fontSize: 11, background: 'var(--bg-surface-3)', color: 'var(--fg-muted)', border: '1px solid var(--border)' }}>{points}</span>
);

export const CarryoverBadge = () => (
  <span title="Rolled over from previous sprint" style={{ display: 'inline-grid', placeItems: 'center', width: 18, height: 18, borderRadius: 4, color: 'var(--amber)', background: 'var(--amber-soft)' }}>
    <Icon name="rotate" size={11} strokeWidth={2} />
  </span>
);

export const ProgressRing = ({ value, size = 56, stroke = 4, color = 'var(--accent)' }) => {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - value);
  return (
    <svg width={size} height={size}>
      <circle cx={size / 2} cy={size / 2} r={r} stroke="var(--border)" strokeWidth={stroke} fill="none" />
      <circle cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={stroke} fill="none"
        strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`} style={{ transition: 'stroke-dashoffset 0.4s ease' }} />
    </svg>
  );
};

export const ProgressBar = ({ value, color = 'var(--accent)' }) => (
  <div style={{ width: '100%', height: 3, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
    <div style={{ width: `${value * 100}%`, height: '100%', background: color, transition: 'width 0.3s ease' }} />
  </div>
);

export const ProjectInitial = ({ project, size = 28 }) => (
  <span style={{ display: 'inline-grid', placeItems: 'center', width: size, height: size, borderRadius: 6, fontFamily: 'var(--font-mono)', fontSize: size * 0.4, fontWeight: 500, background: project.color + '22', color: project.color, border: `1px solid ${project.color}33`, flexShrink: 0 }}>{project.key}</span>
);

export const ProjectChip = ({ project }) => (
  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '2px 8px 2px 6px', borderRadius: 4, background: 'var(--bg-surface-3)', border: '1px solid var(--border)', fontSize: 11 }}>
    <span style={{ width: 6, height: 6, borderRadius: 50, background: project.color }} />
    <span className="mono dim" style={{ fontSize: 10 }}>{project.key}</span>
    <span style={{ color: 'var(--fg-muted)' }}>{project.name}</span>
  </span>
);

export const Divider = () => <div style={{ height: 1, background: 'var(--border-subtle)', width: '100%' }} />;

export const PlaceholderRect = ({ height = 80, label }) => (
  <div className="placeholder-stripes" style={{ height, borderRadius: 6, border: '1px dashed var(--border)', display: 'grid', placeItems: 'center', color: 'var(--fg-faint)', fontFamily: 'var(--font-mono)', fontSize: 11 }}>{label}</div>
);

export const Select = ({ value, onChange, options, ariaLabel }) => (
  <select aria-label={ariaLabel} value={value} onChange={(e) => onChange(e.target.value)} style={{ padding: '5px 26px 5px 10px', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 5, color: 'var(--fg)', fontSize: 12, appearance: 'none', backgroundImage: 'url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'10\' height=\'10\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%239a9aa6\' stroke-width=\'2\'><path d=\'M6 9l6 6 6-6\'/></svg>")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center', cursor: 'pointer' }}>
    {options.map((o) => <option key={o.value || o} value={o.value || o}>{o.label || o}</option>)}
  </select>
);
