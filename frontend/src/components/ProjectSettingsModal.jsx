import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import { Trash2 } from 'lucide-react';
import { useUpdateProject, useDeleteProject } from '../hooks/useProjects';
import { useGithubAccount, useGithubRepos } from '../hooks/useGithub';

const PROJECT_COLORS = [
  '#7F77DD', '#4d9aff', '#46a758', '#e5484d',
  '#ffb224', '#ff8c4d', '#c084fc', '#f472b6',
  '#34d399', '#22d3ee',
];

const STATUSES = ['Active', 'Stalled', 'Shipped', 'Archived'];

export const ProjectSettingsModal = ({ project, onClose, onDeleted }) => {
  const [name, setName] = useState(project.name);
  const [tagline, setTagline] = useState(project.tagline || '');
  const [color, setColor] = useState(project.color);
  const [status, setStatus] = useState(project.status || 'Active');
  const [stack, setStack] = useState((project.stack || []).join(', '));
  const [vaultTimeout, setVaultTimeout] = useState(project.vault_timeout ?? 15);
  const [githubRepo, setGithubRepo] = useState(project.github_repo || '');
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();

  const { data: github } = useGithubAccount();
  // Only fetch the repo list when the user is connected — saves a request otherwise
  const { data: repos, isLoading: reposLoading } = useGithubRepos(!!github?.connected);

  const handleSubmit = (e) => {
    e.preventDefault();
    updateProject.mutate(
      {
        id: project.id,
        name,
        tagline,
        color,
        status,
        stack: stack.split(',').map(s => s.trim()).filter(Boolean),
        vault_timeout: Number(vaultTimeout) || 15,
        github_repo: githubRepo,
      },
      { onSuccess: onClose }
    );
  };

  const handleDelete = () => {
    deleteProject.mutate(
      { id: project.id },
      {
        onSuccess: () => {
          onDeleted?.();
          onClose();
        },
      }
    );
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
            <Label htmlFor="proj-status">Status</Label>
            <select
              id="proj-status"
              value={status}
              onChange={e => setStatus(e.target.value)}
              style={{ padding: '6px 10px', fontSize: 13, background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--fg)', cursor: 'pointer', outline: 'none' }}
            >
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="proj-stack">Stack (comma-separated)</Label>
            <Input id="proj-stack" value={stack} onChange={e => setStack(e.target.value)} placeholder="React, TypeScript, Postgres" />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="proj-repo">
              GitHub repo
              <span style={{ fontWeight: 400, color: 'var(--fg-faint)', marginLeft: 6, fontSize: 11 }}>optional</span>
            </Label>
            {!github?.connected ? (
              <div style={{ fontSize: 11, color: 'var(--fg-faint)', padding: '6px 0' }}>
                Connect GitHub in <em>User settings</em> first to link a repo.
              </div>
            ) : reposLoading ? (
              <div style={{ fontSize: 11, color: 'var(--fg-faint)', padding: '6px 0' }}>Loading repos…</div>
            ) : (
              <select
                id="proj-repo"
                value={githubRepo}
                onChange={e => setGithubRepo(e.target.value)}
                style={{ padding: '6px 10px', fontSize: 13, background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--fg)', cursor: 'pointer', outline: 'none' }}
              >
                <option value="">— Not linked —</option>
                {repos?.map(r => (
                  <option key={r.full_name} value={r.full_name}>
                    {r.full_name}{r.private ? ' (private)' : ''}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="vault-timeout">
              Vault auto-lock timeout
              <span style={{ fontWeight: 400, color: 'var(--fg-faint)', marginLeft: 6, fontSize: 11 }}>minutes of inactivity</span>
            </Label>
            <Input
              id="vault-timeout"
              type="number"
              min={1}
              max={480}
              value={vaultTimeout}
              onChange={e => setVaultTimeout(e.target.value)}
              style={{ width: 80 }}
            />
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

        {confirmingDelete && (
          <div style={{ margin: '0 24px 12px', padding: 12, background: 'var(--red-soft, rgba(229, 72, 77, 0.08))', border: '1px solid var(--red)', borderRadius: 6, fontSize: 12, color: 'var(--fg)' }}>
            <p style={{ margin: '0 0 8px' }}>
              Delete <strong>{project.name}</strong>? This removes all sprints, tasks, docs, and dev log entries for this project. This cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
              <Button type="button" variant="ghost" size="sm" onClick={() => setConfirmingDelete(false)}>Cancel</Button>
              <Button
                type="button"
                size="sm"
                onClick={handleDelete}
                disabled={deleteProject.isPending}
                style={{ background: 'var(--red)', color: 'white' }}
              >
                {deleteProject.isPending ? 'Deleting…' : 'Delete forever'}
              </Button>
            </div>
          </div>
        )}

        <DialogFooter className="justify-between">
          <Button
            type="button"
            variant="ghost"
            className="text-destructive hover:text-destructive gap-1.5"
            onClick={() => setConfirmingDelete(true)}
            disabled={confirmingDelete}
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete project
          </Button>
          <div className="flex gap-2">
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" onClick={handleSubmit} disabled={updateProject.isPending}>
              {updateProject.isPending ? 'Saving…' : 'Save changes'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
