import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { TaskService, Task, MainTask } from '../../services/task.service';
import { TaskDetailsDialogComponent } from '../task-details-dialog/task-details-dialog.component';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-main-task-tasks-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule
  ],
  template: `
    <div class="dialog-container">
      <div class="dialog-header">
        <h2 mat-dialog-title>Tasks in {{ data.mainTask.main_task_name }}</h2>
      </div>
      
      <mat-dialog-content class="dialog-content">
        <div class="tasks-container">
          <!-- Search Input -->
          <mat-form-field appearance="outline" class="search-field">
            <mat-label>Search Tasks</mat-label>
            <input matInput [(ngModel)]="searchText" (input)="applyFilter()" placeholder="Type to search tasks...">
          </mat-form-field>

          <!-- Loading Indicator -->
          <div *ngIf="loading" class="loading">
            Loading tasks...
          </div>

          <!-- Tasks List -->
          <div class="tasks-list" *ngIf="!loading">
            <div *ngIf="filteredTasks.length === 0" class="no-tasks">
              <p>No tasks found in this main task.</p>
            </div>

            <mat-card 
              *ngFor="let task of filteredTasks" 
              class="task-card"
              (click)="openTaskDetails(task)"
            >
              <mat-card-content>
                <div class="task-header">
                  <h3 class="task-name">{{ task.task_name }}</h3>
                  <span class="status-badge" [class]="'status-' + task.status.toLowerCase()">
                    <mat-icon class="status-icon-small" [class]="'status-icon-' + task.status.toLowerCase()">
                      {{ getStatusIcon(task.status) }}
                    </mat-icon>
                    {{ task.status }}
                  </span>
                </div>
                <div class="task-info">
                  <span class="task-id">Task ID: {{ task.task_id }}</span>
                </div>
              </mat-card-content>
            </mat-card>
          </div>
        </div>
      </mat-dialog-content>
      
      <mat-dialog-actions class="dialog-actions">
        <button mat-button [mat-dialog-close]="false">Close</button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .dialog-container {
      min-width: 600px;
      max-width: 800px;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
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
      max-height: 70vh;
      overflow-y: auto;
    }

    .tasks-container {
      padding: 10px 0;
    }

    .search-field {
      width: 100%;
      margin-bottom: 20px;
    }

    .tasks-list {
      display: grid;
      gap: 12px;
    }

    .task-card {
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
      border-left: 4px solid #667eea;
    }

    .task-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
    }

    .task-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
    }

    .task-name {
      margin: 0;
      font-size: 1.1rem;
      color: #333;
      flex: 1;
    }

    .task-info {
      display: flex;
      gap: 20px;
      font-size: 0.9rem;
      color: #666;
      margin-top: 10px;
    }

    .task-id {
      padding: 4px 8px;
      background: #f5f5f5;
      border-radius: 4px;
    }

    .status-badge {
      padding: 6px 12px;
      border-radius: 16px;
      font-size: 0.85rem;
      font-weight: 500;
      text-transform: uppercase;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .status-icon-small {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    .status-icon-pending {
      color: #ff9800;
    }

    .status-icon-done {
      color: #4caf50;
    }

    .status-icon-rejected {
      color: #f44336;
    }

    .status-pending {
      background-color: #fff3cd !important;
      color: #856404 !important;
    }

    .status-done {
      background-color: #d4edda !important;
      color: #155724 !important;
    }

    .status-rejected {
      background-color: #f8d7da !important;
      color: #721c24 !important;
    }

    .loading,
    .no-tasks {
      text-align: center;
      padding: 40px;
      color: #666;
      font-size: 1.1rem;
    }

    .dialog-actions {
      padding: 16px 24px;
      background: #f8f9fa;
      border-top: 1px solid #dee2e6;
      margin: 0 -24px -24px -24px;
      display: flex;
      justify-content: flex-end;
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
export class MainTaskTasksDialogComponent implements OnInit {
  tasks: Task[] = [];
  filteredTasks: Task[] = [];
  searchText: string = '';
  loading: boolean = false;
  userId: number;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { mainTask: MainTask; userId: number },
    private dialogRef: MatDialogRef<MainTaskTasksDialogComponent>,
    private taskService: TaskService,
    private dialog: MatDialog
  ) {
    this.userId = data.userId;
  }

  ngOnInit() {
    this.loadTasks();
  }

  loadTasks() {
    this.loading = true;

    // Get all tasks and filter by task_group_id and assigned_to
    this.taskService.getAllTasks().subscribe({
      next: (allTasks) => {
        // Filter tasks: must be in this main task group AND assigned to this user
        this.tasks = allTasks.filter(task => 
          task.task_group_id === this.data.mainTask.main_task_id &&
          task.assigned_to === this.userId
        );
        
        this.applyFilter();
        this.loading = false;
        console.log('Tasks loaded for main task:', this.tasks);
      },
      error: (error) => {
        console.error('Error loading tasks:', error);
        this.loading = false;
      }
    });
  }

  applyFilter() {
    if (!this.searchText) {
      this.filteredTasks = [...this.tasks];
      return;
    }

    const searchLower = this.searchText.toLowerCase();
    this.filteredTasks = this.tasks.filter(task =>
      task.task_name.toLowerCase().includes(searchLower)
    );
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'PENDING':
        return 'schedule';
      case 'DONE':
        return 'check_circle';
      case 'REJECTED':
        return 'cancel';
      default:
        return 'help_outline';
    }
  }

  openTaskDetails(task: Task) {
    // Fetch full task details from API
    this.taskService.getTaskById(task.task_id).subscribe({
      next: (taskDetails) => {
        const taskDialogRef = this.dialog.open(TaskDetailsDialogComponent, {
          width: '600px',
          data: taskDetails
        });

        // Refresh task list if task was updated
        taskDialogRef.afterClosed().subscribe((updated) => {
          if (updated) {
            this.loadTasks(); // Reload tasks to reflect changes
          }
        });
      },
      error: (error) => {
        console.error('Error loading task details:', error);
        // If API fails, show what we have
        const taskDialogRef = this.dialog.open(TaskDetailsDialogComponent, {
          width: '600px',
          data: task
        });

        taskDialogRef.afterClosed().subscribe((updated) => {
          if (updated) {
            this.loadTasks();
          }
        });
      }
    });
  }
}

