import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import { useMe, useUpdateMe } from '../hooks/useMe';
import { useAuth } from '../context/AuthContext';

export const UserSettingsModal = ({ onClose }) => {
  const { data: user } = useMe();
  const updateMe = useUpdateMe();
  const { logout } = useAuth();

  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState('');

  // Populate fields once user data loads
  useEffect(() => {
    if (user) {
      setDisplayName(user.display_name || '');
      setRole(user.role || '');
    }
  }, [user]);

  const handleSubmit = (e) => {
    e.preventDefault();
    updateMe.mutate(
      { display_name: displayName, role },
      { onSuccess: onClose }
    );
  };

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-96">
        <DialogHeader>
          <DialogTitle>User settings</DialogTitle>
          <DialogDescription>{user?.username}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 px-6 py-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="display-name">Display name</Label>
            <Input
              id="display-name"
              autoFocus
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              placeholder={user?.username || 'Your name'}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="role">Role</Label>
            <Input
              id="role"
              value={role}
              onChange={e => setRole(e.target.value)}
              placeholder="Solo dev"
            />
          </div>
        </form>

        <DialogFooter className="justify-between">
          <Button
            type="button"
            variant="ghost"
            className="text-destructive hover:text-destructive"
            onClick={logout}
          >
            Sign out
          </Button>
          <div className="flex gap-2">
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" onClick={handleSubmit} disabled={updateMe.isPending}>
              {updateMe.isPending ? 'Saving…' : 'Save changes'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
