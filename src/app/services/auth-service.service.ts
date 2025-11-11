import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, map, Observable, retry, tap, throwError } from 'rxjs';
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
    const token = localStorage.getItem('authToken');
    const userData = localStorage.getItem('currentUser');
    this.isAuthenticated = !!token;
    if (userData) {
      this.currentUser = JSON.parse(userData);
    }
  }

  isLoggedIn(): boolean {
    return this.isAuthenticated;
  }

  getCurrentUser(): User | null {
    return this.currentUser;
  }

  loginUser(userData: LoginCredentials): Observable<AuthResponse> {
    return this.http.post<any>(
      `${environment.apiUrl}/auth/login`, 
      userData
    ).pipe(
      map(response => {
        console.log('Raw login response:', response);
        
        // Handle the API response structure
        if (response.success && response.data) {
          const authResponse: AuthResponse = {
            token: response.data.token,
            user: response.data.user
          };
          return authResponse;
        } else {
          throw new Error(response.message || 'Login failed');
        }
      }),
      tap((authResponse: AuthResponse) => {
        if(authResponse.token && authResponse.user) {
          // Store token and user data
          localStorage.setItem('authToken', authResponse.token);
          localStorage.setItem('currentUser', JSON.stringify(authResponse.user));
          this.isAuthenticated = true;
          this.currentUser = authResponse.user;
          
          console.log('Login successful, token stored:', authResponse.token);
          console.log('User data:', authResponse.user);
          
          this.router.navigate(['/home-10']);
        } else {
          throw new Error('Authentication token or user data missing from response');
        }
      }),
      catchError(this.errorHandler)
    );  
  }

  logout(): void {
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    this.isAuthenticated = false;
    this.currentUser = null;
    this.router.navigate(['/sign-in']); 
  }

  errorHandler(error: any) {
    let errorMessage = 'An unknown error occurred!';
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Handle different error response structures
      if (error.error && error.error.message) {
        errorMessage = error.error.message;
      } else if (error.message) {
        errorMessage = error.message;
      } else {
        errorMessage = `Server returned code: ${error.status}`;
      }
    }
    return throwError(() => errorMessage);
  }
}