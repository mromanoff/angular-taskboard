import { Component, inject, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { Task, TaskPriority, TaskStatus } from '../../models/task.model';

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

  constructor(@Inject(MAT_DIALOG_DATA) public data: TaskFormDialogData) {
    this.isEditMode = data.mode === 'edit';

    this.taskForm = this.fb.group({
      title: [data.task?.title || '', [Validators.required, Validators.minLength(3)]],
      description: [data.task?.description || '', [Validators.required, Validators.minLength(10)]],
      priority: [data.task?.priority || 'medium', Validators.required],
      status: [data.task?.status || 'todo', Validators.required],
      dueDate: [data.task?.dueDate || null],
    });
  }

  get title() {
    return this.taskForm.get('title');
  }

  get description() {
    return this.taskForm.get('description');
  }

  onSubmit(): void {
    if (this.taskForm.valid) {
      const formValue = this.taskForm.value;
      this.dialogRef.close(formValue);
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
