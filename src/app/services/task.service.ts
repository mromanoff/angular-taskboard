import { Injectable, signal, computed } from '@angular/core';
import { Task, TaskStatus, TaskPriority } from '../models/task.model';

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private tasksSignal = signal<Task[]>(this.getInitialTasks());

  readonly tasks = this.tasksSignal.asReadonly();

  readonly tasksByStatus = computed(() => {
    const tasks = this.tasksSignal();
    return {
      todo: tasks.filter(task => task.status === 'todo'),
      inProgress: tasks.filter(task => task.status === 'in-progress'),
      done: tasks.filter(task => task.status === 'done')
    };
  });

  readonly taskStats = computed(() => {
    const tasks = this.tasksSignal();
    const now = new Date();
    return {
      total: tasks.length,
      todo: tasks.filter(task => task.status === 'todo').length,
      inProgress: tasks.filter(task => task.status === 'in-progress').length,
      done: tasks.filter(task => task.status === 'done').length,
      overdue: tasks.filter(task =>
        task.dueDate && new Date(task.dueDate) < now && task.status !== 'done'
      ).length
    };
  });

  getAllTasks(): Task[] {
    return this.tasksSignal();
  }

  getTaskById(id: string): Task | undefined {
    return this.tasksSignal().find(task => task.id === id);
  }

  addTask(taskData: Omit<Task, 'id' | 'createdAt'>): Task {
    const newTask: Task = {
      ...taskData,
      id: this.generateId(),
      createdAt: new Date()
    };

    this.tasksSignal.update(tasks => [...tasks, newTask]);
    return newTask;
  }

  updateTask(id: string, updates: Partial<Omit<Task, 'id' | 'createdAt'>>): Task | undefined {
    let updatedTask: Task | undefined;

    this.tasksSignal.update(tasks =>
      tasks.map(task => {
        if (task.id === id) {
          updatedTask = { ...task, ...updates };
          return updatedTask;
        }
        return task;
      })
    );

    return updatedTask;
  }

  deleteTask(id: string): boolean {
    const initialLength = this.tasksSignal().length;
    this.tasksSignal.update(tasks => tasks.filter(task => task.id !== id));
    return this.tasksSignal().length < initialLength;
  }

  updateTaskStatus(id: string, status: TaskStatus): Task | undefined {
    return this.updateTask(id, { status });
  }

  private generateId(): string {
    return `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private getInitialTasks(): Task[] {
    return [
      {
        id: 'task-1',
        title: 'Set up Angular Material',
        description: 'Install and configure Angular Material with custom theme',
        priority: 'high',
        status: 'done',
        dueDate: new Date('2025-11-20'),
        createdAt: new Date('2025-11-18')
      },
      {
        id: 'task-2',
        title: 'Create project structure',
        description: 'Set up folder structure with components, services, and models',
        priority: 'high',
        status: 'done',
        dueDate: new Date('2025-11-21'),
        createdAt: new Date('2025-11-19')
      },
      {
        id: 'task-3',
        title: 'Implement task service',
        description: 'Build TaskService with CRUD operations and signal-based state management',
        priority: 'high',
        status: 'in-progress',
        dueDate: new Date('2025-11-23'),
        createdAt: new Date('2025-11-22')
      },
      {
        id: 'task-4',
        title: 'Create task list component',
        description: 'Display tasks using Material cards with status badges and action buttons',
        priority: 'medium',
        status: 'todo',
        dueDate: new Date('2025-11-24'),
        createdAt: new Date('2025-11-22')
      },
      {
        id: 'task-5',
        title: 'Add task form with dialog',
        description: 'Create reactive form for adding and editing tasks with validation',
        priority: 'medium',
        status: 'todo',
        dueDate: new Date('2025-11-25'),
        createdAt: new Date('2025-11-22')
      },
      {
        id: 'task-6',
        title: 'Implement drag and drop',
        description: 'Enable task reordering and status changes via drag and drop',
        priority: 'medium',
        status: 'todo',
        dueDate: new Date('2025-11-27'),
        createdAt: new Date('2025-11-22')
      },
      {
        id: 'task-7',
        title: 'Add filtering and sorting',
        description: 'Implement filters for status/priority and sorting options',
        priority: 'low',
        status: 'todo',
        dueDate: new Date('2025-11-28'),
        createdAt: new Date('2025-11-22')
      },
      {
        id: 'task-8',
        title: 'Create theme toggle',
        description: 'Add dark/light theme toggle with localStorage persistence',
        priority: 'low',
        status: 'todo',
        dueDate: new Date('2025-11-29'),
        createdAt: new Date('2025-11-22')
      }
    ];
  }
}
