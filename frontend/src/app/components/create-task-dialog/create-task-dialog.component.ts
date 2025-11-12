import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { of } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { TaskService, MainTask, User } from '../../services/task.service';

export interface CreateTaskDialogData {
  userId: number;
  mainTasks: MainTask[];
  preselectedMainTaskId?: number;
}

@Component({
  selector: 'app-create-task-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    MatInputModule
  ],
  template: `
    <div class="dialog-container">
      <div class="dialog-header">
        <h2 mat-dialog-title>Create New Task</h2>
      </div>
      
      <mat-dialog-content class="dialog-content">
        <form (ngSubmit)="onCreate()" #createTaskForm="ngForm">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Task Name</mat-label>
            <input matInput [(ngModel)]="taskName" name="taskName" required placeholder="Enter task name">
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Main Task</mat-label>
            <mat-select [(ngModel)]="selectedMainTaskId" name="mainTask" required>
              <mat-option *ngFor="let mainTask of data.mainTasks" [value]="mainTask.main_task_id">
                {{ mainTask.main_task_name }}
              </mat-option>
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Assign To</mat-label>
            <mat-select [(ngModel)]="selectedUserId" name="assignTo">
              <mat-option [value]="null">Unassigned</mat-option>
              <mat-option *ngFor="let user of users" [value]="user.user_id">
                {{ user.username }} {{ user.surname || '' }}
              </mat-option>
            </mat-select>
          </mat-form-field>
        </form>
      </mat-dialog-content>
      
      <mat-dialog-actions class="dialog-actions">
        <button mat-button (click)="onCancel()">Cancel</button>
        <button mat-raised-button color="primary" (click)="onCreate()" [disabled]="!taskName || !selectedMainTaskId">
          Create Task
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .dialog-container {
      min-width: 500px;
    }

    .dialog-header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 20px 24px;
      margin: -24px -24px 0 -24px;
    }

    .dialog-header h2 {
      margin: 0;
      font-size: 1.5rem;
      font-weight: 600;
    }

    .dialog-content {
      padding: 24px !important;
      min-height: 200px;
    }

    .full-width {
      width: 100%;
      margin-bottom: 16px;
    }

    .dialog-actions {
      padding: 16px 24px;
      background: #f8f9fa;
      border-top: 1px solid #dee2e6;
      margin: 0 -24px -24px -24px;
      display: flex;
      justify-content: flex-end;
      gap: 8px;
    }

    ::ng-deep .mat-mdc-dialog-container {
      padding: 0 !important;
    }

    ::ng-deep .mat-mdc-dialog-content {
      margin: 0;
      padding: 0;
    }
  `]
})
export class CreateTaskDialogComponent implements OnInit {
  taskName: string = '';
  selectedMainTaskId: number | null = null;
  selectedUserId: number | null = null;
  users: User[] = [];

  constructor(
    public dialogRef: MatDialogRef<CreateTaskDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: CreateTaskDialogData,
    private taskService: TaskService
  ) {}

  ngOnInit() {
    // Pre-select main task if provided
    if (this.data.preselectedMainTaskId) {
      this.selectedMainTaskId = this.data.preselectedMainTaskId;
    }

    // Load all users for assignment (including the current user)
    // Users can assign tasks to any user, including themselves
    // If a user is not in the main task, they will be automatically added when assigned
    this.taskService.getAllUsers().subscribe({
      next: (users) => {
        this.users = users;
        console.log('All users loaded for task assignment:', users);
      },
      error: (error) => {
        console.error('Error loading users:', error);
      }
    });
  }

  onCreate() {
    if (!this.taskName.trim() || !this.selectedMainTaskId) {
      return;
    }

    const taskData = {
      task_name: this.taskName.trim(),
      assigned_by: this.data.userId,
      assigned_to: this.selectedUserId,
      task_group_id: this.selectedMainTaskId,
      status: 'PENDING' as const
    };

    // If a user is assigned to the task (including self-assignment), ensure they're in the main task FIRST
    // Then assign them to the task. This ensures the user can see the main task
    // and the task within it after assignment.
    // This works for ANY user, even if they're not currently assigned to the main task
    if (this.selectedUserId && this.selectedMainTaskId) {
      // Step 1: First ensure user is in the main task (add them if not already)
      // This automatically adds the user to the main task, even if they weren't in it before
      // Step 2: Then create the task with the assigned user
      // The switchMap ensures Step 2 only happens after Step 1 completes
      console.log('Assigning task to user:', {
        userId: this.selectedUserId,
        mainTaskId: this.selectedMainTaskId,
        isSelfAssignment: this.selectedUserId === this.data.userId
      });
      this.taskService.ensureUserInMainTask(this.selectedUserId, this.selectedMainTaskId).pipe(
        switchMap(() => this.taskService.createTask(taskData))
      ).subscribe({
        next: (createdTask) => {
          console.log('Task created and user assigned to main task:', createdTask);
          this.dialogRef.close(createdTask);
        },
        error: (error) => {
          console.error('Error creating task:', error);
          alert('Failed to create task. Please try again.');
        }
      });
    } else {
      // No user assigned, just create the task
      this.taskService.createTask(taskData).subscribe({
        next: (createdTask) => {
          console.log('Task created:', createdTask);
          this.dialogRef.close(createdTask);
        },
        error: (error) => {
          console.error('Error creating task:', error);
          alert('Failed to create task. Please try again.');
        }
      });
    }
  }

  onCancel() {
    this.dialogRef.close();
  }
}

