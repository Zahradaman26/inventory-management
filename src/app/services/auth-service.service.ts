import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, map, Observable, tap, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { LoginCredentials, AuthResponse, User } from '../interfaces/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private isAuthenticated = false;
  private currentUser: User | null = null;

  constructor(
    private router: Router,
    private http: HttpClient
  ) { 
    this.checkAuthenticationStatus();
  }

  private checkAuthenticationStatus(): void {
    const token = localStorage.getItem('authToken');
    const userData = localStorage.getItem('currentUser');
    this.isAuthenticated = !!token;
    if (userData) {
      try {
        this.currentUser = JSON.parse(userData);
      } catch (e) {
        console.error('Error parsing user data:', e);
        this.logout();
      }
    }
  }

  isLoggedIn(): boolean {
    return this.isAuthenticated;
  }

  getCurrentUser(): User | null {
    return this.currentUser;
  }

  getToken(): string | null {
    return localStorage.getItem('authToken');
  }

  loginUser(userData: LoginCredentials): Observable<AuthResponse> {
    return this.http.post<any>(
      `${environment.apiUrl}/auth/login`, 
      userData
    ).pipe(
      tap(response => {
        // console.log('Raw API Response:', response);
      }),
      map(response => {
        // Flexible response handling - adjust based on your API
        let token: string | null = null;
        let user: User | null = null;

        // Try different possible response structures
        if (response.data?.token && response.data?.user) {
          // Structure: { success: true, data: { token: '...', user: {...} } }
          token = response.data.token;
          user = response.data.user;
        } else if (response.token && response.user) {
          // Structure: { token: '...', user: {...} }
          token = response.token;
          user = response.user;
        } else if (response.access_token) {
          // Structure: { access_token: '...', user: {...} }
          token = response.access_token;
          user = response.user;
        } else if (response.data?.access_token) {
          // Structure: { data: { access_token: '...', user: {...} } }
          token = response.data.access_token;
          user = response.data.user;
        }

        if (token && user) {
          const authResponse: AuthResponse = {
            token: token,
            user: user
          };
          return authResponse;
        } else {
          console.error('Invalid response structure:', response);
          throw new Error(response.message || 'Invalid response format from server');
        }
      }),
      tap((authResponse: AuthResponse) => {
        this.handleAuthenticationSuccess(authResponse);
      }),
      catchError(this.errorHandler)
    );  
  }

  private handleAuthenticationSuccess(authResponse: AuthResponse): void {
    // Store token and user data
    localStorage.setItem('authToken', authResponse.token);
    localStorage.setItem('currentUser', JSON.stringify(authResponse.user));
    this.isAuthenticated = true;
    this.currentUser = authResponse.user;
    
    // Navigate to home
    this.router.navigate(['/home-10']);
  }

  logout(): void {
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    this.isAuthenticated = false;
    this.currentUser = null;
    this.router.navigate(['/sign-in']); 
  }

  private errorHandler(error: any) {
    console.error('Auth Service Error:', error);
    
    let errorMessage = 'An unknown error occurred!';
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side error
      if (error.error?.message) {
        errorMessage = error.error.message;
      } else if (error.message) {
        errorMessage = error.message;
      } else if (error.status === 401) {
        errorMessage = 'Invalid email or password';
      } else if (error.status === 0) {
        errorMessage = 'Cannot connect to server. Please check your connection.';
      } else {
        errorMessage = `Server error: ${error.status}`;
      }
    }
    return throwError(() => new Error(errorMessage));
  }
}