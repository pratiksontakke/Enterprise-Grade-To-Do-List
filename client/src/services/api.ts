import { Task, CreateTaskData, UpdateTaskData } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

// --- Fallback Data and Logic ---
// This section is used only when the backend API is not available.

import { MOCK_TASKS } from '../data/mock-data';

// In-memory storage for fallback mode
let fallbackTasks: Task[] = [...MOCK_TASKS];

const generateId = (): string => {
  return 'fallback-' + Math.random().toString(36).substr(2, 9);
};

// Helper functions for mock parsing
function extractAssignee(text: string): string | null {
  const names = ['Aman', 'Rajeev', 'Sarah', 'Alex', 'Mike', 'Lisa', 'David', 'Emily'];
  const lowerText = text.toLowerCase();
  for (const name of names) {
    if (lowerText.includes(name.toLowerCase())) {
      return name;
    }
  }
  return null;
}

function extractDueDate(text: string): string | null {
  const lowerText = text.toLowerCase();
  const now = new Date();
  if (lowerText.includes('tomorrow')) {
    return new Date(now.setDate(now.getDate() + 1)).toISOString();
  } else if (lowerText.includes('next week')) {
    return new Date(now.setDate(now.getDate() + 7)).toISOString();
  }
  return new Date(now.setDate(now.getDate() + 3)).toISOString();
}

function extractPriority(text: string): 'P1' | 'P2' | 'P3' | 'P4' {
  const lowerText = text.toLowerCase();
  if (lowerText.includes('urgent') || lowerText.includes('critical')) return 'P1';
  if (lowerText.includes('important')) return 'P2';
  if (lowerText.includes('low')) return 'P4';
  return 'P3';
}

// --- API Service ---

export const api = {
  // GET /tasks - Fetch all tasks
  async getTasks(): Promise<Task[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/tasks`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.warn('Backend offline. Loading fallback data for getTasks.', error);
      return [...fallbackTasks];
    }
  },

  // POST /tasks/parse-single - Create a single task from natural language
  async createSingleTask(input: string): Promise<Task> {
    try {
      const response = await fetch(`${API_BASE_URL}/tasks/parse-single`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: input }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        let errorMessage = `Request failed: ${response.statusText}`;

        // Correctly parse the detailed error message from FastAPI
        if (errorData?.detail) {
            if (Array.isArray(errorData.detail) && errorData.detail[0]?.msg) {
                // Handles Pydantic validation errors
                errorMessage = errorData.detail[0].msg;
            } else if (typeof errorData.detail === 'string') {
                // Handles standard HTTPExceptions
                errorMessage = errorData.detail;
            }
        }
        throw new Error(errorMessage);
      }

      return await response.json();

    } catch (error) {
      // If the error is a specific message we threw, re-throw it for the UI to display.
      // Otherwise, assume it's a network failure and trigger the fallback.
      if (error instanceof Error && !error.message.toLowerCase().includes('failed to fetch')) {
          throw error;
      }
      
      console.warn('Backend offline or network error. Using fallback for createSingleTask.', error);
      const newTask: Task = {
        id: generateId(),
        task_name: input.length > 50 ? input.substring(0, 50) + '...' : input,
        assignee: extractAssignee(input),
        due_date: extractDueDate(input),
        priority: extractPriority(input),
        status: 'To Do',
        original_text: input,
        source: 'single_task',
        created_at: new Date().toISOString(),
        user_id: null
      };
      fallbackTasks.push(newTask);
      return newTask;
    }
  },

  // POST /tasks/parse-transcript - Create multiple tasks from a transcript
  async parseTranscript(transcript: string): Promise<Task[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/tasks/parse-transcript`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: transcript }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        let errorMessage = `Request failed: ${response.statusText}`;
        if (errorData?.detail) {
          errorMessage = typeof errorData.detail === 'string' ? errorData.detail : JSON.stringify(errorData.detail);
        }
        throw new Error(errorMessage);
      }

      const newTasksResult = await response.json();
      return newTasksResult || []; // The endpoint returns a direct list
      
    } catch (error) {
      if (error instanceof Error && !error.message.toLowerCase().includes('failed to fetch')) {
          throw error;
      }
      
      console.warn('Backend offline or network error. Using fallback for parseTranscript.', error);
      // Fallback logic
      const newTasks: Task[] = [
        {
          id: generateId(),
          task_name: 'Review meeting notes and action items (Fallback)',
          assignee: extractAssignee(transcript) || 'Team Lead',
          due_date: new Date(new Date().setDate(new Date().getDate() + 1)).toISOString(),
          priority: 'P2',
          status: 'To Do',
          original_text: transcript,
          source: 'transcript',
          created_at: new Date().toISOString(),
          user_id: null
        },
        {
          id: generateId(),
          task_name: 'Follow up on key decisions made',
          assignee: null,
          due_date: new Date(new Date().setDate(new Date().getDate() + 3)).toISOString(),
          priority: 'P3',
          status: 'To Do',
          original_text: transcript,
          source: 'transcript',
          created_at: new Date().toISOString(),
          user_id: null
        },
        {
          id: generateId(),
          task_name: 'Prepare status update for next meeting',
          assignee: extractAssignee(transcript),
          due_date: new Date(new Date().setDate(new Date().getDate() + 7)).toISOString(),
          priority: 'P4',
          status: 'To Do',
          original_text: transcript,
          source: 'transcript',
          created_at: new Date().toISOString(),
          user_id: null
        }
      ];
      fallbackTasks.push(...newTasks);
      return newTasks;
    }
  },

  // PUT /tasks/{id} - Update a task
  async updateTask(id: string, updateData: UpdateTaskData): Promise<Task> {
     try {
      const response = await fetch(`${API_BASE_URL}/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const updatedTask = await response.json();
      return updatedTask;
    } catch (error) {
      console.warn(`Backend offline. Using fallback for updateTask (id: ${id}).`, error);
      const taskIndex = fallbackTasks.findIndex(task => task.id === id);
      if (taskIndex === -1) {
        throw new Error('Task not found in fallback data');
      }
      fallbackTasks[taskIndex] = { ...fallbackTasks[taskIndex], ...updateData };
      return fallbackTasks[taskIndex];
    }
  },

  // DELETE /tasks/{id} - Delete a task
  async deleteTask(id: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/tasks/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      // Real API call doesn't return content, but we resolve the promise
      return;
    } catch (error) {
      console.warn(`Backend offline. Using fallback for deleteTask (id: ${id}).`, error);
      const taskIndex = fallbackTasks.findIndex(task => task.id === id);
      if (taskIndex === -1) {
        console.error('Task not found in fallback data for deletion');
        return;
      }
      fallbackTasks.splice(taskIndex, 1);
    }
  }
};