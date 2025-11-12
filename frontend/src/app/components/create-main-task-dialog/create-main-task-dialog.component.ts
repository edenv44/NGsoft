import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { switchMap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { TaskService } from '../../services/task.service';

export interface CreateMainTaskDialogData {
  userId: number;
}

@Component({
  selector: 'app-create-main-task-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatButtonModule,
    MatInputModule,
    MatIconModule
  ],
  template: `
    <div class="dialog-container">
      <div class="dialog-header">
        <h2 mat-dialog-title>Create New Main Task</h2>
      </div>
      
      <mat-dialog-content class="dialog-content">
        <form #createMainTaskForm="ngForm">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Main Task Name</mat-label>
            <input matInput [(ngModel)]="mainTaskName" name="mainTaskName" required placeholder="Enter main task name" (keyup.enter)="onCreate($event)">
          </mat-form-field>
          
          <mat-dialog-actions class="dialog-actions">
            <button mat-button type="button" (click)="onCancel()">Cancel</button>
            <button 
              mat-raised-button 
              color="primary" 
              type="button" 
              (click)="onCreate($event)" 
              [disabled]="creating || !mainTaskName?.trim()" 
              style="cursor: pointer;">
              <mat-icon *ngIf="!creating">add_circle</mat-icon>
              <span *ngIf="creating">Creating...</span>
              <span *ngIf="!creating">Create Main Task</span>
            </button>
          </mat-dialog-actions>
        </form>
      </mat-dialog-content>
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
      min-height: 150px;
    }

    .full-width {
      width: 100%;
      margin-bottom: 8px;
    }

    .dialog-actions {
      padding: 8px 24px 16px 24px;
      background: #f8f9fa;
      border-top: 1px solid #dee2e6;
      margin: 8px -24px -24px -24px;
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      position: relative;
      z-index: 10;
    }

    .dialog-actions button {
      position: relative;
      z-index: 11;
      pointer-events: auto;
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
export class CreateMainTaskDialogComponent {
  mainTaskName: string = '';
  creating: boolean = false;

  constructor(
    public dialogRef: MatDialogRef<CreateMainTaskDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: CreateMainTaskDialogData,
    private taskService: TaskService
  ) {}

  onCreate(event?: Event) {
    console.log('=== onCreate called ===', { 
      event, 
      mainTaskName: this.mainTaskName, 
      creating: this.creating,
      userId: this.data?.userId,
      trimmed: this.mainTaskName?.trim()
    });
    
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    // Add a small delay to ensure the click is registered
    console.log('Button clicked, processing...');

    const trimmedName = this.mainTaskName?.trim();
    if (!trimmedName) {
      console.warn('Main task name is empty');
      alert('Please enter a main task name');
      return;
    }

    if (this.creating) {
      console.warn('Already creating main task');
      return;
    }

    if (!this.data?.userId) {
      console.error('User ID is missing');
      alert('User ID is missing. Please refresh the page and try again.');
      return;
    }

    this.creating = true;

    // Prepare request payload: main task name and user ID
    // Backend expects mTask_name (not main_task_name)
    const mainTaskData = {
      mTask_name: trimmedName,
      assigned_by: this.data.userId,
      is_active: 1
    };

    console.log('Sending request to create main task:', {
      url: 'http://localhost:8000/main_task',
      payload: mainTaskData
    });
    
    // Step 1: Send request to server with main task name and user ID
    // Step 2: After server creates the main task, assign the creator to it so they can create tasks within it
    this.taskService.createMainTask(mainTaskData).pipe(
      switchMap((createdMainTask) => {
        console.log('Main task created successfully by server:', createdMainTask);
        if (!createdMainTask || !createdMainTask.main_task_id) {
          throw new Error('Main task creation response is invalid - missing main_task_id');
        }
        
        // Step 2: Automatically assign the creator to the main task
        // This ensures they can see it and create tasks within it
        console.log('Assigning creator to main task...', {
          userId: this.data.userId,
          mainTaskId: createdMainTask.main_task_id
        });
        
        return this.taskService.ensureUserInMainTask(
          this.data.userId,
          createdMainTask.main_task_id
        ).pipe(
          switchMap(() => {
            console.log('Creator successfully assigned to main task');
            return of(createdMainTask);
          }),
          catchError((assignmentError) => {
            // If assignment fails, still return the created main task
            // The main task was created successfully, assignment is secondary
            console.warn('Main task created but assignment failed (may already be assigned):', assignmentError);
            return of(createdMainTask);
          })
        );
      })
    ).subscribe({
      next: (createdMainTask) => {
        console.log('Main task created and creator assigned:', createdMainTask);
        this.creating = false;
        this.dialogRef.close(createdMainTask);
      },
      error: (error) => {
        console.error('Error creating main task:', error);
        console.error('Error details:', {
          status: error.status,
          statusText: error.statusText,
          message: error.message,
          error: error.error,
          url: error.url
        });
        this.creating = false;
        // Extract error message from FastAPI error response
        let errorMessage = 'Please try again.';
        if (error.error?.detail) {
          if (Array.isArray(error.error.detail)) {
            errorMessage = error.error.detail.map((d: any) => d.msg || d).join(', ');
          } else {
            errorMessage = error.error.detail;
          }
        } else if (error.error?.message) {
          errorMessage = error.error.message;
        } else if (error.message) {
          errorMessage = error.message;
        }
        alert(`Failed to create main task: ${errorMessage}`);
      }
    });
  }

  onCancel() {
    this.dialogRef.close();
  }
}

