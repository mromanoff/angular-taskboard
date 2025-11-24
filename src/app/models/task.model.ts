export type TaskPriority = 'low' | 'medium' | 'high';
export type TaskStatus = 'todo' | 'in-progress' | 'done';

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
  createdAt: Date;
}

export interface Comment {
  id: string;
  text: string;
  author: string;
  createdAt: Date;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: Date | null;
  createdAt: Date;
  tags?: string[];
  subtasks?: Subtask[];
  comments?: Comment[];
}
