import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import { Plus } from 'lucide-react';
import { useCreateSnippet } from '../hooks/useSnippets';

// Values match the backend Snippet.LANGUAGE_CHOICES (db_value, display_label)
const LANGUAGES = [
  { value: 'JS', label: 'JavaScript' },
  { value: 'TS', label: 'TypeScript' },
  { value: 'Python', label: 'Python' },
  { value: 'Bash', label: 'Bash' },
  { value: 'SQL', label: 'SQL' },
  { value: 'Other', label: 'Other' },
];

export const CreateSnippetModal = ({ projectId, onClose, onCreated }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [language, setLanguage] = useState('JS');
  const [code, setCode] = useState('');
  const [tags, setTags] = useState('');

  const createSnippet = useCreateSnippet();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim() || !code.trim()) return;

    createSnippet.mutate(
      {
        title: title.trim(),
        description: description.trim(),
        language,
        code,
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
        // Snippet.project is nullable — when projectId is undefined we send null for a global snippet
        project: projectId ?? null,
      },
      {
        onSuccess: (newSnippet) => {
          onCreated?.(newSnippet);
          onClose();
        },
      }
    );
  };

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>New snippet</DialogTitle>
          <DialogDescription>
            {projectId ? 'Saving to this project' : 'Global snippet — accessible across all projects'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 px-6 py-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="snip-title">Title <span className="text-primary">*</span></Label>
            <Input
              id="snip-title"
              autoFocus
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. useDebouncedValue hook"
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="snip-desc">Description</Label>
            <Input
              id="snip-desc"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="What does it do?"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="snip-lang">Language</Label>
              <select
                id="snip-lang"
                value={language}
                onChange={e => setLanguage(e.target.value)}
                style={{ padding: '6px 10px', fontSize: 13, background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--fg)', cursor: 'pointer', outline: 'none' }}
              >
                {LANGUAGES.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="snip-tags">Tags (comma-separated)</Label>
              <Input
                id="snip-tags"
                value={tags}
                onChange={e => setTags(e.target.value)}
                placeholder="react, hook, perf"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="snip-code">Code <span className="text-primary">*</span></Label>
            <Textarea
              id="snip-code"
              value={code}
              onChange={e => setCode(e.target.value)}
              placeholder="Paste your code…"
              rows={10}
              required
              className="font-mono text-xs"
            />
          </div>
        </form>

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" onClick={handleSubmit} disabled={!title.trim() || !code.trim() || createSnippet.isPending}>
            <Plus className="w-3.5 h-3.5" />
            {createSnippet.isPending ? 'Creating…' : 'Create snippet'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
