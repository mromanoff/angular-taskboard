import { Injectable, signal, computed, effect } from '@angular/core';
import { Task, TaskStatus, TaskPriority } from '../models/task.model';

export type SortOption = 'priority-desc' | 'priority-asc' | 'due-date-asc' | 'due-date-desc' | 'created-desc' | 'created-asc';

const STORAGE_KEY = 'angular-taskboard-tasks';

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private tasksSignal = signal<Task[]>(this.getInitialTasks());

  constructor() {
    // Automatically save tasks to localStorage whenever they change
    effect(() => {
      const tasks = this.tasksSignal();
      this.saveToLocalStorage(tasks);
    });
  }

  // Filter and sort state
  private filterPrioritySignal = signal<TaskPriority | 'all'>('all');
  private filterStatusSignal = signal<TaskStatus | 'all'>('all');
  private filterOverdueSignal = signal<boolean>(false);
  private sortOptionSignal = signal<SortOption>('priority-desc');
  private searchQuerySignal = signal<string>('');

  readonly tasks = this.tasksSignal.asReadonly();
  readonly filterPriority = this.filterPrioritySignal.asReadonly();
  readonly filterStatus = this.filterStatusSignal.asReadonly();
  readonly filterOverdue = this.filterOverdueSignal.asReadonly();
  readonly sortOption = this.sortOptionSignal.asReadonly();
  readonly searchQuery = this.searchQuerySignal.asReadonly();

  // Filtered and sorted tasks
  private filteredAndSortedTasks = computed(() => {
    let tasks = this.tasksSignal();
    const filterPriority = this.filterPrioritySignal();
    const filterStatus = this.filterStatusSignal();
    const filterOverdue = this.filterOverdueSignal();
    const sortOption = this.sortOptionSignal();
    const searchQuery = this.searchQuerySignal().toLowerCase().trim();

    // Apply filters
    if (filterPriority !== 'all') {
      tasks = tasks.filter(task => task.priority === filterPriority);
    }

    if (filterStatus !== 'all') {
      tasks = tasks.filter(task => task.status === filterStatus);
    }

    if (filterOverdue) {
      const now = new Date();
      tasks = tasks.filter(task =>
        task.dueDate && new Date(task.dueDate) < now && task.status !== 'done'
      );
    }

    // Apply search filter
    if (searchQuery) {
      tasks = tasks.filter(task => {
        const titleMatch = task.title.toLowerCase().includes(searchQuery);
        const descriptionMatch = task.description?.toLowerCase().includes(searchQuery);
        return titleMatch || descriptionMatch;
      });
    }

    // Apply sorting
    const sortedTasks = [...tasks];
    const priorityOrder: Record<TaskPriority, number> = { high: 3, medium: 2, low: 1 };

    switch (sortOption) {
      case 'priority-desc':
        sortedTasks.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);
        break;
      case 'priority-asc':
        sortedTasks.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
        break;
      case 'due-date-asc':
        sortedTasks.sort((a, b) => {
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        });
        break;
      case 'due-date-desc':
        sortedTasks.sort((a, b) => {
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime();
        });
        break;
      case 'created-asc':
        sortedTasks.sort((a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        break;
      case 'created-desc':
        sortedTasks.sort((a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        break;
    }

    return sortedTasks;
  });

  readonly tasksByStatus = computed(() => {
    const tasks = this.filteredAndSortedTasks();
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

  setFilterPriority(priority: TaskPriority | 'all'): void {
    this.filterPrioritySignal.set(priority);
  }

  setFilterStatus(status: TaskStatus | 'all'): void {
    this.filterStatusSignal.set(status);
  }

  setFilterOverdue(overdue: boolean): void {
    this.filterOverdueSignal.set(overdue);
  }

  setSortOption(option: SortOption): void {
    this.sortOptionSignal.set(option);
  }

  setSearchQuery(query: string): void {
    this.searchQuerySignal.set(query);
  }

  clearFilters(): void {
    this.filterPrioritySignal.set('all');
    this.filterStatusSignal.set('all');
    this.filterOverdueSignal.set(false);
    this.searchQuerySignal.set('');
  }

  private generateId(): string {
    return `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private saveToLocalStorage(tasks: Task[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch (error) {
      console.error('Error saving tasks to localStorage:', error);
    }
  }

  private loadFromLocalStorage(): Task[] | null {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        return null;
      }
      return JSON.parse(stored);
    } catch (error) {
      console.error('Error loading tasks from localStorage:', error);
      return null;
    }
  }

  private getInitialTasks(): Task[] {
    // Try to load from localStorage first
    const storedTasks = this.loadFromLocalStorage();
    if (storedTasks && storedTasks.length > 0) {
      return storedTasks;
    }

    // Return sample tasks if nothing in localStorage
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
