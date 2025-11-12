import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { forkJoin, of } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { TaskService, Task, MainTask, UserMainTasksResponse } from '../services/task.service';
import { TaskSearchPipe } from '../pipes/task-search.pipe';
import { TaskDetailsDialogComponent } from '../components/task-details-dialog/task-details-dialog.component';
import { CreateTaskDialogComponent } from '../components/create-task-dialog/create-task-dialog.component';
import { CreateMainTaskDialogComponent } from '../components/create-main-task-dialog/create-main-task-dialog.component';
import { CreateUserDialogComponent } from '../components/create-user-dialog/create-user-dialog.component';
import { DeleteUserDialogComponent } from '../components/delete-user-dialog/delete-user-dialog.component';
import { ChangeUserStatusDialogComponent } from '../components/change-user-status-dialog/change-user-status-dialog.component';
import { EditUserDialogComponent } from '../components/edit-user-dialog/edit-user-dialog.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatInputModule,
    MatSelectModule,
    MatFormFieldModule,
    MatChipsModule,
    MatIconModule,
    MatExpansionModule,
    MatSnackBarModule,
    TaskSearchPipe
  ],
  templateUrl: './home.html',
  styleUrls: ['./home.css']
})
export class HomeComponent implements OnInit {
  username: string | null = '';
  userId: number | null = null;
  mainTasks: MainTask[] = [];
  filteredMainTasks: MainTask[] = [];
  searchText: string = '';
  loading: boolean = false;
  errorMessage: string = '';
  expandedMainTaskId: number | null = null;
  tasksByMainTask: Map<number, Task[]> = new Map();
  loadingTasks: Map<number, boolean> = new Map();

  constructor(
    private router: Router,
    private http: HttpClient,
    private taskService: TaskService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  // Cookie utility functions
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

  private deleteCookie(name: string): void {
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
  }

  ngOnInit() {
    console.log('Home component initialized');
    
    // Get user from cookie (saved as JSON string)
    const userStr = this.getCookie('user');
    const token = this.getCookie('token');
    
    console.log('User from cookie:', userStr);
    console.log('Token from cookie:', token);
    
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        this.username = user.username || user.user_id || '';
        this.userId = user.user_id || user.id || null;
        console.log('Parsed username:', this.username);
        console.log('Parsed user ID:', this.userId);
      } catch (e) {
        console.error('Error parsing user data:', e);
        this.username = '';
      }
    }

