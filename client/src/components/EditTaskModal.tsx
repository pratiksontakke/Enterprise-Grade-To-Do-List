import { useState, useEffect } from 'react';
import { Task, UpdateTaskData } from '../types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Loader2, Save, X } from 'lucide-react';
import { useToast } from '../hooks/use-toast';

interface EditTaskModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onTaskUpdated: () => void;
}

export function EditTaskModal({ task, isOpen, onClose, onTaskUpdated }: EditTaskModalProps) {
  const [formData, setFormData] = useState<UpdateTaskData>({});
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (task) {
      setFormData({
        task_name: task.task_name,
        assignee: task.assignee,
        due_date: task.due_date ? task.due_date.split('T')[0] : '',
        priority: task.priority,
        status: task.status
      });
    }
  }, [task]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!task || !formData.task_name?.trim()) {
      toast({
        title: "Validation Error",
        description: "Task name is required",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const { api } = await import('../services/api');
      
      const updateData: UpdateTaskData = {
        ...formData,
        task_name: formData.task_name.trim(),
        assignee: formData.assignee?.trim() || null,
        due_date: formData.due_date ? new Date(formData.due_date).toISOString() : null
      };

      await api.updateTask(task.id, updateData);
      
      onTaskUpdated();
      onClose();
      
      toast({
        title: "Task updated",
        description: "Your task has been successfully updated",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update task. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  if (!task) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-card-foreground">
            Edit Task
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="task_name" className="text-sm font-medium text-foreground">
              Task Name *
            </Label>
            <Input
              id="task_name"
              value={formData.task_name || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, task_name: e.target.value }))}
              className="bg-input border-border text-foreground"
              disabled={isLoading}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="assignee" className="text-sm font-medium text-foreground">
              Assignee
            </Label>
            <Input
              id="assignee"
              value={formData.assignee || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, assignee: e.target.value }))}
              placeholder="Enter assignee name"
              className="bg-input border-border text-foreground"
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="due_date" className="text-sm font-medium text-foreground">
              Due Date
            </Label>
            <Input
              id="due_date"
              type="date"
              value={formData.due_date || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
              className="bg-input border-border text-foreground"
              disabled={isLoading}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priority" className="text-sm font-medium text-foreground">
                Priority
              </Label>
              <Select
                value={formData.priority}
                onValueChange={(value: 'P1' | 'P2' | 'P3' | 'P4') => 
                  setFormData(prev => ({ ...prev, priority: value }))
                }
                disabled={isLoading}
              >
                <SelectTrigger className="bg-input border-border text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  <SelectItem value="P1">P1 (Urgent)</SelectItem>
                  <SelectItem value="P2">P2 (High)</SelectItem>
                  <SelectItem value="P3">P3 (Medium)</SelectItem>
                  <SelectItem value="P4">P4 (Low)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status" className="text-sm font-medium text-foreground">
                Status
              </Label>
              <Select
                value={formData.status}
                onValueChange={(value: 'To Do' | 'In Progress' | 'Done') => 
                  setFormData(prev => ({ ...prev, status: value }))
                }
                disabled={isLoading}
              >
                <SelectTrigger className="bg-input border-border text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  <SelectItem value="To Do">To Do</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Done">Done</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {task.original_text && (
            <div className="space-y-2">
              <Label className="text-sm font-medium text-foreground">
                Original Text
              </Label>
              <Textarea
                value={task.original_text}
                className="bg-muted text-muted-foreground text-sm"
                disabled
                readOnly
              />
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
              className="border-border text-foreground hover:bg-accent"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !formData.task_name?.trim()}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}