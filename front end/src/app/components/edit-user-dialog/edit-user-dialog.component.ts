import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { TaskService, User } from '../../services/task.service';

export interface EditUserDialogData {
  userId: number;
  currentUsername: string;
}

@Component({
  selector: 'app-edit-user-dialog',
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
        <h2 mat-dialog-title>Edit My Profile</h2>
      </div>
      
      <mat-dialog-content class="dialog-content">
        <form #editUserForm="ngForm">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Username</mat-label>
            <input matInput [(ngModel)]="username" name="username" required placeholder="Enter new username">
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>New Password</mat-label>
            <input matInput [(ngModel)]="password" name="password" type="password" placeholder="Enter new password (leave blank to keep current)">
            <mat-hint>Leave blank if you don't want to change your password</mat-hint>
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width" *ngIf="password">
            <mat-label>Confirm New Password</mat-label>
            <input matInput [(ngModel)]="confirmPassword" name="confirmPassword" type="password" placeholder="Confirm new password">
          </mat-form-field>

          <div *ngIf="errorMessage" class="error-message">
            {{ errorMessage }}
          </div>
        </form>
      </mat-dialog-content>
      
      <mat-dialog-actions class="dialog-actions">
        <button mat-button (click)="onCancel()">Cancel</button>
        <button 
          mat-raised-button 
          color="primary" 
          (click)="onSave()" 
          [disabled]="!username || updating || (password && password !== confirmPassword)">
          <mat-icon *ngIf="!updating">save</mat-icon>
          {{ updating ? 'Updating...' : 'Save Changes' }}
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

    .error-message {
      color: #f44336;
      font-size: 0.9rem;
      margin-top: 8px;
      padding: 8px;
      background-color: #ffebee;
      border-radius: 4px;
      border: 1px solid #ffcdd2;
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
export class EditUserDialogComponent implements OnInit {
  username: string = '';
  password: string = '';
  confirmPassword: string = '';
  updating: boolean = false;
  errorMessage: string = '';

  constructor(
    public dialogRef: MatDialogRef<EditUserDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: EditUserDialogData,
    private taskService: TaskService
  ) {}

  ngOnInit() {
    this.username = this.data.currentUsername || '';
  }

  onSave() {
    if (!this.username.trim()) {
      this.errorMessage = 'Username is required';
      return;
    }

    if (this.password && this.password !== this.confirmPassword) {
      this.errorMessage = 'Passwords do not match';
      return;
    }

    this.errorMessage = '';
    this.updating = true;

    const updateData: any = {
      username: this.username.trim()
    };

    if (this.password && this.password.trim()) {
      updateData.password = this.password.trim();
    }

    this.taskService.updateUser(this.data.userId, updateData).subscribe({
      next: (response) => {
        this.updating = false;
        this.dialogRef.close({
          user_id: this.data.userId,
          username: this.username.trim(),
          updated: true
        });
      },
      error: (error) => {
        console.error('Error updating user:', error);
        this.updating = false;
        let errorMessage = 'Failed to update profile. Please try again.';
        if (error.error?.detail) {
          if (Array.isArray(error.error.detail)) {
            errorMessage = error.error.detail.map((d: any) => d.msg || d).join(', ');
          } else {
            errorMessage = error.error.detail;
          }
        } else if (error.error?.message) {
          errorMessage = error.error.message;
        }
        this.errorMessage = errorMessage;
      }
    });
  }

  onCancel() {
    this.dialogRef.close();
  }
}

