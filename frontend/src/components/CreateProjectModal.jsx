import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import { Plus } from 'lucide-react';
import { useCreateProject } from '../hooks/useProjects';

const PROJECT_COLORS = [
  '#7F77DD', '#4d9aff', '#46a758', '#e5484d',
  '#ffb224', '#ff8c4d', '#c084fc', '#f472b6',
  '#34d399', '#22d3ee',
];

export const CreateProjectModal = ({ onClose, onCreated }) => {
  const [name, setName] = useState('');
  const [key, setKey] = useState('');
  const [tagline, setTagline] = useState('');
  const [color, setColor] = useState(PROJECT_COLORS[0]);
  const [stack, setStack] = useState('');

  const createProject = useCreateProject();

  // Auto-derive a 2–3 char key from the project name as user types,
  // unless they've manually typed their own key
  const [keyTouched, setKeyTouched] = useState(false);
  const handleNameChange = (val) => {
    setName(val);
    if (!keyTouched) {
      const auto = val
        .split(/\s+/)
        .map(word => word[0])
        .filter(Boolean)
        .join('')
        .toUpperCase()
        .slice(0, 3);
      setKey(auto);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim() || !key.trim()) return;

    createProject.mutate(
      {
        name: name.trim(),
        key: key.trim().toUpperCase(),
        tagline: tagline.trim(),
        color,
        status: 'Active',
        stack: stack.split(',').map(s => s.trim()).filter(Boolean),
      },
      {
        onSuccess: (newProject) => {
          onCreated?.(newProject);
          onClose();
        },
        onError: (err) => {
          const data = err?.response?.data;
          if (data?.key) toast.error(`Key: ${data.key[0]}`);
          else toast.error('Failed to create project — try a different key');
        },
      }
    );
  };

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-120">
        <DialogHeader>
          <DialogTitle>New project</DialogTitle>
          <DialogDescription>Set up a fresh project workspace</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 px-6 py-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="new-proj-name">Project name <span className="text-primary">*</span></Label>
            <Input
              id="new-proj-name"
              autoFocus
              value={name}
              onChange={e => handleNameChange(e.target.value)}
              placeholder="DevSpace"
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="new-proj-key">Project key <span className="text-primary">*</span></Label>
            <Input
              id="new-proj-key"
              value={key}
              onChange={e => { setKey(e.target.value.toUpperCase()); setKeyTouched(true); }}
              placeholder="DS"
              maxLength={10}
              required
              style={{ fontFamily: 'var(--font-mono)', maxWidth: 140 }}
            />
            <span style={{ fontSize: 11, color: 'var(--fg-faint)' }}>
              Used as task ID prefix, e.g. <code>{key || 'DS'}-001</code>
            </span>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="new-proj-tagline">Tagline</Label>
            <Input id="new-proj-tagline" value={tagline} onChange={e => setTagline(e.target.value)} placeholder="One-line description" />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="new-proj-stack">Stack (comma-separated)</Label>
            <Input id="new-proj-stack" value={stack} onChange={e => setStack(e.target.value)} placeholder="React, Django, Postgres" />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Color</Label>
            <div className="flex gap-2 flex-wrap">
              {PROJECT_COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className="w-7 h-7 rounded-md cursor-pointer transition-transform hover:scale-110"
                  style={{
                    background: c,
                    border: color === c ? '2px solid white' : '2px solid transparent',
                    outline: color === c ? `2px solid ${c}` : 'none',
                    outlineOffset: 2,
                  }}
                />
              ))}
            </div>
          </div>

        </form>

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" onClick={handleSubmit} disabled={!name.trim() || !key.trim() || createProject.isPending}>
            <Plus className="w-3.5 h-3.5" />
            {createProject.isPending ? 'Creating…' : 'Create project'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
