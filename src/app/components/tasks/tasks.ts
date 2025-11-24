import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { FormsModule } from '@angular/forms';
import { DragDropModule, CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { TaskService, SortOption } from '../../services/task.service';
import { Task, TaskStatus, TaskPriority } from '../../models/task.model';
import { TaskFormDialog, TaskFormDialogData, TaskFormResult } from '../task-form-dialog/task-form-dialog';

@Component({
  selector: 'app-tasks',
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatTooltipModule,
    MatDialogModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
    FormsModule,
    DragDropModule,
  ],
  templateUrl: './tasks.html',
  styleUrl: './tasks.scss',
})
export class Tasks {
  private taskService = inject(TaskService);
  private dialog = inject(MatDialog);

  // Expose computed signals for template
  tasksByStatus = this.taskService.tasksByStatus;
  taskStats = this.taskService.taskStats;

  // Expose filter and sort signals
  filterPriority = this.taskService.filterPriority;
  filterStatus = this.taskService.filterStatus;
  filterOverdue = this.taskService.filterOverdue;
  sortOption = this.taskService.sortOption;
  searchQuery = this.taskService.searchQuery;

  deleteTask(id: string): void {
    if (confirm('Are you sure you want to delete this task?')) {
      this.taskService.deleteTask(id);
    }
  }

  updateTaskStatus(id: string, status: TaskStatus): void {
    this.taskService.updateTaskStatus(id, status);
  }

  getPriorityColor(priority: string): string {
    switch (priority) {
      case 'high': return 'warn';
      case 'medium': return 'accent';
      case 'low': return 'primary';
      default: return '';
    }
  }

  isOverdue(task: Task): boolean {
    if (!task.dueDate || task.status === 'done') return false;
    return new Date(task.dueDate) < new Date();
  }

  formatDate(date: Date | null): string {
    if (!date) return 'No due date';
    return new Date(date).toLocaleDateString();
  }

  drop(event: CdkDragDrop<Task[]>, status: TaskStatus): void {
    if (event.previousContainer === event.container) {
      // Reordering within the same column - not implementing ordering for now
      // Just keep items in their current position
      return;
    } else {
      // Moving between columns - update the task status
      const task = event.previousContainer.data[event.previousIndex];
      this.taskService.updateTaskStatus(task.id, status);
    }
  }

  openAddTaskDialog(): void {
    const dialogRef = this.dialog.open(TaskFormDialog, {
      width: '700px',
      maxWidth: '90vw',
      data: { mode: 'create' } as TaskFormDialogData,
    });

    dialogRef.afterClosed().subscribe((result: TaskFormResult | undefined) => {
      if (result) {
        this.taskService.addTask(result);
      }
    });
  }

  openEditTaskDialog(task: Task): void {
    const dialogRef = this.dialog.open(TaskFormDialog, {
      width: '700px',
      maxWidth: '90vw',
      data: { task, mode: 'edit' } as TaskFormDialogData,
    });

    dialogRef.afterClosed().subscribe((result: TaskFormResult | undefined) => {
      if (result) {
        this.taskService.updateTask(task.id, result);
      }
    });
  }

  onFilterPriorityChange(priority: TaskPriority | 'all'): void {
    this.taskService.setFilterPriority(priority);
  }

  onFilterStatusChange(status: TaskStatus | 'all'): void {
    this.taskService.setFilterStatus(status);
  }

  onFilterOverdueChange(checked: boolean): void {
    this.taskService.setFilterOverdue(checked);
  }

  onSortOptionChange(option: SortOption): void {
    this.taskService.setSortOption(option);
  }

  clearFilters(): void {
    this.taskService.clearFilters();
  }

  onSearchQueryChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.taskService.setSearchQuery(input.value);
  }

  clearSearch(): void {
    this.taskService.setSearchQuery('');
  }
}
