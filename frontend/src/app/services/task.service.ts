import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';

export interface Task {
  task_id: number;
  task_name: string;
  status: 'PENDING' | 'DONE' | 'REJECTED';
  assigned_by: number | null;
  assigned_to: number | null;
  task_group_id: number | null;
  creation_date?: string;
  modification_date?: string;
}

export interface MainTask {
  main_task_id: number;
  main_task_name: string;
  assigned_by: number;
  is_active: number;
  creation_date?: string;
  modification_date?: string;
}

export interface UserMainTasksResponse {
  user: string;
  main_tasks: MainTask[];
}

export interface User {
  user_id: number;
  username: string;
  surname?: string;
  is_active: number;
}

export interface TaskUpdate {
  task_name?: string;
  status?: 'PENDING' | 'DONE' | 'REJECTED';
  assigned_by?: number | null;
  assigned_to?: number | null;
  task_group_id?: number | null;
}

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private apiUrl = 'http://localhost:8000';

  constructor(private http: HttpClient) {}

  // Get main tasks for a user (legacy endpoint)
  // Backend endpoint: GET /main_task/{user_id}
  getMainTasks(userId: number): Observable<MainTask[]> {
    return this.http.get<any[]>(`${this.apiUrl}/main_task/${userId}`).pipe(
      switchMap((response) => {
        // Backend returns task_id, we need to map to main_task_id
        const mainTasks: MainTask[] = response.map((item: any) => ({
          main_task_id: item.task_id || item.mTask_id || item.main_task_id,
          main_task_name: item.task_name || item.mTask_name || item.main_task_name,
          assigned_by: item.assigned_by,
          is_active: item.is_active || 1
        }));
        return of(mainTasks);
      })
    );
  }

  // Get all main tasks
  // Backend endpoint: GET /main_tasks
  getAllMainTasks(): Observable<MainTask[]> {
    console.log('TaskService: Getting all main tasks via GET', `${this.apiUrl}/main_tasks`);
    return this.http.get<any[]>(`${this.apiUrl}/main_tasks`).pipe(
      switchMap((response) => {
        // Backend returns mTask_id, we need to map to main_task_id
        const mainTasks: MainTask[] = response.map((item: any) => ({
          main_task_id: item.mTask_id || item.main_task_id,
          main_task_name: item.mTask_name || item.main_task_name,
          assigned_by: item.assigned_by,
          is_active: item.is_active,
          creation_date: item.creation_date,
          modification_date: item.modification_date
        }));
        console.log('Mapped main tasks:', mainTasks);
        return of(mainTasks);
      }),
      catchError((error) => {
        console.error('Error getting all main tasks:', error);
        console.error('Error details:', {
          status: error.status,
          statusText: error.statusText,
          message: error.message,
          error: error.error,
          url: error.url
        });
        return of([] as MainTask[]);
      })
    );
  }

  // Delete main task
  deleteMainTask(mainTaskId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/main_task/${mainTaskId}`);
  }

  // Get main tasks for a user
  // Backend endpoint: GET /users/{user_id}/main-tasks
  // Backend function: get_user_main_tasks
  // Returns main tasks that the user has access to (assigned to or shared with)
  getUserMainTasks(userId: number): Observable<UserMainTasksResponse> {
    const url = `${this.apiUrl}/users/${userId}/main-tasks`;
    console.log('TaskService: Getting user main tasks via GET', url, 'for userId:', userId);
    return this.http.get<any>(url).pipe(
      switchMap((response) => {
        // Backend returns main_tasks with mTask_id, we need to map to main_task_id
        const mappedResponse: UserMainTasksResponse = {
          user: response.user || '',
          main_tasks: (response.main_tasks || []).map((item: any) => ({
            main_task_id: item.main_task_id || item.mTask_id,
            main_task_name: item.main_task_name || item.mTask_name,
            assigned_by: item.assigned_by,
            is_active: item.is_active,
            creation_date: item.creation_date,
            modification_date: item.modification_date
          }))
        };
        console.log('Mapped user main tasks response:', mappedResponse);
        return of(mappedResponse);
      }),
      catchError((error) => {
        console.error('Error getting user main tasks:', error);
        console.error('Error details:', {
          status: error.status,
          statusText: error.statusText,
          message: error.message,
          error: error.error,
          url: error.url
        });
        // Re-throw the error so the caller can handle it
        throw error;
      })
    );
  }

  // Get all tasks
  // Backend endpoint: GET /tasks/
  getAllTasks(): Observable<Task[]> {
    console.log('TaskService: Getting all tasks via GET', `${this.apiUrl}/tasks/`);
    return this.http.get<Task[]>(`${this.apiUrl}/tasks/`).pipe(
      catchError((error) => {
        console.error('Error getting all tasks:', error);
        console.error('Error details:', {
          status: error.status,
          statusText: error.statusText,
          message: error.message,
          error: error.error,
          url: error.url
        });
        return of([] as Task[]);
      })
    );
  }

  // Get a single task by ID
  getTaskById(taskId: number): Observable<Task> {
    return this.http.get<Task>(`${this.apiUrl}/tasks/${taskId}`);
  }

  // Update task
  updateTask(taskId: number, update: TaskUpdate): Observable<any> {
    return this.http.put(`${this.apiUrl}/tasks/${taskId}`, update);
  }

  // Delete task
  deleteTask(taskId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/tasks/${taskId}`);
  }

  // Get all users
  getAllUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/users/`);
  }

  // Create a new user
  createUser(userData: {
    username: string;
    password: string;
    surname?: string;
    is_active?: number;
  }): Observable<User> {
    return this.http.post<User>(`${this.apiUrl}/users/`, userData);
  }

  // Delete a user
  deleteUser(userId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/users/${userId}`);
  }

  // Toggle user active status
  toggleUserStatus(userId: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/users/${userId}/toggle_active`, {});
  }

  // Update user (edit username and/or password)
  // Backend endpoint: PUT /users/{user_id}
  updateUser(userId: number, userData: {
    username?: string;
    password?: string;
  }): Observable<any> {
    return this.http.put(`${this.apiUrl}/users/${userId}`, userData);
  }

  // Share task with user (add user to task group)
  // Share task with user by adding them to the main task group
  // Backend endpoint: POST /main-tasks/{main_task_id}/share/{user_id}
  // This creates an entry in user_task_group_id table with:
  // - user_id: the target user's ID
  // - task_group_id: the main task ID (task_group_id from the task)
  // This allows the target user to see the main task and all tasks within it
  shareTaskWithUser(userId: number, taskGroupId: number): Observable<any> {
    console.log('Sharing task with user:', { userId, taskGroupId });
    return this.http.post(`${this.apiUrl}/main-tasks/${taskGroupId}/share/${userId}`, {});
  }

  // Get all users in a task group
  // Note: Backend doesn't have a direct endpoint for this, so we'll need to get all users
  // and filter, or use a different approach. For now, returning empty array.
  getUsersInTaskGroup(taskGroupId: number): Observable<User[]> {
    // Backend doesn't have this endpoint, so return empty for now
    // TODO: Add backend endpoint or implement alternative approach
    return of([] as User[]);
  }

  // Create a new task (assign task to user)
  createTask(taskData: {
    task_name: string;
    assigned_by: number;
    assigned_to: number | null;
    task_group_id: number;
    status?: 'PENDING' | 'DONE' | 'REJECTED';
  }): Observable<Task> {
    return this.http.post<Task>(`${this.apiUrl}/tasks/assign`, taskData);
  }

  // Create a new main task
  // Backend function: create_main_task(task: MainTaskCreate)
  // Endpoint: POST /main_task
  createMainTask(mainTaskData: {
    mTask_name: string;
    assigned_by: number;
    is_active?: number;
  }): Observable<MainTask> {
    console.log('TaskService: Creating main task via POST /main_task', mainTaskData);
    // Backend returns {message: string, task_id: number}
    // We need to map it to MainTask interface which expects main_task_id
    return this.http.post<any>(`${this.apiUrl}/main_task`, mainTaskData).pipe(
      switchMap((response) => {
        // Map backend response to MainTask interface
        const mainTask: MainTask = {
          main_task_id: response.task_id || response.mTask_id || response.main_task_id,
          main_task_name: mainTaskData.mTask_name,
          assigned_by: mainTaskData.assigned_by,
          is_active: mainTaskData.is_active || 1
        };
        return of(mainTask);
      })
    );
  }

  // Ensure user is in main task (add them if not already)
  // This is called BEFORE assigning a user to a task, so they can see the main task
  // and all tasks within it after assignment.
  ensureUserInMainTask(userId: number, taskGroupId: number): Observable<any> {
    // Directly add the user to the task group via shareTaskWithUser.
    // If they're already in it, the backend should handle it gracefully.
    return this.shareTaskWithUser(userId, taskGroupId).pipe(
      catchError((error) => {
        // If the user is already in the task group, the backend might return an error
        // In that case, we'll treat it as success since the goal is achieved
        console.warn('Error adding user to main task (may already be in it):', error);
        // Return a success observable to not break the chain
        return new Observable(observer => {
          observer.next({ alreadyInTask: true, error: error });
          observer.complete();
        });
      })
    );
  }
}

