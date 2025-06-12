export interface Task {
  id: string;
  task_name: string;
  assignee: string | null;
  due_date: string | null; // ISO 8601 date-time string
  priority: 'P1' | 'P2' | 'P3' | 'P4';
  status: 'To Do' | 'In Progress' | 'Done';
  original_text: string | null;
  source: 'single_task' | 'transcript';
  created_at: string; // ISO 8601 string
  user_id: string | null; // This will always be null in Phase 1
}

export interface CreateTaskData {
  task_name: string;
  assignee?: string;
  due_date?: string;
  priority?: 'P1' | 'P2' | 'P3' | 'P4';
  original_text?: string;
  source: 'single_task' | 'transcript';
}

export interface UpdateTaskData {
  task_name?: string;
  assignee?: string | null;
  due_date?: string | null;
  priority?: 'P1' | 'P2' | 'P3' | 'P4';
  status?: 'To Do' | 'In Progress' | 'Done';
}