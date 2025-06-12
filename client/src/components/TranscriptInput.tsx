import { useState } from 'react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { FileText, Loader2 } from 'lucide-react';
import { useToast } from '../hooks/use-toast';

interface TranscriptInputProps {
  onTasksCreated: () => void;
}

export function TranscriptInput({ onTasksCreated }: TranscriptInputProps) {
  const [transcript, setTranscript] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleParse = async () => {
    if (!transcript.trim()) {
      toast({
        title: "Input required",
        description: "Please paste a meeting transcript or conversation",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    try {
      // Import the API service and parse the transcript
      const { api } = await import('../services/api');
      const newTasks = await api.parseTranscript(transcript.trim());
      
      setTranscript('');
      onTasksCreated();
      
      // Handle case where no tasks were created from a valid transcript
      if (newTasks.length === 0) {
        toast({
          title: "Parsing Complete",
          description: "No actionable tasks were found in the transcript.",
          variant: "default", 
        });
      } else {
        toast({
          title: "Transcript Parsed",
          description: `Successfully created ${newTasks.length} task(s) from the transcript.`,
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      toast({
        title: "Parsing Failed",
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
      handleParse();
    }
  };

  const sampleTranscript = `"Let's discuss the project timeline. Sarah, can you complete the API documentation by end of this week? Also, Alex needs to set up the CI/CD pipeline by next Tuesday. Mike should review the security aspects of our latest code changes - this is urgent and needs to be done by tomorrow."`;

  const handleUseSample = () => {
    setTranscript(sampleTranscript);
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg text-card-foreground flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          Parse Meeting Transcript
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Paste a meeting transcript or conversation, and we'll automatically extract multiple tasks with assignees and deadlines.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          placeholder="Paste your meeting transcript, conversation, or notes here..."
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          onKeyDown={handleKeyDown}
          className="min-h-[150px] resize-none bg-input border-border text-foreground placeholder:text-muted-foreground"
          disabled={isLoading}
        />
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">
              Press Cmd/Ctrl + Enter to parse quickly
            </p>
            <Button
              variant="link"
              size="sm"
              onClick={handleUseSample}
              className="h-auto p-0 text-xs text-primary hover:text-primary/80"
              disabled={isLoading}
            >
              Use sample transcript
            </Button>
          </div>
          
          <Button 
            onClick={handleParse}
            disabled={isLoading || !transcript.trim()}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Parsing...
              </>
            ) : (
              <>
                <FileText className="mr-2 h-4 w-4" />
                Parse Transcript
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}