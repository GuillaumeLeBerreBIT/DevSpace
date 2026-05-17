import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import { Plus } from 'lucide-react';

export const CreateSprintModal = ({ onClose, onCreate, nextNum }) => {
  const [name, setName] = useState('');
  const [goal, setGoal] = useState('');
  const [dateRange, setDateRange] = useState('');
  const [capacity, setCapacity] = useState(30);

  const handleSubmit = (e) => {
    e.preventDefault();
    onCreate({ name, goal, dateRange, capacity: Number(capacity) });
    onClose();
  };

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-120">
        <DialogHeader>
          <DialogTitle>Create sprint</DialogTitle>
          <DialogDescription>Sprint #{nextNum}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 px-6 py-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="sprint-name">Sprint name <span className="text-primary">*</span></Label>
            <Input id="sprint-name" autoFocus value={name} onChange={e => setName(e.target.value)} placeholder={`Sprint ${nextNum}`} required />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="sprint-goal">Goal</Label>
            <Textarea id="sprint-goal" value={goal} onChange={e => setGoal(e.target.value)} placeholder="What does this sprint aim to achieve?" rows={3} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="sprint-dates">Date range</Label>
            <Input id="sprint-dates" value={dateRange} onChange={e => setDateRange(e.target.value)} placeholder="e.g. May 6 – May 19" />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="sprint-capacity">Capacity (points)</Label>
            <Input id="sprint-capacity" type="number" value={capacity} onChange={e => setCapacity(e.target.value)} min={1} max={200} className="w-24" />
          </div>
        </form>

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" onClick={handleSubmit}>
            <Plus className="w-3.5 h-3.5" />
            Create sprint
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
