import React, { useState } from 'react';
import { Icon } from '../Icon';
import { DEVSPACE_DATA } from '../../data/data';

const { stackDetail } = DEVSPACE_DATA;

export const StackView = () => {
  const [activeTab, setActiveTab] = useState('tech');
  const [showEnvValues, setShowEnvValues] = useState({});

  const toggleEnv = (key) => {
    setShowEnvValues(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const depKindColor = { ok: 'var(--green)', patch: 'var(--blue)', minor: 'var(--amber)', major: 'var(--red)' };
  const depKindLabel = { ok: 'Up to date', patch: 'Patch', minor: 'Minor', major: 'Major' };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Tabs */}
      <div style={{ padding: '0 28px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', gap: 0, flexShrink: 0 }}>
        {[{ id: 'tech', label: 'Tech stack' }, { id: 'env', label: 'Environment' }, { id: 'deps', label: 'Dependencies' }].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{ padding: '12px 16px', fontSize: 13, fontWeight: 500, color: activeTab === tab.id ? 'var(--fg)' : 'var(--fg-muted)', borderBottom: activeTab === tab.id ? '2px solid var(--accent)' : '2px solid transparent', background: 'transparent', marginBottom: -1 }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>
        {activeTab === 'tech' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {stackDetail.tech.map(category => (
              <div key={category.category}>
                <h3 style={{ margin: '0 0 12px', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--fg-dim)' }}>{category.category}</h3>
                <div style={{ border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
                  {category.items.map((item, i) => (
                    <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', borderBottom: i < category.items.length - 1 ? '1px solid var(--border-subtle)' : 'none', background: 'var(--bg-surface-2)' }}>
                      <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--fg)', minWidth: 140 }}>{item.name}</span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-dim)', background: 'var(--bg-surface-3)', padding: '2px 8px', borderRadius: 100, border: '1px solid var(--border)' }}>{item.version}</span>
                      {item.note && <span style={{ fontSize: 12, color: 'var(--fg-muted)', flex: 1 }}>{item.note}</span>}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'env' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            <div style={{ marginBottom: 16, padding: '10px 14px', background: 'var(--amber-soft)', border: '1px solid #ffb22444', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
              <Icon name="flag" size={14} style={{ color: 'var(--amber)', flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: '#ffd07a' }}>These values are for local reference only. Never commit secrets to version control.</span>
            </div>
            <div style={{ border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
              {stackDetail.env.map((envVar, i) => (
                <div key={envVar.key} style={{ padding: '12px 16px', borderBottom: i < stackDetail.env.length - 1 ? '1px solid var(--border-subtle)' : 'none', background: 'var(--bg-surface-2)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
                    <code style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--accent)', background: 'var(--accent-soft)', padding: '2px 8px', borderRadius: 4, border: '1px solid var(--accent-line)' }}>{envVar.key}</code>
                    <button
                      onClick={() => toggleEnv(envVar.key)}
                      style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--fg-dim)', background: 'transparent', border: 'none', cursor: 'pointer' }}
                    >
                      <Icon name={showEnvValues[envVar.key] ? 'eyeOff' : 'eye'} size={13} />
                      {showEnvValues[envVar.key] ? 'Hide' : 'Reveal'}
                    </button>
                  </div>
                  {showEnvValues[envVar.key] && (
                    <code style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-muted)', background: 'var(--bg-surface-3)', padding: '6px 10px', borderRadius: 4, marginBottom: 6, wordBreak: 'break-all' }}>{envVar.value}</code>
                  )}
                  <p style={{ margin: 0, fontSize: 12, color: 'var(--fg-dim)' }}>{envVar.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'deps' && (
          <div>
            <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
              {Object.entries(depKindColor).map(([kind, color]) => {
                const count = stackDetail.deps.filter(d => d.kind === kind).length;
                return (
                  <div key={kind} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 6, background: 'var(--bg-surface-2)', border: '1px solid var(--border)' }}>
                    <span style={{ width: 6, height: 6, borderRadius: 50, background: color }} />
                    <span style={{ fontSize: 11, color: 'var(--fg-muted)' }}>{depKindLabel[kind]}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-faint)' }}>{count}</span>
                  </div>
                );
              })}
            </div>
            <div style={{ border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
              {stackDetail.deps.map((dep, i) => (
                <div key={dep.name} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 16px', borderBottom: i < stackDetail.deps.length - 1 ? '1px solid var(--border-subtle)' : 'none', background: 'var(--bg-surface-2)' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--fg)', minWidth: 200 }}>{dep.name}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-dim)', minWidth: 80 }}>{dep.current}</span>
                  <Icon name="arrowRight" size={12} style={{ color: 'var(--fg-faint)' }} />
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: depKindColor[dep.kind], minWidth: 80 }}>{dep.latest}</span>
                  <span style={{ fontSize: 11, padding: '1px 8px', borderRadius: 100, background: depKindColor[dep.kind] + '22', color: depKindColor[dep.kind], border: `1px solid ${depKindColor[dep.kind]}44` }}>{depKindLabel[dep.kind]}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