    // Only redirect if there's absolutely no user data or token
    // Allow navigation even if username is empty (might be in different format)
    if (!userStr && !token) {
      console.log('No user or token found, redirecting to login');
      this.router.navigate(['/login']);
    } else {
      console.log('User authenticated, staying on home page');
      if (this.userId) {
        this.loadTasks();
      }
    }
  }

  loadTasks() {
    if (!this.userId) {
      console.error('loadTasks: userId is null or undefined');
      return;
    }

    console.log('=== loadTasks START ===');
    console.log('userId:', this.userId);
    console.log('username:', this.username);

    this.loading = true;
    this.errorMessage = '';

    // Use forkJoin to get tasks and user's main tasks
    // Backend function: getUserMainTasks - returns all main tasks user has access to
    // (both created by user and shared with user via user_task_group_id table)
    forkJoin({
      allTasks: this.taskService.getAllTasks(),
      userMainTasks: this.taskService.getUserMainTasks(this.userId!).pipe(
        catchError((error) => {
          console.error('getUserMainTasks endpoint failed:', error);
          console.error('Failed URL:', error.url || `http://localhost:8000/users/${this.userId}/main-tasks`);
          console.error('User ID used:', this.userId);
          console.error('Error status:', error.status);
          console.error('Error message:', error.message);
          console.error('Error details:', error.error);
          
          // Fallback: Get all main tasks and filter by assigned_by
          console.log('Attempting fallback: getAllMainTasks');
          return this.taskService.getAllMainTasks().pipe(
            catchError((fallbackError) => {
              console.error('getAllMainTasks also failed:', fallbackError);
              // If getAllMainTasks also fails, return empty
              return of([] as MainTask[]);
            }),
            switchMap((allMainTasks) => {
              console.log('Fallback: Got all main tasks:', allMainTasks);
              // Filter main tasks: created by user OR have tasks assigned to user
              const userMainTasks = allMainTasks.filter(mt => 
                mt.assigned_by === this.userId
              );
              console.log('Fallback: Filtered main tasks for user:', userMainTasks);
              return of({ user: '', main_tasks: userMainTasks } as UserMainTasksResponse);
            })
          );
        })
      )
    }).subscribe({
      next: ({ allTasks, userMainTasks }) => {
        console.log('=== loadTasks SUCCESS ===');
        console.log('allTasks:', allTasks);
        console.log('allTasks length:', allTasks?.length || 0);
        console.log('userMainTasks:', userMainTasks);
        console.log('userMainTasks type:', typeof userMainTasks);
        console.log('userMainTasks.main_tasks:', userMainTasks?.main_tasks);
        console.log('userMainTasks.main_tasks length:', userMainTasks?.main_tasks?.length || 0);
        
        if (!userMainTasks) {
          console.error('userMainTasks is null or undefined!');
          this.mainTasks = [];
          this.applyFilters();
          this.loading = false;
          return;
        }

        if (!userMainTasks.main_tasks) {
          console.error('userMainTasks.main_tasks is null or undefined!');
          this.mainTasks = [];
          this.applyFilters();
          this.loading = false;
          return;
        }

        // Get task_group_ids from tasks assigned to user
        const assignedTaskGroupIds = new Set<number>(
          allTasks
            .filter(task => task.assigned_to === this.userId && task.task_group_id !== null)
            .map(task => task.task_group_id!)
        );

        // Backend function getUserMainTasks returns:
        // 1. Main tasks created by the user (assigned_by == user_id)
        // 2. Main tasks shared with the user (via user_task_group_id table)
        const userMainTaskIds = new Set<number>(
          (userMainTasks.main_tasks || []).map(mt => mt.main_task_id)
        );

        console.log('assignedTaskGroupIds:', Array.from(assignedTaskGroupIds));
        console.log('userMainTaskIds:', Array.from(userMainTaskIds));

        // Show ALL main tasks the user has access to (created by or shared with)
        // Don't filter by assigned tasks - if user has access to main task, show it
        this.mainTasks = userMainTasks.main_tasks || [];
        
        console.log('Main tasks before filtering:', this.mainTasks);
        console.log('Main tasks count:', this.mainTasks.length);
        console.log('Main tasks details:', JSON.stringify(this.mainTasks, null, 2));
        
        this.applyFilters();
        this.loading = false;
        console.log('Main tasks after filtering:', this.filteredMainTasks);
        console.log('Filtered main tasks count:', this.filteredMainTasks.length);
        console.log('=== loadTasks END ===');
      },
      error: (error) => {
        console.error('=== loadTasks ERROR ===');
        console.error('Error loading tasks or user main tasks:', error);
        console.error('Error details:', {
          status: error.status,
          statusText: error.statusText,
          message: error.message,
          error: error.error,
          url: error.url
        });
        this.errorMessage = 'Failed to load tasks. Please try again.';
        this.loading = false;
        this.mainTasks = [];
        this.applyFilters();
      }
    });
  }

  applyFilters() {
    // Filter by search text (will be applied by pipe)
    // Since main tasks don't have status, we only filter by search
    this.filteredMainTasks = [...this.mainTasks];
  }

  onStatusChange() {
    // No longer needed since we're not filtering by status
    this.applyFilters();
  }

  onMainTaskOpened(mainTask: MainTask) {
    this.expandedMainTaskId = mainTask.main_task_id;
    // Load tasks if not already loaded
    if (!this.tasksByMainTask.has(mainTask.main_task_id)) {
      this.loadTasksForMainTask(mainTask.main_task_id);
    }
  }

  onMainTaskClosed() {
    this.expandedMainTaskId = null;
  }

  loadTasksForMainTask(mainTaskId: number) {
    if (!this.userId) return;

    this.loadingTasks.set(mainTaskId, true);

    console.log(`Loading tasks for main task ${mainTaskId} for user ${this.userId}`);

    // Get all tasks for this user
    // Backend function: getUserMainTasks - returns all main tasks user has access to
    forkJoin({
      allTasks: this.taskService.getAllTasks(),
      userMainTasks: this.taskService.getUserMainTasks(this.userId).pipe(
        catchError((error) => {
          console.warn('getUserMainTasks failed in loadTasksForMainTask, using empty fallback:', error);
          // If endpoint fails, return empty response
          return of({ user: '', main_tasks: [] } as UserMainTasksResponse);
        })
      )
    }).subscribe({
      next: ({ allTasks, userMainTasks }) => {
        console.log(`=== loadTasksForMainTask response for mainTaskId ${mainTaskId} ===`);
        console.log('allTasks:', allTasks);
        console.log('userMainTasks:', userMainTasks);
        
        // Get task group IDs from user's main tasks (includes shared main tasks)
        // Backend function getUserMainTasks returns all main tasks user has access to
        const accessibleMainTaskIds = new Set<number>(
          (userMainTasks?.main_tasks || []).map(mt => mt.main_task_id)
        );

        console.log('accessibleMainTaskIds:', Array.from(accessibleMainTaskIds));
        console.log('mainTaskId:', mainTaskId);
        console.log('userId:', this.userId);

        // Check if user has access to this main task
        // User has access if:
        // 1. The main task is in their accessible main tasks list (created by them or shared with them)
        // 2. OR they created it (assigned_by === userId) - as a fallback
        const userMainTask = userMainTasks?.main_tasks?.find(mt => mt.main_task_id === mainTaskId);
        const userCreatedMainTask = userMainTask?.assigned_by === this.userId;
        const userHasAccess = accessibleMainTaskIds.has(mainTaskId) || userCreatedMainTask;

        console.log('userMainTask:', userMainTask);
        console.log('userCreatedMainTask:', userCreatedMainTask);
        console.log('userHasAccess:', userHasAccess);

        // Filter tasks: must be in this main task group
        // If user has access to the main task, they should see ALL tasks in that main task
        const tasks = allTasks.filter(task => {
          const belongsToMainTask = task.task_group_id === mainTaskId;
          return belongsToMainTask && userHasAccess;
        });

        console.log(`Tasks filtered for main task ${mainTaskId}:`, tasks);
        
        this.tasksByMainTask.set(mainTaskId, tasks);
        this.loadingTasks.set(mainTaskId, false);
        console.log(`Tasks loaded for main task ${mainTaskId}:`, tasks);
      },
      error: (error) => {
        console.error('Error loading tasks for main task:', error);
        console.error('Error details:', {
          status: error.status,
          statusText: error.statusText,
          message: error.message,
          error: error.error,
          url: error.url
        });
        this.loadingTasks.set(mainTaskId, false);
      }
    });
  }

  getTasksForMainTask(mainTaskId: number): Task[] {
    return this.tasksByMainTask.get(mainTaskId) || [];
  }

  isMainTaskExpanded(mainTaskId: number): boolean {
    return this.expandedMainTaskId === mainTaskId;
  }

  isLoadingTasks(mainTaskId: number): boolean {
    return this.loadingTasks.get(mainTaskId) || false;
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
        const dialogRef = this.dialog.open(TaskDetailsDialogComponent, {
          width: '600px',
          data: taskDetails
        });

        // Refresh task list if task was updated or deleted
        dialogRef.afterClosed().subscribe((result) => {
          if (result && task.task_group_id) {
            if (result === 'deleted') {
              // Task was deleted, refresh the task list and main tasks list
              this.loadTasksForMainTask(task.task_group_id);
              this.loadTasks();
            } else {
              // Task was updated, refresh the task list
              this.loadTasksForMainTask(task.task_group_id);
            }
          }
        });
      },
      error: (error) => {
        console.error('Error loading task details:', error);
        const dialogRef = this.dialog.open(TaskDetailsDialogComponent, {
          width: '600px',
          data: task
        });

        dialogRef.afterClosed().subscribe((result) => {
          if (result && task.task_group_id) {
            if (result === 'deleted') {
              // Task was deleted, refresh the task list and main tasks list
              this.loadTasksForMainTask(task.task_group_id);
              this.loadTasks();
            } else {
              // Task was updated, refresh the task list
              this.loadTasksForMainTask(task.task_group_id);
            }
          }
        });
      }
    });
  }

  openCreateTaskDialog() {
    if (!this.userId) return;

    const dialogRef = this.dialog.open(CreateTaskDialogComponent, {
      width: '600px',
      data: {
        userId: this.userId,
        mainTasks: this.mainTasks
      }
    });

    dialogRef.afterClosed().subscribe((createdTask) => {
      if (createdTask && createdTask.task_group_id) {
        // Show success message
        this.snackBar.open('Task created successfully!', 'Close', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'top',
          panelClass: ['success-snackbar']
        });
        // Refresh tasks for the main task where the task was created
        this.loadTasksForMainTask(createdTask.task_group_id);
        // Also refresh main tasks list in case visibility changed
        this.loadTasks();
      }
    });
  }

  openCreateTaskDialogForMainTask(mainTask: MainTask) {
    if (!this.userId) return;

    const dialogRef = this.dialog.open(CreateTaskDialogComponent, {
      width: '600px',
      data: {
        userId: this.userId,
        mainTasks: this.mainTasks,
        preselectedMainTaskId: mainTask.main_task_id
      }
    });

    dialogRef.afterClosed().subscribe((createdTask) => {
      if (createdTask && createdTask.task_group_id) {
        // Show success message
        this.snackBar.open('Task created successfully!', 'Close', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'top',
          panelClass: ['success-snackbar']
        });
        // Refresh tasks for the main task where the task was created
        this.loadTasksForMainTask(createdTask.task_group_id);
        // Also refresh main tasks list in case visibility changed
        this.loadTasks();
      }
    });
  }

  openCreateMainTaskDialog() {
    if (!this.userId) return;

    const dialogRef = this.dialog.open(CreateMainTaskDialogComponent, {
      width: '600px',
      data: {
        userId: this.userId
      }
    });

    dialogRef.afterClosed().subscribe((createdMainTask) => {
      if (createdMainTask) {
        // Show success message
        this.snackBar.open('Main task created successfully!', 'Close', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'top',
          panelClass: ['success-snackbar']
        });
        // Refresh main tasks list
        this.loadTasks();
      }
    });
  }

  deleteMainTask(mainTask: MainTask) {
    if (!this.userId) return;

    // Confirm deletion
    if (!confirm(`Are you sure you want to delete "${mainTask.main_task_name}"? This will also delete all tasks within it.`)) {
      return;
    }

    this.taskService.deleteMainTask(mainTask.main_task_id).subscribe({
      next: () => {
        // Show success message
        this.snackBar.open('Main task deleted successfully!', 'Close', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'top',
          panelClass: ['success-snackbar']
        });
        // Refresh main tasks list
        this.loadTasks();
      },
      error: (error) => {
        console.error('Error deleting main task:', error);
        alert('Failed to delete main task. Please try again.');
      }
    });
  }

  openCreateUserDialog() {
    if (!this.userId) return;

    const dialogRef = this.dialog.open(CreateUserDialogComponent, {
      width: '500px'
    });

    dialogRef.afterClosed().subscribe((createdUser) => {
      if (createdUser) {
        // Show success message
        this.snackBar.open(`User "${createdUser.username}" created successfully!`, 'Close', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'top',
          panelClass: ['success-snackbar']
        });
      }
    });
  }

  openChangeUserStatusDialog() {
    if (!this.userId) return;

    const dialogRef = this.dialog.open(ChangeUserStatusDialogComponent, {
      width: '500px'
    });

    dialogRef.afterClosed().subscribe((updatedUser) => {
      if (updatedUser) {
        const statusText = updatedUser.is_active === 1 ? 'Active' : 'Inactive';
        // Show success message
        this.snackBar.open(`User "${updatedUser.username}" status changed to ${statusText}!`, 'Close', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'top',
          panelClass: ['success-snackbar']
        });
      }
    });
  }

  openDeleteUserDialog() {
    if (!this.userId) return;

    const dialogRef = this.dialog.open(DeleteUserDialogComponent, {
      width: '500px'
    });

    dialogRef.afterClosed().subscribe((deletedUser) => {
      if (deletedUser) {
        // Show success message
        this.snackBar.open(`User "${deletedUser.username}" deleted successfully!`, 'Close', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'top',
          panelClass: ['success-snackbar']
        });
      }
    });
  }

  openEditUserDialog() {
    if (!this.userId) return;

    const dialogRef = this.dialog.open(EditUserDialogComponent, {
      width: '500px',
      data: {
        userId: this.userId,
        currentUsername: this.username || ''
      }
    });

    dialogRef.afterClosed().subscribe((updatedUser) => {
      if (updatedUser && updatedUser.updated) {
        // Update the username in the header
        this.username = updatedUser.username;
        
        // Update the cookie with new username
        const userCookie = this.getCookie('user');
        if (userCookie) {
          try {
            const userData = JSON.parse(userCookie);
            userData.username = updatedUser.username;
            this.setCookie('user', JSON.stringify(userData), 7);
          } catch (e) {
            console.error('Error updating user cookie:', e);
          }
        }

        // Show success message
        this.snackBar.open('Profile updated successfully!', 'Close', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'top',
          panelClass: ['success-snackbar']
        });
      }
    });
  }

  private setCookie(name: string, value: string, days: number = 7): void {
    const expires = new Date();
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
  }

  logout() {
    this.deleteCookie('user');
    this.deleteCookie('token');
    this.router.navigate(['/login']);
  }
}

