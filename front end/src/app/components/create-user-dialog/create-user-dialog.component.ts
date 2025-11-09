import { Component } from '@angular/core';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { TaskService, User } from '../../services/task.service';

@Component({
  selector: 'app-create-user-dialog',
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
        <h2 mat-dialog-title>Create New User</h2>
      </div>
      
      <mat-dialog-content class="dialog-content">
        <form #createUserForm="ngForm">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Username</mat-label>
            <input matInput [(ngModel)]="username" name="username" required placeholder="Enter username" (keyup.enter)="onCreate($event)">
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Password</mat-label>
            <input matInput type="password" [(ngModel)]="password" name="password" required placeholder="Enter password" (keyup.enter)="onCreate($event)">
          </mat-form-field>
          
          <mat-dialog-actions class="dialog-actions">
            <button mat-button type="button" (click)="onCancel()">Cancel</button>
            <button 
              mat-raised-button 
              color="primary" 
              type="button" 
              (click)="onCreate($event)" 
              [disabled]="creating || !username?.trim() || !password?.trim()" 
              style="cursor: pointer;">
              <mat-icon *ngIf="!creating">person_add</mat-icon>
              <span *ngIf="creating">Creating...</span>
              <span *ngIf="!creating">Create User</span>
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
export class CreateUserDialogComponent {
  username: string = '';
  password: string = '';
  creating: boolean = false;

  constructor(
    public dialogRef: MatDialogRef<CreateUserDialogComponent>,
    private taskService: TaskService
  ) {}

  onCreate(event?: Event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    const trimmedUsername = this.username?.trim();
    const trimmedPassword = this.password?.trim();

    if (!trimmedUsername || !trimmedPassword) {
      alert('Please enter both username and password');
      return;
    }

    if (this.creating) {
      return;
    }

    this.creating = true;

    const userData = {
      username: trimmedUsername,
      password: trimmedPassword,
      is_active: 1
    };

    this.taskService.createUser(userData).subscribe({
      next: (createdUser) => {
        console.log('User created successfully:', createdUser);
        this.creating = false;
        this.dialogRef.close(createdUser);
      },
      error: (error) => {
        console.error('Error creating user:', error);
        this.creating = false;
        let errorMessage = 'Failed to create user. Please try again.';
        if (error.error?.detail) {
          if (Array.isArray(error.error.detail)) {
            errorMessage = error.error.detail.map((d: any) => d.msg || d).join(', ');
          } else {
            errorMessage = error.error.detail;
          }
        }
        alert(`Failed to create user: ${errorMessage}`);
      }
    });
  }

  onCancel() {
    this.dialogRef.close();
  }
}

