import { Injectable, signal, computed, effect } from '@angular/core';
import { Task, TaskStatus, TaskPriority, Subtask, Comment } from '../models/task.model';

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
  private filterTagsSignal = signal<string[]>([]);
  private sortOptionSignal = signal<SortOption>('priority-desc');
  private searchQuerySignal = signal<string>('');

  readonly tasks = this.tasksSignal.asReadonly();
  readonly filterPriority = this.filterPrioritySignal.asReadonly();
  readonly filterStatus = this.filterStatusSignal.asReadonly();
  readonly filterOverdue = this.filterOverdueSignal.asReadonly();
  readonly filterTags = this.filterTagsSignal.asReadonly();
  readonly sortOption = this.sortOptionSignal.asReadonly();
  readonly searchQuery = this.searchQuerySignal.asReadonly();

  // Filtered and sorted tasks
  private filteredAndSortedTasks = computed(() => {
    let tasks = this.tasksSignal();
    const filterPriority = this.filterPrioritySignal();
    const filterStatus = this.filterStatusSignal();
    const filterOverdue = this.filterOverdueSignal();
    const filterTags = this.filterTagsSignal();
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

    // Apply tag filter
    if (filterTags.length > 0) {
      tasks = tasks.filter(task =>
        filterTags.every(tag => task.tags?.includes(tag) || false)
      );
    }

    // Apply search filter
    if (searchQuery) {
      tasks = tasks.filter(task => {
        const titleMatch = task.title.toLowerCase().includes(searchQuery);
        const descriptionMatch = task.description?.toLowerCase().includes(searchQuery);
        const tagsMatch = task.tags?.some(tag => tag.toLowerCase().includes(searchQuery)) || false;
        return titleMatch || descriptionMatch || tagsMatch;
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
      title: taskData.title,
      description: taskData.description,
      priority: taskData.priority,
      status: taskData.status,
      dueDate: taskData.dueDate,
      tags: taskData.tags || [],
      subtasks: taskData.subtasks || [],
      comments: taskData.comments || [],
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

  setFilterTags(tags: string[]): void {
    this.filterTagsSignal.set(tags);
  }

  clearFilters(): void {
    this.filterPrioritySignal.set('all');
    this.filterStatusSignal.set('all');
    this.filterOverdueSignal.set(false);
    this.filterTagsSignal.set([]);
    this.searchQuerySignal.set('');
  }

  // Get all unique tags from all tasks
  readonly allTags = computed(() => {
    const tasks = this.tasksSignal();
    const tagSet = new Set<string>();
    tasks.forEach(task => {
      task.tags?.forEach(tag => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  });

  // Subtask management
  addSubtask(taskId: string, title: string): Subtask | undefined {
    const task = this.getTaskById(taskId);
    if (!task) return undefined;

    const newSubtask: Subtask = {
      id: this.generateId(),
      title,
      completed: false,
      createdAt: new Date()
    };

    this.updateTask(taskId, {
      subtasks: [...(task.subtasks || []), newSubtask]
    });

    return newSubtask;
  }

  toggleSubtask(taskId: string, subtaskId: string): boolean {
    const task = this.getTaskById(taskId);
    if (!task || !task.subtasks) return false;

    const updatedSubtasks = task.subtasks.map(subtask =>
      subtask.id === subtaskId
        ? { ...subtask, completed: !subtask.completed }
        : subtask
    );

    this.updateTask(taskId, { subtasks: updatedSubtasks });
    return true;
  }

  deleteSubtask(taskId: string, subtaskId: string): boolean {
    const task = this.getTaskById(taskId);
    if (!task || !task.subtasks) return false;

    const updatedSubtasks = task.subtasks.filter(subtask => subtask.id !== subtaskId);
    this.updateTask(taskId, { subtasks: updatedSubtasks });
    return true;
  }

  // Comment management
  addComment(taskId: string, text: string, author: string = 'User'): Comment | undefined {
    const task = this.getTaskById(taskId);
    if (!task) return undefined;

    const newComment: Comment = {
      id: this.generateId(),
      text,
      author,
      createdAt: new Date()
    };

    this.updateTask(taskId, {
      comments: [...(task.comments || []), newComment]
    });

    return newComment;
  }

  deleteComment(taskId: string, commentId: string): boolean {
    const task = this.getTaskById(taskId);
    if (!task || !task.comments) return false;

    const updatedComments = task.comments.filter(comment => comment.id !== commentId);
    this.updateTask(taskId, { comments: updatedComments });
    return true;
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
        priority: 'high' as TaskPriority,
        status: 'done' as TaskStatus,
        dueDate: new Date('2025-11-20'),
        createdAt: new Date('2025-11-18'),
        tags: ['angular', 'setup', 'ui'],
        subtasks: [],
        comments: []
      },
      {
        id: 'task-2',
        title: 'Create project structure',
        description: 'Set up folder structure with components, services, and models',
        priority: 'high' as TaskPriority,
        status: 'done' as TaskStatus,
        dueDate: new Date('2025-11-21'),
        createdAt: new Date('2025-11-19'),
        tags: ['angular', 'setup'],
        subtasks: [],
        comments: []
      },
      {
        id: 'task-3',
        title: 'Implement task service',
        description: 'Build TaskService with CRUD operations and signal-based state management',
        priority: 'high' as TaskPriority,
        status: 'in-progress' as TaskStatus,
        dueDate: new Date('2025-11-23'),
        createdAt: new Date('2025-11-22'),
        tags: ['angular', 'service', 'signals'],
        subtasks: [
          { id: 'subtask-1', title: 'Create service skeleton', completed: true, createdAt: new Date('2025-11-22') },
          { id: 'subtask-2', title: 'Add CRUD operations', completed: true, createdAt: new Date('2025-11-22') },
          { id: 'subtask-3', title: 'Implement filtering', completed: false, createdAt: new Date('2025-11-22') }
        ],
        comments: [
          { id: 'comment-1', text: 'Using Angular signals for reactive state', author: 'User', createdAt: new Date('2025-11-22') }
        ]
      },
      {
        id: 'task-4',
        title: 'Create task list component',
        description: 'Display tasks using Material cards with status badges and action buttons',
        priority: 'medium' as TaskPriority,
        status: 'todo' as TaskStatus,
        dueDate: new Date('2025-11-24'),
        createdAt: new Date('2025-11-22'),
        tags: ['angular', 'component', 'ui'],
        subtasks: [],
        comments: []
      },
      {
        id: 'task-5',
        title: 'Add task form with dialog',
        description: 'Create reactive form for adding and editing tasks with validation',
        priority: 'medium' as TaskPriority,
        status: 'todo' as TaskStatus,
        dueDate: new Date('2025-11-25'),
        createdAt: new Date('2025-11-22'),
        tags: ['angular', 'forms', 'ui'],
        subtasks: [],
        comments: []
      },
      {
        id: 'task-6',
        title: 'Implement drag and drop',
        description: 'Enable task reordering and status changes via drag and drop',
        priority: 'medium' as TaskPriority,
        status: 'todo' as TaskStatus,
        dueDate: new Date('2025-11-27'),
        createdAt: new Date('2025-11-22'),
        tags: ['angular', 'cdk', 'ux'],
        subtasks: [],
        comments: []
      },
      {
        id: 'task-7',
        title: 'Add filtering and sorting',
        description: 'Implement filters for status/priority and sorting options',
        priority: 'low' as TaskPriority,
        status: 'todo' as TaskStatus,
        dueDate: new Date('2025-11-28'),
        createdAt: new Date('2025-11-22'),
        tags: ['angular', 'feature'],
        subtasks: [],
        comments: []
      },
      {
        id: 'task-8',
        title: 'Create theme toggle',
        description: 'Add dark/light theme toggle with localStorage persistence',
        priority: 'low' as TaskPriority,
        status: 'todo' as TaskStatus,
        dueDate: new Date('2025-11-29'),
        createdAt: new Date('2025-11-22'),
        tags: ['angular', 'theme', 'ux'],
        subtasks: [],
        comments: []
      }
    ];
  }
}
