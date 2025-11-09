import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class LoginComponent {
  username: string = '';
  password: string = '';
  errorMessage: string = '';

  constructor(private http: HttpClient, private router: Router) {}

  // Cookie utility functions
  private setCookie(name: string, value: string, days: number = 7): void {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    const expires = `expires=${date.toUTCString()}`;
    document.cookie = `${name}=${value};${expires};path=/`;
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

  private deleteCookie(name: string): void {
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
  }

  onLogin(event?: Event) {
    if (event) {
      event.preventDefault();
    }
    
    // Check if both username and password are entered
    if (!this.username.trim() || !this.password.trim()) {
      this.errorMessage = 'Please enter both username and password';
      return;
    }

    // Clear any previous error messages
    this.errorMessage = '';

    // Send request to server to check if credentials are correct
    this.http.post<any>('http://127.0.0.1:8000/login', {
      username: this.username.trim(),
      password: this.password
    }).subscribe({
      next: (response) => {
        // Extract user data - handle common response formats
        const userData = response.user || 
                        response.data?.user || 
                        (response.user_id || response.username ? {
                          user_id: response.user_id,
                          username: response.username
                        } : null);
        
        // Extract token
        const token = response.token || response.data?.token;
        
        // Save user data and token to cookies
        if (userData) {
          this.setCookie('user', JSON.stringify(userData), 7);
        }
        if (token) {
          this.setCookie('token', token, 7);
        }
        
        // Navigate to home page immediately
        this.router.navigate(['/home']);
      },
      error: (error) => {
        // Handle errors efficiently
        if (error.status === 401 || error.status === 403) {
          this.errorMessage = 'incorrect username or password';
        } else if (error.status === 0) {
          this.errorMessage = 'Cannot connect to server. Please check if the server is running.';
        } else {
          this.errorMessage = 'Login failed. Please try again.';
        }
      }
    });
  }
}
