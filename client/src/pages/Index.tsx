import { useState, useEffect } from 'react';
import { Task } from '../types';
import { api } from '../services/api';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { SingleTaskInput } from '../components/SingleTaskInput';
import { TranscriptInput } from '../components/TranscriptInput';
import { TaskBoard } from '../components/TaskBoard';
import { EditTaskModal } from '../components/EditTaskModal';
import { useToast } from '../hooks/use-toast';
import { Loader2 } from 'lucide-react';

const Index = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const { toast } = useToast();

  // Load tasks on component mount
  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      setIsLoading(true);
      const loadedTasks = await api.getTasks();
      setTasks(loadedTasks);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load tasks. Please refresh the page.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTaskCreated = () => {
    loadTasks(); // Refresh the task list
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsEditModalOpen(true);
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await api.deleteTask(taskId);
      await loadTasks(); // Refresh the task list
      toast({
        title: "Task deleted",
        description: "The task has been successfully deleted",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete task. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleTaskUpdated = () => {
    loadTasks(); // Refresh the task list
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditingTask(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Loading your tasks...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Transform Ideas into <span className="text-primary">Organized Tasks</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Use natural language to create tasks or parse meeting transcripts. 
            Our AI automatically extracts assignees, due dates, and priorities.
          </p>
        </div>

        {/* Input Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
          <SingleTaskInput onTaskCreated={handleTaskCreated} />
          <TranscriptInput onTasksCreated={handleTaskCreated} />
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-card border border-border rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-foreground">
              {tasks.filter(t => t.status === 'To Do').length}
            </div>
            <div className="text-sm text-muted-foreground">To Do</div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-foreground">
              {tasks.filter(t => t.status === 'In Progress').length}
            </div>
            <div className="text-sm text-muted-foreground">In Progress</div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-foreground">
              {tasks.filter(t => t.status === 'Done').length}
            </div>
            <div className="text-sm text-muted-foreground">Done</div>
          </div>
        </div>

        {/* Task Board */}
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-6">Your Tasks</h2>
          <TaskBoard
            tasks={tasks}
            onEditTask={handleEditTask}
            onDeleteTask={handleDeleteTask}
          />
        </div>
      </main>

      <Footer />

      {/* Edit Modal */}
      <EditTaskModal
        task={editingTask}
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        onTaskUpdated={handleTaskUpdated}
      />
    </div>
  );
};

export default Index;
