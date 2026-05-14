import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import { Trash2 } from 'lucide-react';

// Hardcoded palette — was previously imported from data.js as DEVSPACE_DATA.projectColors
const PROJECT_COLORS = [
  '#7F77DD', '#4d9aff', '#46a758', '#e5484d',
  '#ffb224', '#ff8c4d', '#c084fc', '#f472b6',
  '#34d399', '#22d3ee',
];

export const ProjectSettingsModal = ({ project, onClose, onSave }) => {
  const [name, setName] = useState(project.name);
  const [tagline, setTagline] = useState(project.tagline || '');
  const [color, setColor] = useState(project.color);
  const [stack, setStack] = useState((project.stack || []).join(', '));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ ...project, name, tagline, color, stack: stack.split(',').map(s => s.trim()).filter(Boolean) });
    onClose();
  };

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-120">
        <DialogHeader>
          <DialogTitle>Project settings</DialogTitle>
          <DialogDescription>{project.key} · {project.id}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 px-6 py-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="proj-name">Project name <span className="text-primary">*</span></Label>
            <Input id="proj-name" autoFocus value={name} onChange={e => setName(e.target.value)} required />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="proj-tagline">Tagline</Label>
            <Input id="proj-tagline" value={tagline} onChange={e => setTagline(e.target.value)} placeholder="Short description" />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="proj-stack">Stack (comma-separated)</Label>
            <Input id="proj-stack" value={stack} onChange={e => setStack(e.target.value)} placeholder="React, TypeScript, Postgres" />
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

        <DialogFooter className="justify-between">
          <Button type="button" variant="ghost" className="text-destructive hover:text-destructive gap-1.5">
            <Trash2 className="w-3.5 h-3.5" />
            Delete project
          </Button>
          <div className="flex gap-2">
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" onClick={handleSubmit}>Save changes</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
