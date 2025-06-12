import { useState } from 'react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Plus, Loader2 } from 'lucide-react';
import { useToast } from '../hooks/use-toast';

interface SingleTaskInputProps {
  onTaskCreated: () => void;
}

export function SingleTaskInput({ onTaskCreated }: SingleTaskInputProps) {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleCreate = async () => {
    if (!input.trim()) {
      toast({
        title: "Input required",
        description: "Please enter a task description",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    try {
      // Import the API service and create the task
      const { api } = await import('../services/api');
      await api.createSingleTask(input.trim());
      
      setInput('');
      onTaskCreated();
      
      toast({
        title: "Task created",
        description: "Your task has been successfully created",
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      toast({
        title: "Creation Failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleCreate();
    }
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg text-card-foreground flex items-center gap-2">
          <Plus className="h-5 w-5 text-primary" />
          Create Single Task
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Describe your task in natural language. Our AI will extract assignees, due dates, and priorities.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          placeholder="E.g., 'Design the new homepage for Sarah by next Friday with high priority'"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          className="min-h-[100px] resize-none bg-input border-border text-foreground placeholder:text-muted-foreground"
          disabled={isLoading}
        />
        
        <div className="flex justify-between items-center">
          <p className="text-xs text-muted-foreground">
            Press Cmd/Ctrl + Enter to create quickly
          </p>
          <Button 
            onClick={handleCreate}
            disabled={isLoading || !input.trim()}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Create Task
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}