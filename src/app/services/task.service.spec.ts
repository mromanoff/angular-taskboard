import { TestBed } from '@angular/core/testing';
import { TaskService } from './task.service';
import { Task, TaskStatus, TaskPriority } from '../models/task.model';
import { vi, describe, it, expect, beforeEach } from 'vitest';

describe('TaskService', () => {
  let service: TaskService;
  let mockLocalStorage: { [key: string]: string };

  beforeEach(() => {
    // Mock localStorage
    mockLocalStorage = {};

    vi.spyOn(Storage.prototype, 'getItem').mockImplementation((key: string) => {
      return mockLocalStorage[key] || null;
    });

    vi.spyOn(Storage.prototype, 'setItem').mockImplementation((key: string, value: string) => {
      mockLocalStorage[key] = value;
    });

    TestBed.configureTestingModule({});
    service = TestBed.inject(TaskService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Task CRUD Operations', () => {
    it('should get all tasks', () => {
      const tasks = service.getAllTasks();
      expect(tasks).toBeDefined();
      expect(Array.isArray(tasks)).toBe(true);
    });

    it('should add a new task', () => {
      const newTask = {
        title: 'Test Task',
        description: 'Test Description',
        priority: 'high' as TaskPriority,
        status: 'todo' as TaskStatus,
        dueDate: new Date('2025-12-31'),
      };

      const initialCount = service.getAllTasks().length;
      const addedTask = service.addTask(newTask);

      expect(addedTask).toBeDefined();
      expect(addedTask.id).toBeDefined();
      expect(addedTask.title).toBe(newTask.title);
      expect(addedTask.createdAt).toBeDefined();
      expect(service.getAllTasks().length).toBe(initialCount + 1);
    });

    it('should get task by id', () => {
      const newTask = service.addTask({
        title: 'Find Me',
        description: 'Test',
        priority: 'medium' as TaskPriority,
        status: 'todo' as TaskStatus,
        dueDate: null,
      });

      const foundTask = service.getTaskById(newTask.id);
      expect(foundTask).toBeDefined();
      expect(foundTask?.title).toBe('Find Me');
    });

    it('should return undefined for non-existent task id', () => {
      const foundTask = service.getTaskById('non-existent-id');
      expect(foundTask).toBeUndefined();
    });

    it('should update a task', () => {
      const task = service.addTask({
        title: 'Original Title',
        description: 'Original Description',
        priority: 'low' as TaskPriority,
        status: 'todo' as TaskStatus,
        dueDate: null,
      });

      const updatedTask = service.updateTask(task.id, {
        title: 'Updated Title',
        priority: 'high' as TaskPriority,
      });

      expect(updatedTask).toBeDefined();
      expect(updatedTask?.title).toBe('Updated Title');
      expect(updatedTask?.priority).toBe('high');
      expect(updatedTask?.description).toBe('Original Description');
    });

    it('should update task status', () => {
      const task = service.addTask({
        title: 'Test',
        description: 'Test',
        priority: 'medium' as TaskPriority,
        status: 'todo' as TaskStatus,
        dueDate: null,
      });

      const updatedTask = service.updateTaskStatus(task.id, 'done');
      expect(updatedTask?.status).toBe('done');
    });

    it('should delete a task', () => {
      const task = service.addTask({
        title: 'To Be Deleted',
        description: 'Test',
        priority: 'low' as TaskPriority,
        status: 'todo' as TaskStatus,
        dueDate: null,
      });

      const initialCount = service.getAllTasks().length;
      const result = service.deleteTask(task.id);

      expect(result).toBe(true);
      expect(service.getAllTasks().length).toBe(initialCount - 1);
      expect(service.getTaskById(task.id)).toBeUndefined();
    });

    it('should return false when deleting non-existent task', () => {
      const result = service.deleteTask('non-existent-id');
      expect(result).toBe(false);
    });
  });

  describe('Filtering', () => {
    beforeEach(() => {
      service.getAllTasks().forEach(task => service.deleteTask(task.id));

      service.addTask({
        title: 'High Priority Todo',
        description: 'Test',
        priority: 'high' as TaskPriority,
        status: 'todo' as TaskStatus,
        dueDate: null,
      });

      service.addTask({
        title: 'Medium Priority In Progress',
        description: 'Test',
        priority: 'medium' as TaskPriority,
        status: 'in-progress' as TaskStatus,
        dueDate: null,
      });

      service.addTask({
        title: 'Low Priority Done',
        description: 'Test',
        priority: 'low' as TaskPriority,
        status: 'done' as TaskStatus,
        dueDate: null,
      });

      service.addTask({
        title: 'Overdue High Priority',
        description: 'Test',
        priority: 'high' as TaskPriority,
        status: 'todo' as TaskStatus,
        dueDate: new Date('2020-01-01'),
      });
    });

    it('should filter by priority', () => {
      service.setFilterPriority('high');
      const tasksByStatus = service.tasksByStatus();
      const allTasks = [
        ...tasksByStatus.todo,
        ...tasksByStatus.inProgress,
        ...tasksByStatus.done,
      ];

      expect(allTasks.every(task => task.priority === 'high')).toBe(true);
    });

    it('should filter by status', () => {
      service.setFilterStatus('done');
      const tasksByStatus = service.tasksByStatus();
      const allTasks = [
        ...tasksByStatus.todo,
        ...tasksByStatus.inProgress,
        ...tasksByStatus.done,
      ];

      expect(allTasks.every(task => task.status === 'done')).toBe(true);
    });

    it('should filter overdue tasks', () => {
      service.setFilterOverdue(true);
      const tasksByStatus = service.tasksByStatus();
      const allTasks = [
        ...tasksByStatus.todo,
        ...tasksByStatus.inProgress,
        ...tasksByStatus.done,
      ];

      const now = new Date();
      allTasks.forEach(task => {
        if (task.dueDate && task.status !== 'done') {
          expect(new Date(task.dueDate) < now).toBe(true);
        }
      });
    });

    it('should clear all filters', () => {
      service.setFilterPriority('high');
      service.setFilterStatus('done');
      service.setFilterOverdue(true);
      service.setSearchQuery('test');

      service.clearFilters();

      expect(service.filterPriority()).toBe('all');
      expect(service.filterStatus()).toBe('all');
      expect(service.filterOverdue()).toBe(false);
      expect(service.searchQuery()).toBe('');
    });
  });

  describe('Search', () => {
    beforeEach(() => {
      service.getAllTasks().forEach(task => service.deleteTask(task.id));

      service.addTask({
        title: 'Angular Material Setup',
        description: 'Install and configure Angular Material',
        priority: 'high' as TaskPriority,
        status: 'todo' as TaskStatus,
        dueDate: null,
      });

      service.addTask({
        title: 'Create Components',
        description: 'Build the main dashboard components',
        priority: 'medium' as TaskPriority,
        status: 'in-progress' as TaskStatus,
        dueDate: null,
      });

      service.addTask({
        title: 'Write Tests',
        description: 'Add unit tests for Angular services',
        priority: 'low' as TaskPriority,
        status: 'todo' as TaskStatus,
        dueDate: null,
      });
    });

    it('should search by title', () => {
      service.setSearchQuery('Angular');
      const tasksByStatus = service.tasksByStatus();
      const allTasks = [
        ...tasksByStatus.todo,
        ...tasksByStatus.inProgress,
        ...tasksByStatus.done,
      ];

      expect(allTasks.length).toBeGreaterThan(0);
      expect(allTasks.some(task => task.title.toLowerCase().includes('angular'))).toBe(true);
    });

    it('should search by description', () => {
      service.setSearchQuery('dashboard');
      const tasksByStatus = service.tasksByStatus();
      const allTasks = [
        ...tasksByStatus.todo,
        ...tasksByStatus.inProgress,
        ...tasksByStatus.done,
      ];

      expect(allTasks.length).toBe(1);
      expect(allTasks[0].description?.toLowerCase().includes('dashboard')).toBe(true);
    });

    it('should be case-insensitive', () => {
      service.setSearchQuery('ANGULAR');
      const tasksByStatus = service.tasksByStatus();
      const allTasks = [
        ...tasksByStatus.todo,
        ...tasksByStatus.inProgress,
        ...tasksByStatus.done,
      ];

      expect(allTasks.length).toBeGreaterThan(0);
    });

    it('should return all tasks when search query is empty', () => {
      const initialCount = service.getAllTasks().length;
      service.setSearchQuery('');

      const tasksByStatus = service.tasksByStatus();
      const filteredCount = tasksByStatus.todo.length +
                           tasksByStatus.inProgress.length +
                           tasksByStatus.done.length;

      expect(filteredCount).toBe(initialCount);
    });
  });

  describe('Sorting', () => {
    beforeEach(() => {
      service.getAllTasks().forEach(task => service.deleteTask(task.id));

      service.addTask({
        title: 'High Priority',
        description: 'Test',
        priority: 'high' as TaskPriority,
        status: 'todo' as TaskStatus,
        dueDate: new Date('2025-12-31'),
      });

      service.addTask({
        title: 'Low Priority',
        description: 'Test',
        priority: 'low' as TaskPriority,
        status: 'todo' as TaskStatus,
        dueDate: new Date('2025-11-30'),
      });

      service.addTask({
        title: 'Medium Priority',
        description: 'Test',
        priority: 'medium' as TaskPriority,
        status: 'todo' as TaskStatus,
        dueDate: new Date('2025-12-15'),
      });
    });

    it('should sort by priority descending', () => {
      service.setSortOption('priority-desc');
      const tasks = service.tasksByStatus().todo;

      expect(tasks[0].priority).toBe('high');
      expect(tasks[tasks.length - 1].priority).toBe('low');
    });

    it('should sort by priority ascending', () => {
      service.setSortOption('priority-asc');
      const tasks = service.tasksByStatus().todo;

      expect(tasks[0].priority).toBe('low');
      expect(tasks[tasks.length - 1].priority).toBe('high');
    });

    it('should sort by due date ascending', () => {
      service.setSortOption('due-date-asc');
      const tasks = service.tasksByStatus().todo;

      const firstDate = new Date(tasks[0].dueDate!);
      const lastDate = new Date(tasks[tasks.length - 1].dueDate!);
      expect(firstDate <= lastDate).toBe(true);
    });

    it('should sort by due date descending', () => {
      service.setSortOption('due-date-desc');
      const tasks = service.tasksByStatus().todo;

      const firstDate = new Date(tasks[0].dueDate!);
      const lastDate = new Date(tasks[tasks.length - 1].dueDate!);
      expect(firstDate >= lastDate).toBe(true);
    });
  });

  describe('Task Statistics', () => {
    beforeEach(() => {
      service.getAllTasks().forEach(task => service.deleteTask(task.id));
    });

    it('should calculate correct task statistics', () => {
      service.addTask({
        title: 'Todo Task',
        description: 'Test',
        priority: 'high' as TaskPriority,
        status: 'todo' as TaskStatus,
        dueDate: null,
      });

      service.addTask({
        title: 'In Progress Task',
        description: 'Test',
        priority: 'medium' as TaskPriority,
        status: 'in-progress' as TaskStatus,
        dueDate: null,
      });

      service.addTask({
        title: 'Done Task',
        description: 'Test',
        priority: 'low' as TaskPriority,
        status: 'done' as TaskStatus,
        dueDate: null,
      });

      const stats = service.taskStats();
      expect(stats.total).toBe(3);
      expect(stats.todo).toBe(1);
      expect(stats.inProgress).toBe(1);
      expect(stats.done).toBe(1);
    });

    it('should count overdue tasks correctly', () => {
      service.addTask({
        title: 'Overdue Task',
        description: 'Test',
        priority: 'high' as TaskPriority,
        status: 'todo' as TaskStatus,
        dueDate: new Date('2020-01-01'),
      });

      service.addTask({
        title: 'Not Overdue',
        description: 'Test',
        priority: 'medium' as TaskPriority,
        status: 'todo' as TaskStatus,
        dueDate: new Date('2030-01-01'),
      });

      const stats = service.taskStats();
      expect(stats.overdue).toBe(1);
    });
  });

  describe('LocalStorage Integration', () => {
    it('should save tasks to localStorage when tasks change', () => {
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');

      service.addTask({
        title: 'Save Me',
        description: 'Test',
        priority: 'high' as TaskPriority,
        status: 'todo' as TaskStatus,
        dueDate: null,
      });

      // FlushEffects to ensure the effect runs
      TestBed.flushEffects();

      expect(setItemSpy).toHaveBeenCalled();
    });
  });

  describe('TasksByStatus', () => {
    beforeEach(() => {
      service.getAllTasks().forEach(task => service.deleteTask(task.id));
    });

    it('should group tasks by status correctly', () => {
      service.addTask({
        title: 'Todo 1',
        description: 'Test',
        priority: 'high' as TaskPriority,
        status: 'todo' as TaskStatus,
        dueDate: null,
      });

      service.addTask({
        title: 'Todo 2',
        description: 'Test',
        priority: 'medium' as TaskPriority,
        status: 'todo' as TaskStatus,
        dueDate: null,
      });

      service.addTask({
        title: 'In Progress',
        description: 'Test',
        priority: 'high' as TaskPriority,
        status: 'in-progress' as TaskStatus,
        dueDate: null,
      });

      service.addTask({
        title: 'Done',
        description: 'Test',
        priority: 'low' as TaskPriority,
        status: 'done' as TaskStatus,
        dueDate: null,
      });

      const tasksByStatus = service.tasksByStatus();

      expect(tasksByStatus.todo.length).toBe(2);
      expect(tasksByStatus.inProgress.length).toBe(1);
      expect(tasksByStatus.done.length).toBe(1);
    });
  });
});
