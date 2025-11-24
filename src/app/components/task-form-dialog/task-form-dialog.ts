import { Component, inject, Inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormControl } from '@angular/forms';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatExpansionModule } from '@angular/material/expansion';
import { Task, TaskPriority, TaskStatus, Subtask, Comment } from '../../models/task.model';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { MatChipInputEvent } from '@angular/material/chips';

export interface TaskFormDialogData {
  task?: Task;
  mode: 'create' | 'edit';
}

export interface TaskFormResult {
  title: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: Date | null;
  tags: string[];
  subtasks: Subtask[];
  comments: Comment[];
}

@Component({
  selector: 'app-task-form-dialog',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatChipsModule,
    MatIconModule,
    MatCheckboxModule,
    MatExpansionModule,
  ],
  templateUrl: './task-form-dialog.html',
  styleUrl: './task-form-dialog.scss',
})
export class TaskFormDialog {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<TaskFormDialog>);

  taskForm: FormGroup;
  isEditMode: boolean;

  priorities: TaskPriority[] = ['low', 'medium', 'high'];
  statuses: TaskStatus[] = ['todo', 'in-progress', 'done'];

  // Tags
  tags = signal<string[]>([]);
  readonly separatorKeysCodes = [ENTER, COMMA] as const;

  // Subtasks
  subtasks = signal<Subtask[]>([]);
  newSubtaskControl = new FormControl('');

  // Comments
  comments = signal<Comment[]>([]);
  newCommentControl = new FormControl('');

  constructor(@Inject(MAT_DIALOG_DATA) public data: TaskFormDialogData) {
    this.isEditMode = data.mode === 'edit';

    this.taskForm = this.fb.group({
      title: [data.task?.title || '', [Validators.required, Validators.minLength(3)]],
      description: [data.task?.description || '', [Validators.required, Validators.minLength(10)]],
      priority: [data.task?.priority || 'medium', Validators.required],
      status: [data.task?.status || 'todo', Validators.required],
      dueDate: [data.task?.dueDate || null],
    });

    // Initialize tags, subtasks, and comments from task data
    if (data.task) {
      this.tags.set(data.task.tags ?? []);
      this.subtasks.set(data.task.subtasks ?? []);
      this.comments.set(data.task.comments ?? []);
    }
  }

  get title() {
    return this.taskForm.get('title');
  }

  get description() {
    return this.taskForm.get('description');
  }

  // Tag management
  addTag(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();
    if (value) {
      this.tags.update(tags => [...tags, value]);
    }
    event.chipInput!.clear();
  }

  removeTag(tag: string): void {
    this.tags.update(tags => tags.filter(t => t !== tag));
  }

  // Subtask management
  addSubtask(): void {
    const title = this.newSubtaskControl.value?.trim();
    if (title) {
      const newSubtask: Subtask = {
        id: `subtask-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        title,
        completed: false,
        createdAt: new Date()
      };
      this.subtasks.update(subtasks => [...subtasks, newSubtask]);
      this.newSubtaskControl.reset();
    }
  }

  toggleSubtask(subtask: Subtask): void {
    this.subtasks.update(subtasks =>
      subtasks.map(s => s.id === subtask.id ? { ...s, completed: !s.completed } : s)
    );
  }

  deleteSubtask(subtaskId: string): void {
    this.subtasks.update(subtasks => subtasks.filter(s => s.id !== subtaskId));
  }

  // Comment management
  addComment(): void {
    const text = this.newCommentControl.value?.trim();
    if (text) {
      const newComment: Comment = {
        id: `comment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        text,
        author: 'User',
        createdAt: new Date()
      };
      this.comments.update(comments => [...comments, newComment]);
      this.newCommentControl.reset();
    }
  }

  deleteComment(commentId: string): void {
    this.comments.update(comments => comments.filter(c => c.id !== commentId));
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleString();
  }

  getSubtaskProgress(): number {
    const total = this.subtasks().length;
    if (total === 0) return 0;
    const completed = this.subtasks().filter(s => s.completed).length;
    return Math.round((completed / total) * 100);
  }

  onSubmit(): void {
    if (this.taskForm.valid) {
      const formValue = this.taskForm.value;
      const result: TaskFormResult = {
        ...formValue,
        tags: this.tags(),
        subtasks: this.subtasks(),
        comments: this.comments()
      };
      this.dialogRef.close(result);
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  getDialogTitle(): string {
    return this.isEditMode ? 'Edit Task' : 'Add New Task';
  }

  getSubmitButtonText(): string {
    return this.isEditMode ? 'Update' : 'Create';
  }
}
