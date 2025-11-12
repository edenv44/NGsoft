import { Component, OnInit } from '@angular/core';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { TaskService, User } from '../../services/task.service';

@Component({
  selector: 'app-delete-user-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatButtonModule,
    MatSelectModule,
    MatIconModule
  ],
  template: `
    <div class="dialog-container">
      <div class="dialog-header">
        <h2 mat-dialog-title>Delete User</h2>
      </div>
      
      <mat-dialog-content class="dialog-content">
        <div *ngIf="loading" class="loading-message">
          Loading users...
        </div>
        
        <form *ngIf="!loading" #deleteUserForm="ngForm">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Select User to Delete</mat-label>
            <mat-select [(ngModel)]="selectedUserId" name="selectedUser" required>
              <mat-option *ngFor="let user of users" [value]="user.user_id">
                {{ user.username }}{{ user.surname ? ' ' + user.surname : '' }} (ID: {{ user.user_id }})
              </mat-option>
            </mat-select>
          </mat-form-field>

          <div *ngIf="selectedUser" class="user-info">
            <p><strong>Selected User:</strong> {{ selectedUser.username }}{{ selectedUser.surname ? ' ' + selectedUser.surname : '' }}</p>
            <p><strong>User ID:</strong> {{ selectedUser.user_id }}</p>
          </div>
          
          <mat-dialog-actions class="dialog-actions">
            <button mat-button type="button" (click)="onCancel()">Cancel</button>
            <button 
              mat-raised-button 
              color="warn" 
              type="button" 
              (click)="onDelete()" 
              [disabled]="deleting || !selectedUserId" 
              style="cursor: pointer;">
              <mat-icon *ngIf="!deleting">delete</mat-icon>
              <span *ngIf="deleting">Deleting...</span>
              <span *ngIf="!deleting">Delete User</span>
            </button>
          </mat-dialog-actions>
        </form>
      </mat-dialog-content>
    </div>
  `,
  styles: [`
    .dialog-container {
      min-width: 500px;
      max-width: 500px;
      overflow: hidden;
    }

    .dialog-header {
      background: linear-gradient(135deg, #f44336 0%, #d32f2f 100%);
      color: white;
      padding: 20px 24px;
      margin: -24px -24px 0 -24px;
      flex-shrink: 0;
    }

    .dialog-header h2 {
      margin: 0;
      font-size: 1.5rem;
      font-weight: 600;
    }

    .dialog-content {
      padding: 24px !important;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    .full-width {
      width: 100%;
      margin-bottom: 16px;
      flex-shrink: 0;
    }

    .loading-message {
      text-align: center;
      padding: 40px;
      color: #666;
    }

    .user-info {
      background: #f8f9fa;
      padding: 16px;
      border-radius: 8px;
      margin-bottom: 16px;
      border-left: 4px solid #f44336;
    }

    .user-info p {
      margin: 8px 0;
      color: #333;
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
      flex-shrink: 0;
    }

    .dialog-actions button {
      position: relative;
      z-index: 11;
      pointer-events: auto;
    }

    ::ng-deep .mat-mdc-dialog-container {
      padding: 0 !important;
      overflow: hidden !important;
    }

    ::ng-deep .mat-mdc-dialog-content {
      margin: 0;
      padding: 0;
      overflow: hidden !important;
      max-height: none !important;
    }

    ::ng-deep .cdk-overlay-pane {
      overflow: hidden !important;
    }
  `]
})
export class DeleteUserDialogComponent implements OnInit {
  users: User[] = [];
  selectedUserId: number | null = null;
  deleting: boolean = false;
  loading: boolean = true;

  constructor(
    public dialogRef: MatDialogRef<DeleteUserDialogComponent>,
    private taskService: TaskService
  ) {}

  ngOnInit() {
    // Load all users
    this.taskService.getAllUsers().subscribe({
      next: (users) => {
        this.users = users;
        this.loading = false;
        if (users.length === 0) {
          alert('No users found in the system.');
          this.dialogRef.close();
        }
      },
      error: (error) => {
        console.error('Error loading users:', error);
        this.loading = false;
        alert('Failed to load users. Please try again.');
        this.dialogRef.close();
      }
    });
  }

  get selectedUser(): User | undefined {
    if (!this.selectedUserId) return undefined;
    return this.users.find(u => u.user_id === this.selectedUserId!);
  }

  onDelete() {
    if (!this.selectedUserId || !this.selectedUser) {
      return;
    }

    // Confirm deletion
    const confirmMessage = `Are you sure you want to delete user "${this.selectedUser.username}${this.selectedUser.surname ? ' ' + this.selectedUser.surname : ''}" (ID: ${this.selectedUser.user_id})?`;
    if (!confirm(confirmMessage)) {
      return;
    }

    this.deleting = true;

    this.taskService.deleteUser(this.selectedUserId).subscribe({
      next: () => {
        console.log('User deleted successfully');
        this.deleting = false;
        this.dialogRef.close(this.selectedUser);
      },
      error: (error) => {
        console.error('Error deleting user:', error);
        this.deleting = false;
        let errorMessage = 'Failed to delete user. Please try again.';
        if (error.error?.detail) {
          errorMessage = error.error.detail;
        }
        alert(`Failed to delete user: ${errorMessage}`);
      }
    });
  }

  onCancel() {
    this.dialogRef.close();
  }
}

