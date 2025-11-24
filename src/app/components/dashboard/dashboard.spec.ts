import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { Dashboard } from './dashboard';
import { TaskService } from '../../services/task.service';
import { Task, TaskStatus, TaskPriority } from '../../models/task.model';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';

describe('Dashboard', () => {
  let component: Dashboard;
  let fixture: ComponentFixture<Dashboard>;
  let mockTaskService: {
    tasks: ReturnType<typeof signal<Task[]>>;
    taskStats: ReturnType<typeof signal<{
      total: number;
      todo: number;
      inProgress: number;
      done: number;
      overdue: number;
    }>>;
  };

  const createMockTask = (overrides?: Partial<Task>): Task => ({
    id: Math.random().toString(36).substring(7),
    title: 'Test Task',
    description: 'Test Description',
    priority: 'medium' as TaskPriority,
    status: 'todo' as TaskStatus,
    dueDate: null,
    createdAt: new Date(),
    ...overrides,
  });

  beforeEach(async () => {
    // Mock canvas getContext for Chart.js
    HTMLCanvasElement.prototype.getContext = vi.fn(() => {
      return {
        fillRect: vi.fn(),
        clearRect: vi.fn(),
        getImageData: vi.fn(),
        putImageData: vi.fn(),
        createImageData: vi.fn(),
        setTransform: vi.fn(),
        drawImage: vi.fn(),
        save: vi.fn(),
        fillText: vi.fn(),
        restore: vi.fn(),
        beginPath: vi.fn(),
        moveTo: vi.fn(),
        lineTo: vi.fn(),
        closePath: vi.fn(),
        stroke: vi.fn(),
        translate: vi.fn(),
        scale: vi.fn(),
        rotate: vi.fn(),
        arc: vi.fn(),
        fill: vi.fn(),
        measureText: vi.fn(() => ({ width: 0 })),
        transform: vi.fn(),
        rect: vi.fn(),
        clip: vi.fn(),
      };
    }) as any;

    // Create mock task service with signals
    mockTaskService = {
      tasks: signal<Task[]>([]),
      taskStats: signal({
        total: 0,
        todo: 0,
        inProgress: 0,
        done: 0,
        overdue: 0,
      }),
    };

    await TestBed.configureTestingModule({
      imports: [Dashboard],
      providers: [
        { provide: TaskService, useValue: mockTaskService },
        provideCharts(withDefaultRegisterables()),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Dashboard);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Component Initialization', () => {
    it('should initialize with empty stats', () => {
      const stats = component.stats();
      expect(stats.total).toBe(0);
      expect(stats.todo).toBe(0);
      expect(stats.inProgress).toBe(0);
      expect(stats.done).toBe(0);
      expect(stats.overdue).toBe(0);
    });

    it('should calculate completion rate as 0 when no tasks exist', () => {
      expect(component.completionRate()).toBe(0);
    });

    it('should have correct chart types', () => {
      expect(component.pieChartType).toBe('pie');
      expect(component.barChartType).toBe('bar');
      expect(component.lineChartType).toBe('line');
    });
  });

  describe('Statistics', () => {
    it('should reflect stats from task service', () => {
      mockTaskService.taskStats.set({
        total: 10,
        todo: 3,
        inProgress: 4,
        done: 3,
        overdue: 1,
      });

      fixture.detectChanges();

      const stats = component.stats();
      expect(stats.total).toBe(10);
      expect(stats.todo).toBe(3);
      expect(stats.inProgress).toBe(4);
      expect(stats.done).toBe(3);
      expect(stats.overdue).toBe(1);
    });

    it('should calculate completion rate correctly', () => {
      mockTaskService.taskStats.set({
        total: 10,
        todo: 3,
        inProgress: 4,
        done: 3,
        overdue: 1,
      });

      fixture.detectChanges();

      // 3 done out of 10 total = 30%
      expect(component.completionRate()).toBe(30);
    });

    it('should round completion rate to nearest integer', () => {
      mockTaskService.taskStats.set({
        total: 3,
        todo: 1,
        inProgress: 1,
        done: 1,
        overdue: 0,
      });

      fixture.detectChanges();

      // 1 done out of 3 total = 33.33% -> rounds to 33
      expect(component.completionRate()).toBe(33);
    });

    it('should handle 100% completion rate', () => {
      mockTaskService.taskStats.set({
        total: 5,
        todo: 0,
        inProgress: 0,
        done: 5,
        overdue: 0,
      });

      fixture.detectChanges();

      expect(component.completionRate()).toBe(100);
    });
  });

  describe('Pie Chart - Task Status Distribution', () => {
    it('should generate correct pie chart data', () => {
      mockTaskService.taskStats.set({
        total: 10,
        todo: 3,
        inProgress: 4,
        done: 3,
        overdue: 1,
      });

      fixture.detectChanges();

      const chartData = component.pieChartData();

      expect(chartData.labels).toEqual(['To Do', 'In Progress', 'Done']);
      expect(chartData.datasets).toHaveLength(1);
      expect(chartData.datasets[0].data).toEqual([3, 4, 3]);
    });

    it('should have correct colors for pie chart', () => {
      fixture.detectChanges();
      const chartData = component.pieChartData();

      expect(chartData.datasets[0].backgroundColor).toEqual([
        '#3B82F6',
        '#F59E0B',
        '#10B981',
      ]);
      expect(chartData.datasets[0].hoverBackgroundColor).toEqual([
        '#2563EB',
        '#D97706',
        '#059669',
      ]);
    });

    it('should have responsive configuration', () => {
      expect(component.pieChartOptions?.responsive).toBe(true);
      expect(component.pieChartOptions?.maintainAspectRatio).toBe(true);
    });

    it('should display legend at bottom', () => {
      expect(component.pieChartOptions?.plugins?.legend?.display).toBe(true);
      expect(component.pieChartOptions?.plugins?.legend?.position).toBe('bottom');
    });
  });

  describe('Bar Chart - Task Priority Distribution', () => {
    it('should generate correct bar chart data from tasks', () => {
      const tasks: Task[] = [
        createMockTask({ priority: 'high' }),
        createMockTask({ priority: 'high' }),
        createMockTask({ priority: 'medium' }),
        createMockTask({ priority: 'medium' }),
        createMockTask({ priority: 'medium' }),
        createMockTask({ priority: 'low' }),
      ];

      mockTaskService.tasks.set(tasks);
      fixture.detectChanges();

      const chartData = component.barChartData();

      expect(chartData.labels).toEqual(['High Priority', 'Medium Priority', 'Low Priority']);
      expect(chartData.datasets).toHaveLength(1);
      expect(chartData.datasets[0].data).toEqual([2, 3, 1]);
      expect(chartData.datasets[0].label).toBe('Tasks');
    });

    it('should handle empty task list', () => {
      mockTaskService.tasks.set([]);
      fixture.detectChanges();

      const chartData = component.barChartData();

      expect(chartData.datasets[0].data).toEqual([0, 0, 0]);
    });

    it('should have correct colors for bar chart', () => {
      fixture.detectChanges();
      const chartData = component.barChartData();

      expect(chartData.datasets[0].backgroundColor).toEqual([
        '#EF4444',
        '#EC4899',
        '#3B82F6',
      ]);
      expect(chartData.datasets[0].hoverBackgroundColor).toEqual([
        '#DC2626',
        '#DB2777',
        '#2563EB',
      ]);
    });

    it('should have y-axis starting at zero', () => {
      expect((component.barChartOptions?.scales?.['y'] as any)?.beginAtZero).toBe(true);
    });

    it('should have integer step size on y-axis', () => {
      expect((component.barChartOptions?.scales?.['y'] as any)?.ticks?.stepSize).toBe(1);
    });

    it('should hide legend for bar chart', () => {
      expect(component.barChartOptions?.plugins?.legend?.display).toBe(false);
    });
  });

  describe('Line Chart - Task Completion Trends', () => {
    it('should generate chart data for last 7 days', () => {
      const today = new Date();
      const tasks: Task[] = [
        createMockTask({ createdAt: today, status: 'done' }),
        createMockTask({ createdAt: today, status: 'todo' }),
      ];

      mockTaskService.tasks.set(tasks);
      fixture.detectChanges();

      const chartData = component.lineChartData();

      expect(chartData.labels).toHaveLength(7);
      expect(chartData.datasets).toHaveLength(2);
      expect(chartData.datasets[0].label).toBe('Tasks Created');
      expect(chartData.datasets[1].label).toBe('Tasks Completed');
    });

    it('should count tasks created on specific days', () => {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      const tasks: Task[] = [
        createMockTask({ createdAt: today }),
        createMockTask({ createdAt: today }),
        createMockTask({ createdAt: yesterday }),
      ];

      mockTaskService.tasks.set(tasks);
      fixture.detectChanges();

      const chartData = component.lineChartData();

      // Last day (index 6) should have 2 tasks created
      expect(chartData.datasets[0].data[6]).toBe(2);
      // Second to last day (index 5) should have 1 task created
      expect(chartData.datasets[0].data[5]).toBe(1);
    });

    it('should count completed tasks', () => {
      const tasks: Task[] = [
        createMockTask({ status: 'done' }),
        createMockTask({ status: 'done' }),
        createMockTask({ status: 'todo' }),
        createMockTask({ status: 'in-progress' }),
      ];

      mockTaskService.tasks.set(tasks);
      fixture.detectChanges();

      const chartData = component.lineChartData();

      // All completed tasks are counted in the last day (today) as per the implementation
      expect(chartData.datasets[1].data[6]).toBe(2);
    });

    it('should have correct styling for line chart', () => {
      fixture.detectChanges();
      const chartData = component.lineChartData();

      expect(chartData.datasets[0].borderColor).toBe('#3B82F6');
      expect(chartData.datasets[0].backgroundColor).toBe('rgba(59, 130, 246, 0.1)');
      expect(chartData.datasets[0].fill).toBe(true);
      expect(chartData.datasets[0].tension).toBe(0.4);

      expect(chartData.datasets[1].borderColor).toBe('#10B981');
      expect(chartData.datasets[1].backgroundColor).toBe('rgba(16, 185, 129, 0.1)');
      expect(chartData.datasets[1].fill).toBe(true);
      expect(chartData.datasets[1].tension).toBe(0.4);
    });

    it('should display legend at bottom', () => {
      expect(component.lineChartOptions?.plugins?.legend?.display).toBe(true);
      expect(component.lineChartOptions?.plugins?.legend?.position).toBe('bottom');
    });

    it('should have y-axis starting at zero', () => {
      expect((component.lineChartOptions?.scales?.['y'] as any)?.beginAtZero).toBe(true);
    });
  });

  describe('Date Utility Methods', () => {
    it('should identify same day correctly', () => {
      const date1 = new Date('2025-11-24T10:00:00');
      const date2 = new Date('2025-11-24T15:00:00');
      const date3 = new Date('2025-11-25T10:00:00');

      // Using private method - access through any for testing
      const isSameDay = (component as any).isSameDay.bind(component);

      expect(isSameDay(date1, date2)).toBe(true);
      expect(isSameDay(date1, date3)).toBe(false);
    });

    it('should format date correctly', () => {
      const date = new Date('2025-11-24');

      // Using private method - access through any for testing
      const formatDate = (component as any).formatDate.bind(component);

      const formatted = formatDate(date);
      expect(formatted).toMatch(/\d{1,2}\/\d{1,2}/); // Format: M/D
    });

    it('should generate last 7 days array', () => {
      const getLast7Days = (component as any).getLast7Days.bind(component);

      const days = getLast7Days();

      expect(days).toHaveLength(7);
      expect(days[0]).toBeInstanceOf(Date);
      expect(days[6]).toBeInstanceOf(Date);

      // The last day should be today
      const today = new Date();
      const lastDay = days[6];
      expect(lastDay.getDate()).toBe(today.getDate());
      expect(lastDay.getMonth()).toBe(today.getMonth());
      expect(lastDay.getFullYear()).toBe(today.getFullYear());
    });
  });

  describe('Component Lifecycle', () => {
    it('should call ngOnInit', () => {
      const spy = vi.spyOn(component, 'ngOnInit');
      component.ngOnInit();
      expect(spy).toHaveBeenCalled();
    });

    it('should have all chart configurations initialized', () => {
      expect(component.pieChartOptions).toBeDefined();
      expect(component.barChartOptions).toBeDefined();
      expect(component.lineChartOptions).toBeDefined();
    });
  });

  describe('Integration with TaskService', () => {
    it('should reactively update when task stats change', () => {
      mockTaskService.taskStats.set({
        total: 5,
        todo: 2,
        inProgress: 2,
        done: 1,
        overdue: 0,
      });

      // No need for fixture.detectChanges() - signals update automatically
      expect(component.stats().total).toBe(5);
      expect(component.completionRate()).toBe(20);

      // Update stats
      mockTaskService.taskStats.set({
        total: 5,
        todo: 0,
        inProgress: 0,
        done: 5,
        overdue: 0,
      });

      // Signals update reactively without needing detectChanges
      expect(component.stats().total).toBe(5);
      expect(component.completionRate()).toBe(100);
    });

    it('should reactively update charts when tasks change', () => {
      const initialTasks: Task[] = [
        createMockTask({ priority: 'high' }),
      ];

      mockTaskService.tasks.set(initialTasks);
      fixture.detectChanges();

      let barData = component.barChartData();
      expect(barData.datasets[0].data).toEqual([1, 0, 0]);

      // Add more tasks
      const moreTasks: Task[] = [
        ...initialTasks,
        createMockTask({ priority: 'medium' }),
        createMockTask({ priority: 'low' }),
      ];

      mockTaskService.tasks.set(moreTasks);
      fixture.detectChanges();

      barData = component.barChartData();
      expect(barData.datasets[0].data).toEqual([1, 1, 1]);
    });
  });
});
