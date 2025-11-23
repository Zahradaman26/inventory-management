import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, map, Observable, tap, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { 
  LoginCredentials, 
  LoginResponse, 
  AuthApiResponse,
  UserItem 
} from '../interfaces/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private isAuthenticated = false;
  private currentUser: UserItem | null = null;

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

  getCurrentUser(): UserItem | null {
    return this.currentUser;
  }

  getToken(): string | null {
    return localStorage.getItem('authToken');
  }

  loginUser(userData: LoginCredentials): Observable<LoginResponse> {
    return this.http.post<any>(
      `${environment.apiUrl}/auth/login`, 
      userData
    ).pipe(
      tap(response => {
        console.log('Raw API Response:', response);
      }),
      map(response => {
        // Handle different response structures
        let token: string | null = null;
        let user: UserItem | null = null;

        // Structure 1: { data: { token: '...', user: {...} } }
        if (response.data?.token && response.data?.user) {
          token = response.data.token;
          user = response.data.user;
        } 
        // Structure 2: { data: { access_token: '...', user: {...} } }
        else if (response.data?.access_token && response.data?.user) {
          token = response.data.access_token;
          user = response.data.user;
        }
        // Structure 3: { token: '...', user: {...} } (direct response without data wrapper)
        else if (response.token && response.user) {
          token = response.token;
          user = response.user;
        }
        // Structure 4: { access_token: '...', user: {...} } (direct response without data wrapper)
        else if (response.access_token && response.user) {
          token = response.access_token;
          user = response.user;
        }
        // Structure 5: Direct token and user in response (common structure)
        else if (response.token) {
          token = response.token;
          user = response.user || response.data;
        }
        // Structure 6: Direct access_token and user in response
        else if (response.access_token) {
          token = response.access_token;
          user = response.user || response.data;
        }

        if (token && user) {
          const loginResponse: LoginResponse = {
            token: token,
            user: user,
            status: response.status || 'success'
          };
          return loginResponse;
        } else {
          console.error('Invalid response structure:', response);
          throw new Error(response.message || response.error || 'Invalid response format from server');
        }
      }),
      tap((loginResponse: LoginResponse) => {
        this.handleAuthenticationSuccess(loginResponse);
      }),
      catchError(this.errorHandler)
    );  
  }

  private handleAuthenticationSuccess(loginResponse: LoginResponse): void {
    // Store token and user data
    localStorage.setItem('authToken', loginResponse.token);
    localStorage.setItem('currentUser', JSON.stringify(loginResponse.user));
    this.isAuthenticated = true;
    this.currentUser = loginResponse.user;
    
    // Navigate to home
    this.router.navigate(['/home-10']);
  }

  logout(): void {
    // Optional: Call logout API if needed
    this.http.post(`${environment.apiUrl}/auth/logout`, {}).subscribe({
      next: () => {
        console.log('Logged out successfully from server');
      },
      error: (error) => {
        console.error('Error during server logout:', error);
      },
      complete: () => {
        this.clearLocalStorage();
      }
    });
    
    // Clear local storage immediately for better UX
    this.clearLocalStorage();
  }

  private clearLocalStorage(): void {
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('userPreferences');
    this.isAuthenticated = false;
    this.currentUser = null;
    this.router.navigate(['/sign-in']);
  }

  // Refresh token method (if your API supports it)
  refreshToken(): Observable<LoginResponse> {
    const refreshToken = localStorage.getItem('refreshToken'); // if you store refresh token
    return this.http.post<any>(`${environment.apiUrl}/auth/refresh`, {
      refreshToken: refreshToken
    }).pipe(
      map(response => {
        let token: string | null = null;
        
        // Handle different response structures for refresh token
        if (response.data?.token) {
          token = response.data.token;
        } else if (response.data?.access_token) {
          token = response.data.access_token;
        } else if (response.token) {
          token = response.token;
        } else if (response.access_token) {
          token = response.access_token;
        }

        if (token) {
          localStorage.setItem('authToken', token);
          return {
            token: token,
            user: this.currentUser!
          };
        } else {
          throw new Error('Invalid token in refresh response');
        }
      }),
      catchError(error => {
        this.logout();
        return throwError(() => error);
      })
    );
  }

  // Check if token is valid (simple version)
  isTokenValid(): boolean {
    const token = this.getToken();
    if (!token) return false;

    try {
      // For JWT tokens, decode and check expiration
      if (token.split('.').length === 3) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const currentTime = Date.now() / 1000;
        return payload.exp > currentTime;
      }
      // For non-JWT tokens, we assume they're valid if they exist
      return true;
    } catch (e) {
      console.error('Error decoding token:', e);
      return false;
    }
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
      } else if (error.error) {
        errorMessage = error.error;
      } else if (error.status === 401) {
        errorMessage = 'Invalid email or password';
      } else if (error.status === 403) {
        errorMessage = 'Access denied';
      } else if (error.status === 0) {
        errorMessage = 'Cannot connect to server. Please check your connection.';
      } else if (error.status >= 500) {
        errorMessage = 'Server error. Please try again later.';
      } else {
        errorMessage = `Error: ${error.status}`;
      }
    }
    return throwError(() => new Error(errorMessage));
  }
}