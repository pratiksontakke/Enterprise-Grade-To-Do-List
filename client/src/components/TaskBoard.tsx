import { Task } from '../types';
import { TaskCard } from './TaskCard';

interface TaskBoardProps {
  tasks: Task[];
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
}

const statusOrder: Task['status'][] = ['To Do', 'In Progress', 'Done'];

export function TaskBoard({ tasks, onEditTask, onDeleteTask }: TaskBoardProps) {
  const getTasksByStatus = (status: Task['status']) => {
    return tasks.filter(task => task.status === status);
  };

  const getStatusColor = (status: Task['status']) => {
    switch (status) {
      case 'To Do':
        return 'border-muted';
      case 'In Progress':
        return 'border-blue-500';
      case 'Done':
        return 'border-primary';
      default:
        return 'border-muted';
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {statusOrder.map((status) => {
        const statusTasks = getTasksByStatus(status);
        return (
          <div key={status} className={`border-t-4 ${getStatusColor(status)} bg-card rounded-lg p-4`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-card-foreground">{status}</h2>
              <span className="bg-muted text-muted-foreground text-sm px-2 py-1 rounded-full">
                {statusTasks.length}
              </span>
            </div>
            
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {statusTasks.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="text-sm">No tasks in {status.toLowerCase()}</p>
                </div>
              ) : (
                statusTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onEdit={onEditTask}
                    onDelete={onDeleteTask}
                  />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}