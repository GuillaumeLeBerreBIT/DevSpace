import React, { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Icon } from './Icon';
import { useCreateTask } from '../hooks/useTasks';

const TYPES = ['Feature', 'Bug', 'Fix', 'Chore', 'Idea', 'Docs'];
const STATUSES = ['To do', 'In progress', 'Backlog'];
const PRIORITIES = ['Urgent', 'High', 'Medium', 'Low'];
const POINTS = [1, 2, 3, 5, 8, 13, 21];

const fieldStyle = {
  display: 'flex', flexDirection: 'column', gap: 6,
};

const selectStyle = {
  width: '100%', padding: '6px 10px', fontSize: 13,
  background: 'var(--bg-input)', border: '1px solid var(--border)',
  borderRadius: 6, color: 'var(--fg)', cursor: 'pointer', outline: 'none',
};

export const CreateTaskModal = ({ projectId, sprintId, sprintName, onClose }) => {
  const [title, setTitle] = useState('');
  const [type, setType] = useState('Feature');
  const [status, setStatus] = useState(sprintId ? 'To do' : 'Backlog');
  const [priority, setPriority] = useState('Medium');
  const [points, setPoints] = useState(3);

  const createTask = useCreateTask();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    createTask.mutate(
      {
        title: title.trim(),
        type,
        status,
        priority,
        points: Number(points),
        project: projectId,
        sprint: sprintId ?? null,
      },
      { onSuccess: onClose }
    );
  };

  return (
    <Dialog.Root open onOpenChange={(open) => { if (!open) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay
          style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.5)', animation: 'fadeIn 0.15s ease' }}
        />
        <Dialog.Content
          style={{
            position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            zIndex: 201, width: 480, maxWidth: '90vw',
            background: 'var(--bg-surface)', border: '1px solid var(--border)',
            borderRadius: 10, padding: 24, display: 'flex', flexDirection: 'column', gap: 20,
            animation: 'fadeIn 0.15s ease',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Dialog.Title style={{ margin: 0, fontSize: 15, fontWeight: 600, color: 'var(--fg)' }}>
              New task
            </Dialog.Title>
            <Dialog.Close asChild>
              <Button variant="ghost" size="icon">
                <Icon name="x" size={14} />
              </Button>
            </Dialog.Close>
          </div>

          {/* Sprint context */}
          {sprintName && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', borderRadius: 6, background: 'var(--accent-soft)', border: '1px solid var(--accent-line)', fontSize: 12 }}>
              <Icon name="sprint" size={12} style={{ color: 'var(--accent)' }} />
              <span style={{ color: 'var(--fg-muted)' }}>Adding to</span>
              <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent)' }}>{sprintName}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Title */}
            <div style={fieldStyle}>
              <Label htmlFor="task-title">Title</Label>
              <Input
                id="task-title"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="What needs to be done?"
                autoFocus
              />
            </div>

            {/* Type + Priority row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={fieldStyle}>
                <Label htmlFor="task-type">Type</Label>
                <select id="task-type" value={type} onChange={e => setType(e.target.value)} style={selectStyle}>
                  {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div style={fieldStyle}>
                <Label htmlFor="task-priority">Priority</Label>
                <select id="task-priority" value={priority} onChange={e => setPriority(e.target.value)} style={selectStyle}>
                  {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </div>

            {/* Status + Points row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={fieldStyle}>
                <Label htmlFor="task-status">Status</Label>
                <select id="task-status" value={status} onChange={e => setStatus(e.target.value)} style={selectStyle}>
                  {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div style={fieldStyle}>
                <Label htmlFor="task-points">Points</Label>
                <select id="task-points" value={points} onChange={e => setPoints(e.target.value)} style={selectStyle}>
                  {POINTS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </div>

            {/* Footer */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 4 }}>
              <Button type="button" variant="secondary" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={!title.trim() || createTask.isPending}>
                {createTask.isPending ? 'Creating…' : 'Create task'}
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
