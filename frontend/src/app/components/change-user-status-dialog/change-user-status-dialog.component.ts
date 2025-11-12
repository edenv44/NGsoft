import { Component, OnInit } from '@angular/core';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { TaskService, User } from '../../services/task.service';

@Component({
  selector: 'app-change-user-status-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatButtonModule,
    MatSelectModule,
    MatIconModule,
    MatChipsModule
  ],
  template: `
    <div class="dialog-container">
      <div class="dialog-header">
        <h2 mat-dialog-title>Change User Status</h2>
      </div>
      
      <mat-dialog-content class="dialog-content">
        <div *ngIf="loading" class="loading-message">
          Loading users...
        </div>
        
        <form *ngIf="!loading" #changeStatusForm="ngForm">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Select User</mat-label>
            <mat-select [(ngModel)]="selectedUserId" name="selectedUser" required>
              <mat-option *ngFor="let user of users" [value]="user.user_id">
                {{ user.username }}{{ user.surname ? ' ' + user.surname : '' }} (ID: {{ user.user_id }})
                <span class="status-badge" [class.active]="user.is_active === 1" [class.inactive]="user.is_active === 0">
                  {{ user.is_active === 1 ? 'Active' : 'Inactive' }}
                </span>
              </mat-option>
            </mat-select>
          </mat-form-field>

          <div *ngIf="selectedUser" class="user-info">
            <p><strong>Selected User:</strong> {{ selectedUser.username }}{{ selectedUser.surname ? ' ' + selectedUser.surname : '' }}</p>
            <p><strong>User ID:</strong> {{ selectedUser.user_id }}</p>
            <p><strong>Current Status:</strong> 
              <span class="status-badge" [class.active]="selectedUser.is_active === 1" [class.inactive]="selectedUser.is_active === 0">
                <mat-icon>{{ selectedUser.is_active === 1 ? 'check_circle' : 'cancel' }}</mat-icon>
                {{ selectedUser.is_active === 1 ? 'Active' : 'Inactive' }}
              </span>
            </p>
            <p><strong>New Status:</strong> 
              <span class="status-badge" [class.active]="selectedUser.is_active === 0" [class.inactive]="selectedUser.is_active === 1">
                <mat-icon>{{ selectedUser.is_active === 0 ? 'check_circle' : 'cancel' }}</mat-icon>
                {{ selectedUser.is_active === 0 ? 'Active' : 'Inactive' }}
              </span>
            </p>
          </div>
          
          <mat-dialog-actions class="dialog-actions">
            <button mat-button type="button" (click)="onCancel()">Cancel</button>
            <button 
              mat-raised-button 
              color="primary" 
              type="button" 
              (click)="onToggleStatus()" 
              [disabled]="toggling || !selectedUserId" 
              style="cursor: pointer;">
              <mat-icon *ngIf="!toggling">swap_horiz</mat-icon>
              <span *ngIf="toggling">Changing...</span>
              <span *ngIf="!toggling">Confirm Change</span>
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
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
      border-left: 4px solid #667eea;
    }

    .user-info p {
      margin: 8px 0;
      color: #333;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 4px 12px;
      border-radius: 16px;
      font-size: 0.85rem;
      font-weight: 500;
      margin-left: 8px;
    }

    .status-badge.active {
      background-color: #d4edda;
      color: #155724;
    }

    .status-badge.inactive {
      background-color: #f8d7da;
      color: #721c24;
    }

    .status-badge mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
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

    ::ng-deep .mat-mdc-select-value-text {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
    }
  `]
})
export class ChangeUserStatusDialogComponent implements OnInit {
  users: User[] = [];
  selectedUserId: number | null = null;
  toggling: boolean = false;
  loading: boolean = true;
  currentUserId: number | null = null;

  constructor(
    public dialogRef: MatDialogRef<ChangeUserStatusDialogComponent>,
    private taskService: TaskService
  ) {
    this.loadCurrentUserId();
  }

  private loadCurrentUserId() {
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
    // Load all users except current user
    this.taskService.getAllUsers().subscribe({
      next: (users) => {
        // Filter out current user
        this.users = users.filter(user => user.user_id !== this.currentUserId);
        this.loading = false;
        if (this.users.length === 0) {
          alert('No other users found in the system.');
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

  onToggleStatus() {
    if (!this.selectedUserId || !this.selectedUser) {
      return;
    }

    const currentStatus = this.selectedUser.is_active === 1 ? 'Active' : 'Inactive';
    const newStatus = this.selectedUser.is_active === 1 ? 'Inactive' : 'Active';
    const confirmMessage = `Are you sure you want to change user "${this.selectedUser.username}${this.selectedUser.surname ? ' ' + this.selectedUser.surname : ''}" status from ${currentStatus} to ${newStatus}?`;
    
    if (!confirm(confirmMessage)) {
      return;
    }

    this.toggling = true;

    this.taskService.toggleUserStatus(this.selectedUserId).subscribe({
      next: (response) => {
        console.log('User status toggled successfully:', response);
        this.toggling = false;
        // Update the user's status in the local array
        const user = this.selectedUser!;
        user.is_active = user.is_active === 1 ? 0 : 1;
        this.dialogRef.close(user);
      },
      error: (error) => {
        console.error('Error toggling user status:', error);
        this.toggling = false;
        let errorMessage = 'Failed to change user status. Please try again.';
        if (error.error?.detail) {
          errorMessage = error.error.detail;
        }
        alert(`Failed to change user status: ${errorMessage}`);
      }
    });
  }

  onCancel() {
    this.dialogRef.close();
  }
}

