import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { forkJoin, of } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { TaskService, Task, User, TaskUpdate } from '../../services/task.service';

@Component({
  selector: 'app-task-details-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    MatInputModule,
    MatIconModule
  ],
  template: `
    <div class="dialog-container">
      <div class="dialog-header">
        <h2 mat-dialog-title>Task Details</h2>
      </div>
      
      <mat-dialog-content class="dialog-content">
        <!-- Task Name at Top with Underline -->
        <div class="task-name-header">
          <div *ngIf="!editingTaskName" class="task-name-display">
            <h3 class="task-name-title">{{ data.task_name }}</h3>
            <button mat-icon-button (click)="startEditingTaskName()" class="edit-name-button" title="Edit task name">
              <mat-icon>edit</mat-icon>
            </button>
          </div>
          <div *ngIf="editingTaskName" class="task-name-edit">
            <mat-form-field appearance="outline" class="task-name-input">
              <mat-label>Task Name</mat-label>
              <input matInput [(ngModel)]="editedTaskName" name="editedTaskName" required>
            </mat-form-field>
            <button mat-icon-button (click)="saveTaskName()" [disabled]="savingTaskName" class="save-name-button" title="Save task name">
              <mat-icon>check</mat-icon>
            </button>
            <button mat-icon-button (click)="cancelEditingTaskName()" [disabled]="savingTaskName" class="cancel-name-button" title="Cancel editing">
              <mat-icon>close</mat-icon>
            </button>
          </div>
        </div>

        <div class="task-details">
          <div class="detail-section">
            <div class="detail-row">
              <div class="detail-label">Task ID:</div>
              <div class="detail-value">{{ data.task_id }}</div>
            </div>
            
            <div class="detail-row">
              <div class="detail-label">Status:</div>
              <div class="detail-value">
                <mat-form-field appearance="outline" class="status-select">
                  <mat-select [(ngModel)]="selectedStatus" (selectionChange)="onStatusChange()">
                    <mat-option value="PENDING">
                      <span class="status-option">
                        <mat-icon class="status-icon status-icon-pending">schedule</mat-icon>
                        Pending
                      </span>
                    </mat-option>
                    <mat-option value="DONE">
                      <span class="status-option">
                        <mat-icon class="status-icon status-icon-done">check_circle</mat-icon>
                        Done
                      </span>
                    </mat-option>
                    <mat-option value="REJECTED">
                      <span class="status-option">
                        <mat-icon class="status-icon status-icon-rejected">cancel</mat-icon>
                        Rejected
                      </span>
                    </mat-option>
                  </mat-select>
                </mat-form-field>
                <div class="current-status-indicator">
                  <mat-icon [class]="'status-icon-' + data.status.toLowerCase()" class="status-icon">
                    {{ getStatusIcon(data.status) }}
                  </mat-icon>
                  <span [class]="'status-' + data.status.toLowerCase()">{{ data.status }}</span>
                </div>
              </div>
            </div>
            
            <div class="detail-row" *ngIf="data.assigned_by">
              <div class="detail-label">Assigned By:</div>
              <div class="detail-value">
                {{ getUsername(data.assigned_by) || 'Loading...' }}
              </div>
            </div>
            
            <div class="detail-row" *ngIf="data.assigned_to">
              <div class="detail-label">Assigned To:</div>
              <div class="detail-value">
                {{ getUsername(data.assigned_to) || 'Loading...' }}
              </div>
            </div>
            
            <div class="detail-row" *ngIf="data.task_group_id">
              <div class="detail-label">Task Group ID:</div>
              <div class="detail-value">{{ data.task_group_id }}</div>
            </div>
            
            <div class="detail-row" *ngIf="data.creation_date">
              <div class="detail-label">Creation Date:</div>
              <div class="detail-value">{{ data.creation_date | date:'medium' }}</div>
            </div>
            
            <div class="detail-row" *ngIf="data.modification_date">
              <div class="detail-label">Last Modified:</div>
              <div class="detail-value">{{ data.modification_date | date:'medium' }}</div>
            </div>
          </div>

          <!-- Share Task Section -->
          <div class="share-section" *ngIf="data.task_group_id">
            <h3 class="section-title">Share Task</h3>
            <mat-form-field appearance="outline" class="share-select">
              <mat-label>Select User to Share With</mat-label>
              <mat-select [(ngModel)]="selectedUserId" placeholder="Choose a user">
                <mat-option *ngFor="let user of availableUsers" [value]="user.user_id">
                  {{ user.username }}{{ user.surname ? ' ' + user.surname : '' }} (ID: {{ user.user_id }})
                </mat-option>
              </mat-select>
            </mat-form-field>
            <button mat-raised-button color="accent" (click)="shareTask()" [disabled]="!selectedUserId || sharing">
              {{ sharing ? 'Sharing...' : 'Share Task' }}
            </button>
            <div *ngIf="shareMessage" class="share-message" [class.success]="shareSuccess" [class.error]="!shareSuccess">
              {{ shareMessage }}
            </div>
          </div>

          <!-- Shared With Section -->
          <div class="shared-with-section" *ngIf="data.task_group_id">
            <h3 class="section-title">Shared With</h3>
            <div class="shared-users-container">
              <div class="shared-users-list" *ngIf="sharedUsers.length > 0">
                <span *ngFor="let user of sharedUsers" class="shared-user-badge">
                  {{ user.username }}{{ user.surname ? ' ' + user.surname : '' }}
                </span>
              </div>
              <div class="no-shared-users" *ngIf="sharedUsers.length === 0">
                <span class="no-shared-text">No users have been shared with this task yet.</span>
              </div>
            </div>
          </div>
        </div>
      </mat-dialog-content>
      
      <mat-dialog-actions class="dialog-actions">
        <button mat-button (click)="onClose()">Close</button>
        <button mat-raised-button color="warn" (click)="deleteTask()" [disabled]="deleting" class="delete-button">
          <mat-icon *ngIf="!deleting">delete</mat-icon>
          {{ deleting ? 'Deleting...' : 'Delete Task' }}
        </button>
        <button mat-raised-button color="primary" type="button" (click)="saveChanges($event)" [disabled]="saving">
          {{ saving ? 'Saving...' : 'Save Changes' }}
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .dialog-container {
      min-width: 500px;
      max-width: 600px;
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

    .task-name-header {
      margin-bottom: 24px;
      padding-bottom: 16px;
      border-bottom: 3px solid #667eea;
      text-align: center;
    }

    .task-name-display {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }

    .task-name-title {
      margin: 0;
      font-size: 1.4rem;
      font-weight: 600;
      color: #667eea;
      text-decoration: underline;
      text-decoration-color: #667eea;
      text-underline-offset: 8px;
      text-align: center;
      display: inline-block;
    }

    .edit-name-button {
      color: #667eea;
    }

    .task-name-edit {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      flex-wrap: wrap;
    }

    .task-name-input {
      flex: 1;
      min-width: 200px;
      max-width: 400px;
    }

    .save-name-button {
      color: #4caf50;
    }

    .cancel-name-button {
      color: #f44336;
    }

    .task-details {
      background: #f8f9fa;
      border-radius: 8px;
      padding: 20px;
    }

    .detail-section {
      margin-bottom: 20px;
    }

    .detail-row {
      display: flex;
      align-items: center;
      margin: 16px 0;
      padding: 12px;
      background: white;
      border-radius: 6px;
      border-left: 3px solid #667eea;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    }

    .detail-label {
      font-weight: 600;
      color: #495057;
      min-width: 140px;
      font-size: 0.9rem;
    }

    .detail-value {
      flex: 1;
      color: #212529;
      font-size: 0.95rem;
    }

    .task-name {
      font-weight: 500;
      color: #667eea;
    }

    .status-select {
      width: 100%;
      margin-top: 8px;
    }

    .current-status-indicator {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 12px;
      padding: 8px 12px;
      border-radius: 6px;
      background: #f8f9fa;
    }

    .status-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
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

    .status-option {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .share-section {
      margin-top: 24px;
      padding: 20px;
      background: white;
      border-radius: 8px;
      border: 2px solid #e9ecef;
    }

    .shared-with-section {
      margin-top: 20px;
      padding: 20px;
      background: #f0f7ff;
      border-radius: 8px;
      border: 2px solid #90caf9;
    }

    .shared-users-container {
      margin-top: 12px;
    }

    .shared-users-list {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .shared-user-badge {
      padding: 6px 12px;
      background: #e3f2fd;
      color: #1976d2;
      border-radius: 16px;
      font-size: 0.9rem;
      font-weight: 500;
      display: inline-block;
      border: 1px solid #90caf9;
    }

    .no-shared-users {
      padding: 8px 0;
    }

    .no-shared-text {
      color: #666;
      font-style: italic;
      font-size: 0.9rem;
    }

    .section-title {
      margin: 0 0 16px 0;
      color: #495057;
      font-size: 1.1rem;
      font-weight: 600;
    }

    .share-select {
      width: 100%;
      margin-bottom: 12px;
    }

    .share-message {
      margin-top: 12px;
      padding: 10px;
      border-radius: 6px;
      font-size: 0.9rem;
    }

    .share-message.success {
      background-color: #d4edda;
      color: #155724;
      border: 1px solid #c3e6cb;
    }

    .share-message.error {
      background-color: #f8d7da;
      color: #721c24;
      border: 1px solid #f5c6cb;
    }

    .dialog-actions {
      padding: 16px 24px;
      background: #f8f9fa;
      border-top: 1px solid #dee2e6;
      margin: 0 -24px -24px -24px;
      display: flex;
      justify-content: flex-end;
      gap: 12px;
    }

    .delete-button {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .delete-button mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
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
export class TaskDetailsDialogComponent implements OnInit {
  selectedStatus: 'PENDING' | 'DONE' | 'REJECTED';
  availableUsers: User[] = [];
  selectedUserId: number | null = null;
  sharing: boolean = false;
  saving: boolean = false;
  shareMessage: string = '';
  shareSuccess: boolean = false;
  userMap: Map<number, User> = new Map();
  sharedUsers: User[] = [];
  editingTaskName: boolean = false;
  editedTaskName: string = '';
  savingTaskName: boolean = false;
  deleting: boolean = false;
  usersLoaded: boolean = false;
  currentUserId: number | null = null;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: Task,
    private dialogRef: MatDialogRef<TaskDetailsDialogComponent>,
    private taskService: TaskService
  ) {
    this.selectedStatus = this.data.status;
    this.loadCurrentUserId();
  }

  private loadCurrentUserId() {
    // Get current user ID from cookies (same method as home component)
    const userCookie = this.getCookie('user');
    if (userCookie) {
      try {
        const userData = JSON.parse(userCookie);
        this.currentUserId = userData.user_id || null;
      } catch (e) {
        console.error('Error parsing user cookie:', e);
        this.currentUserId = null;
      }
    }
  }

  private getCookie(name: string): string | null {
    const nameEQ = name + '=';
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
  }

  ngOnInit() {
    // Load all users and create a map for user lookup
    this.taskService.getAllUsers().subscribe({
      next: (users) => {
        // Create a map of user_id to user object
        users.forEach(user => {
          this.userMap.set(user.user_id, user);
        });
        this.usersLoaded = true;

        // Get users who already share this task (if task has a group)
        // Then filter available users
        if (this.data.task_group_id) {
          this.loadSharedUsers(this.data.task_group_id, users);
        } else {
          this.filterAvailableUsers(users);
        }
      },
      error: (error) => {
        console.error('Error loading users:', error);
        this.usersLoaded = true; // Set to true even on error to avoid infinite loading
      }
    });
  }

  loadSharedUsers(taskGroupId: number, allUsers: User[]) {
    console.log('Loading shared users for task group:', taskGroupId);
    
    // Since there's no direct backend endpoint to get users in a task group,
    // we'll check all active users to see which ones have access to this main task
    const activeUsers = allUsers.filter(user => user.is_active === 1);
    
    if (activeUsers.length === 0) {
      this.sharedUsers = [];
      this.filterAvailableUsers(allUsers);
      return;
    }

    // Check each user to see if they have access to this main task
    // by calling getUserMainTasks for each user
    const userChecks = activeUsers.map(user => 
      this.taskService.getUserMainTasks(user.user_id).pipe(
        catchError(() => of({ user: '', main_tasks: [] } as any))
      )
    );

    forkJoin(userChecks).subscribe({
      next: (responses) => {
        console.log('User main tasks responses:', responses);
        
        // Find users who have this task_group_id in their accessible main tasks
        const sharedUserIds = new Set<number>();
        
        responses.forEach((response, index) => {
          const user = activeUsers[index];
          const hasAccess = (response.main_tasks || []).some(
            (mt: any) => (mt.main_task_id || mt.mTask_id) === taskGroupId
          );
          
          if (hasAccess) {
            sharedUserIds.add(user.user_id);
          }
        });

        // Also check if the main task creator has access (they created it)
        // We need to get the main task to check assigned_by
        // For now, we'll include all users who have access via getUserMainTasks
        
        // Get the actual User objects for shared users
        this.sharedUsers = allUsers.filter(user => 
          sharedUserIds.has(user.user_id) && user.user_id !== this.currentUserId
        );
        
        console.log('Shared users found:', this.sharedUsers);
        this.filterAvailableUsers(allUsers);
      },
      error: (error) => {
        console.error('Error loading shared users:', error);
        this.sharedUsers = [];
        this.filterAvailableUsers(allUsers);
      }
    });
  }

  filterAvailableUsers(allUsers: User[]) {
    // Allow sharing with any active user, but exclude the current user (can't share with yourself)
    // Also filter out users who are already shared with this task
    this.availableUsers = allUsers.filter(user => 
      user.is_active === 1 &&
      user.user_id !== this.currentUserId &&
      !this.sharedUsers.some(su => su.user_id === user.user_id)
    );
  }

  getUsername(userId: number | null): string {
    if (!userId) return 'Unknown';
    
    // If users haven't loaded yet, return empty string to show "Loading..."
    if (!this.usersLoaded) {
      return '';
    }
    
    const user = this.userMap.get(userId);
    if (!user) {
      // User not found in map - return empty string to show "Loading..." or try to load again
      return '';
    }
    
    // Return username + surname if surname exists
    if (user.surname) {
      return `${user.username} ${user.surname}`;
    }
    return user.username;
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

  onStatusChange() {
    // Status change is handled when saving
  }

  startEditingTaskName() {
    this.editedTaskName = this.data.task_name;
    this.editingTaskName = true;
  }

  cancelEditingTaskName() {
    this.editingTaskName = false;
    this.editedTaskName = '';
  }

  saveTaskName() {
    if (!this.editedTaskName.trim() || this.editedTaskName.trim() === this.data.task_name) {
      this.cancelEditingTaskName();
      return;
    }

    this.savingTaskName = true;
    const update: TaskUpdate = {
      task_name: this.editedTaskName.trim()
    };

    this.taskService.updateTask(this.data.task_id, update).subscribe({
      next: (response) => {
        this.savingTaskName = false;
        this.data.task_name = this.editedTaskName.trim();
        this.editingTaskName = false;
        this.dialogRef.close(true); // Return true to indicate task was updated
      },
      error: (error) => {
        console.error('Error updating task name:', error);
        this.savingTaskName = false;
        alert('Failed to update task name. Please try again.');
      }
    });
  }

  saveChanges(event?: Event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    console.log('saveChanges called', {
      selectedStatus: this.selectedStatus,
      currentStatus: this.data.status,
      taskId: this.data.task_id,
      saving: this.saving
    });

    if (this.selectedStatus === this.data.status) {
      console.log('No changes to save - status unchanged');
      return; // No changes to save
    }

    this.saving = true;
    const update: TaskUpdate = {
      status: this.selectedStatus
    };

    console.log('Sending update request:', update);

    this.taskService.updateTask(this.data.task_id, update).subscribe({
      next: (response) => {
        console.log('Task updated successfully:', response);
        this.saving = false;
        this.data.status = this.selectedStatus;
        this.dialogRef.close(true); // Return true to indicate task was updated
      },
      error: (error) => {
        console.error('Error updating task:', error);
        console.error('Error details:', {
          status: error.status,
          statusText: error.statusText,
          message: error.message,
          error: error.error,
          url: error.url
        });
        this.saving = false;
        let errorMessage = 'Failed to update task status. Please try again.';
        if (error.error?.detail) {
          if (Array.isArray(error.error.detail)) {
            errorMessage = error.error.detail.map((d: any) => d.msg || d).join(', ');
          } else {
            errorMessage = error.error.detail;
          }
        }
        alert(`Failed to update task status: ${errorMessage}`);
      }
    });
  }

  shareTask() {
    if (!this.selectedUserId || !this.data.task_group_id) {
      return;
    }

    this.sharing = true;
    this.shareMessage = '';

    // Share task by adding target user to the main task group
    // This creates an entry in user_task_group_id table with:
    // - user_id: the target user's ID (selectedUserId)
    // - task_group_id: the main task ID (this.data.task_group_id)
    // This allows the target user to see the main task and all tasks within it
    console.log('Sharing task:', {
      taskId: this.data.task_id,
      taskName: this.data.task_name,
      taskGroupId: this.data.task_group_id,
      targetUserId: this.selectedUserId
    });
    
    this.taskService.shareTaskWithUser(this.selectedUserId, this.data.task_group_id).subscribe({
      next: (response) => {
        this.sharing = false;
        this.shareSuccess = true;
        const sharedUserName = this.getUsername(this.selectedUserId);
        this.shareMessage = `Task shared successfully with ${sharedUserName}`;
        
        // Remove the shared user from available users
        this.availableUsers = this.availableUsers.filter(user => 
          user.user_id !== this.selectedUserId
        );
        
        // Add to shared users list
        const sharedUser = this.userMap.get(this.selectedUserId!);
        if (sharedUser) {
          this.sharedUsers.push(sharedUser);
        }
        
        // Reload shared users to update the list from server
        // Get all users first, then reload shared users
        this.taskService.getAllUsers().subscribe({
          next: (allUsers) => {
            this.loadSharedUsers(this.data.task_group_id!, allUsers);
          },
          error: (error) => {
            console.error('Error reloading users for shared list:', error);
          }
        });
        
        this.selectedUserId = null;
        
        setTimeout(() => {
          this.shareMessage = '';
        }, 3000);
      },
      error: (error) => {
        console.error('Error sharing task:', error);
        this.sharing = false;
        this.shareSuccess = false;
        this.shareMessage = 'Failed to share task. Please try again.';
      }
    });
  }

  deleteTask() {
    if (!confirm(`Are you sure you want to delete the task "${this.data.task_name}"? This action cannot be undone.`)) {
      return;
    }

    this.deleting = true;
    this.taskService.deleteTask(this.data.task_id).subscribe({
      next: () => {
        this.deleting = false;
        // Close dialog and return 'deleted' to indicate task was deleted
        this.dialogRef.close('deleted');
      },
      error: (error) => {
        console.error('Error deleting task:', error);
        this.deleting = false;
        alert('Failed to delete task. Please try again.');
      }
    });
  }

  onClose() {
    this.dialogRef.close(false);
  }
}

