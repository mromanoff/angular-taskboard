import { Component, computed, inject, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import { TaskService } from '../../services/task.service';
import { Task } from '../../models/task.model';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, MatCardModule, MatIconModule, BaseChartDirective],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit {
  private taskService = inject(TaskService);

  // Statistics
  readonly stats = this.taskService.taskStats;
  readonly completionRate = computed(() => {
    const total = this.stats().total;
    if (total === 0) return 0;
    return Math.round((this.stats().done / total) * 100);
  });

  // Pie Chart - Task Status Distribution
  public readonly pieChartType = 'pie' as const;
  public pieChartData = computed<ChartData<'pie'>>(() => {
    const stats = this.stats();
    return {
      labels: ['To Do', 'In Progress', 'Done'],
      datasets: [
        {
          data: [stats.todo, stats.inProgress, stats.done],
          backgroundColor: ['#3B82F6', '#F59E0B', '#10B981'],
          hoverBackgroundColor: ['#2563EB', '#D97706', '#059669'],
        },
      ],
    };
  });

  public pieChartOptions: ChartConfiguration<'pie'>['options'] = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        display: true,
        position: 'bottom',
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.label || '';
            const value = context.parsed || 0;
            const total = (context.dataset.data as number[]).reduce((a, b) => a + b, 0);
            const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
            return `${label}: ${value} (${percentage}%)`;
          },
        },
      },
    },
  };

  // Bar Chart - Task Priority Distribution
  public readonly barChartType = 'bar' as const;
  public barChartData = computed<ChartData<'bar'>>(() => {
    const tasks = this.taskService.tasks();
    const highCount = tasks.filter((t) => t.priority === 'high').length;
    const mediumCount = tasks.filter((t) => t.priority === 'medium').length;
    const lowCount = tasks.filter((t) => t.priority === 'low').length;

    return {
      labels: ['High Priority', 'Medium Priority', 'Low Priority'],
      datasets: [
        {
          label: 'Tasks',
          data: [highCount, mediumCount, lowCount],
          backgroundColor: ['#EF4444', '#EC4899', '#3B82F6'],
          hoverBackgroundColor: ['#DC2626', '#DB2777', '#2563EB'],
        },
      ],
    };
  });

  public barChartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
        },
      },
    },
  };

  // Line Chart - Task Completion Trends (Last 7 Days)
  public readonly lineChartType = 'line' as const;
  public lineChartData = computed<ChartData<'line'>>(() => {
    const tasks = this.taskService.tasks();
    const last7Days = this.getLast7Days();
    const createdCounts = new Array(7).fill(0);
    const completedCounts = new Array(7).fill(0);

    tasks.forEach((task) => {
      // Count tasks created in the last 7 days
      const createdDate = new Date(task.createdAt);
      const createdDayIndex = last7Days.findIndex(
        (date) => this.isSameDay(date, createdDate)
      );
      if (createdDayIndex !== -1) {
        createdCounts[createdDayIndex]++;
      }

      // For completed tasks, we'll estimate based on status
      // In a real app, you'd have a 'completedAt' field
      if (task.status === 'done') {
        // Assume recently completed tasks were done today (for demo purposes)
        completedCounts[6]++; // Last day (today)
      }
    });

    return {
      labels: last7Days.map((date) => this.formatDate(date)),
      datasets: [
        {
          label: 'Tasks Created',
          data: createdCounts,
          borderColor: '#3B82F6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          fill: true,
          tension: 0.4,
        },
        {
          label: 'Tasks Completed',
          data: completedCounts,
          borderColor: '#10B981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          fill: true,
          tension: 0.4,
        },
      ],
    };
  });

  public lineChartOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        display: true,
        position: 'bottom',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
        },
      },
    },
  };

  ngOnInit() {
    // Chart.js will initialize when the component loads
  }

  private getLast7Days(): Date[] {
    const dates: Date[] = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      dates.push(date);
    }
    return dates;
  }

  private isSameDay(date1: Date, date2: Date): boolean {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  }

  private formatDate(date: Date): string {
    return `${date.getMonth() + 1}/${date.getDate()}`;
  }
}
