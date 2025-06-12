import { Task } from '../types';

export const MOCK_TASKS: Task[] = [
  {
    id: '1a9a7a3b-2b8b-4c7c-8d6d-4e2e1f0f8a3a',
    task_name: 'Design the new landing page',
    assignee: 'Aman',
    due_date: new Date(new Date().setDate(new Date().getDate() + 2)).toISOString(),
    priority: 'P1',
    status: 'To Do',
    original_text: 'Design the new landing page Aman by tomorrow night',
    source: 'single_task',
    created_at: new Date().toISOString(),
    user_id: null
  },
  {
    id: '2b8b1a9a-3c7c-4d6d-8e2e-1f0f8a3b4c7c',
    task_name: 'Develop user authentication flow',
    assignee: 'Rajeev',
    due_date: new Date(new Date().setDate(new Date().getDate() + 5)).toISOString(),
    priority: 'P2',
    status: 'In Progress',
    original_text: 'Rajeev to develop the user auth flow by next Tuesday',
    source: 'transcript',
    created_at: new Date().toISOString(),
    user_id: null
  },
  {
    id: '3c7c4d6d-8e2e-1f0f-8a3b-4c7c1a9a7a3b',
    task_name: 'Write API documentation',
    assignee: 'Sarah',
    due_date: new Date(new Date().setDate(new Date().getDate() + 7)).toISOString(),
    priority: 'P3',
    status: 'Done',
    original_text: 'Sarah please complete the API docs by end of week',
    source: 'transcript',
    created_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    user_id: null
  },
  {
    id: '4d6d8e2e-1f0f-8a3b-4c7c-1a9a7a3b2b8b',
    task_name: 'Set up CI/CD pipeline',
    assignee: 'Alex',
    due_date: new Date(new Date().setDate(new Date().getDate() + 3)).toISOString(),
    priority: 'P2',
    status: 'To Do',
    original_text: 'Alex needs to configure the deployment pipeline',
    source: 'single_task',
    created_at: new Date(Date.now() - 43200000).toISOString(), // 12 hours ago
    user_id: null
  },
  {
    id: '5e2e1f0f-8a3b-4c7c-1a9a-7a3b2b8b3c7c',
    task_name: 'Review code for security vulnerabilities',
    assignee: null,
    due_date: new Date(new Date().setDate(new Date().getDate() + 1)).toISOString(),
    priority: 'P1',
    status: 'In Progress',
    original_text: 'Security review needed urgently for the latest code changes',
    source: 'transcript',
    created_at: new Date().toISOString(),
    user_id: null
  }
];