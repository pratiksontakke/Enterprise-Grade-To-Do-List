import { Task } from '../types';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Edit, Trash2, User, Calendar, AlertCircle } from 'lucide-react';
import { useState } from 'react';

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
}

const priorityColors = {
  P1: 'bg-destructive text-destructive-foreground',
  P2: 'bg-orange-500 text-white',
  P3: 'bg-blue-500 text-white',
  P4: 'bg-muted text-muted-foreground'
};

const statusColors = {
  'To Do': 'bg-muted text-muted-foreground',
  'In Progress': 'bg-blue-500 text-white',
  'Done': 'bg-primary text-primary-foreground'
};

export function TaskCard({ task, onEdit, onDelete }: TaskCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'Done';

  return (
    <Card 
      className="mb-3 transition-all duration-200 hover:shadow-lg border-border bg-card"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <h3 className="font-medium text-card-foreground text-sm leading-5 flex-1 pr-2">
            {task.task_name}
          </h3>
          <div className={`transition-opacity duration-200 flex gap-1 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0 hover:bg-accent"
              onClick={() => onEdit(task)}
            >
              <Edit className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0 hover:bg-destructive hover:text-destructive-foreground"
              onClick={() => onDelete(task.id)}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-3">
          <Badge className={`text-xs px-2 py-1 ${priorityColors[task.priority]}`}>
            {task.priority}
          </Badge>
          <Badge className={`text-xs px-2 py-1 ${statusColors[task.status]}`}>
            {task.status}
          </Badge>
        </div>

        {task.assignee && (
          <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground">
            <User className="h-3 w-3" />
            <span>{task.assignee}</span>
          </div>
        )}

        {task.due_date && (
          <div className={`flex items-center gap-2 mb-2 text-xs ${isOverdue ? 'text-destructive' : 'text-muted-foreground'}`}>
            <Calendar className="h-3 w-3" />
            <span>{formatDate(task.due_date)}</span>
            {isOverdue && <AlertCircle className="h-3 w-3" />}
          </div>
        )}

        {task.original_text && (
          <div className="mt-3 p-2 bg-muted rounded text-xs text-muted-foreground">
            <span className="font-medium">Original: </span>
            {task.original_text.length > 80 
              ? `${task.original_text.substring(0, 80)}...` 
              : task.original_text
            }
          </div>
        )}

        <div className="mt-3 text-xs text-muted-foreground">
          <span>Created: {formatDate(task.created_at)}</span>
          <span className="ml-3 px-2 py-1 bg-accent rounded text-xs">
            {task.source === 'single_task' ? 'Single Task' : 'Transcript'}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}