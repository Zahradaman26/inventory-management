import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, of, throwError } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { UserItem, UserApiResponse } from '../interfaces/user.model';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json',
    }),
  };
  private apiUrl = environment.apiUrl;
  private usersSubject = new BehaviorSubject<UserItem[]>([]);
  public users$ = this.usersSubject.asObservable();

  constructor(private http: HttpClient) {}

  // Get all users with pagination and search - UPDATED with data transformation
  getUsers(
    page: number = 1,
    limit: number = 10,
    search: string = ''
  ): Observable<any> {
    // let httpParams = new HttpParams()
    //   .set('page', page.toString())
    //   .set('limit', limit.toString());

    // if (search) {
    //   httpParams = httpParams.set('search', search);
    // }

    return this.http.get<any>(`${this.apiUrl}/users`, this.httpOptions).pipe(
      map((response) => {
        // Transform API response data to match UserItem interface
        let users: UserItem[] = [];

        if (response.success && response.data && Array.isArray(response.data)) {
          users = response.data.users.map((user: any, index: number) =>
            this.transformUserData(user, index)
          );
        } else if (Array.isArray(response.data.users)) {
          users = response.data.users.map((user: any, index: number) =>
            this.transformUserData(user, index)
          );
        } else if (Array.isArray(response)) {
          users = response.map((user: any, index: number) =>
            this.transformUserData(user, index)
          );
        }

        return {
          data: users,
          totalRecords: response.total || users.length,
          status: response.status || 'success',
          success: response.success,
        };
      }),
      tap((response) => {
        this.usersSubject.next(response.data);
      }),
      catchError((error) => {
        return throwError(() => error);
      })
    );
  }

  // Transform API user data to match UserItem interface
  private transformUserData(apiUser: any, index: number): UserItem {
    return {
      srNo: index + 1,
      _id: apiUser._id || { $oid: `temp-${index}` },
      name: name,
      contactNumber: apiUser.contactNumber || apiUser.phone || apiUser.mobile || '',
      role: apiUser.role || 'User',
      status: status,
      department: apiUser.department || '',
      position: apiUser.position || '',
      joinDate: joinDate,
      lastLogin: apiUser.lastLogin ? this.convertToTimestamp(apiUser.lastLogin) : undefined,
      venue: apiUser.venue,
      createdBy: apiUser.createdBy,
      isActive: status === 'Active',
      createdAt: this.convertToTimestamp(apiUser.createdAt),
      updatedAt: this.convertToTimestamp(apiUser.updatedAt),
      imgSrc: apiUser.imgSrc || 'assets/images/user.jpg',
      // Keep original fields
      username: apiUser.username,
    };

    return transformedUser;
  }

  // Helper method to format date
  private formatDate(dateString: string): string {
    if (!dateString) return 'Unknown Date';

    try {
      const date = new Date(dateInput);
      if (isNaN(date.getTime())) {
        console.warn('Invalid date:', dateInput);
        return 'Invalid Date';
      }
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch (e) {
      console.warn('Error formatting date:', dateInput, e);
      return 'Invalid Date';
    }
  }

  // Helper method to convert date to timestamp
  private convertToTimestamp(dateString: string): number {
    if (!dateString) return Date.now();

    try {
      const date = new Date(dateInput);
      return isNaN(date.getTime()) ? Date.now() : date.getTime();
    } catch (e) {
      console.warn('Error converting date to timestamp:', dateInput, e);
      return Date.now();
    }
  }

  // Get user by ID
  getUserById(id: string): Observable<{ data: UserItem; status?: string }> {
    return this.http.get<any>(`${this.apiUrl}/users/${id}`).pipe(
      map((response) => {
        let userData: UserItem;

        if (response.success && response.data) {
          userData = this.transformUserData(response.data, 0);
        } else if (response.data) {
          userData = this.transformUserData(response.data, 0);
        } else {
          userData = this.transformUserData(response, 0);
        }

        return { data: userData, status: response.status || 'success' };
      }),
      catchError(error => throwError(() => this.errorHandler(error)))
    );
  }

  // Update user role - updated with data transformation
  updateUserRole(
    id: string,
    roleData: { role: string }
  ): Observable<{ data: UserItem; status?: string }> {
    return this.http
      .patch<any>(`${this.apiUrl}/users/${id}/role`, roleData)
      .pipe(
        map((response) => {
          let userData: UserItem;

          if (response.success && response.data) {
            userData = this.transformUserData(response.data, 0);
          } else if (response.data) {
            userData = this.transformUserData(response.data, 0);
          } else {
            userData = this.transformUserData(response, 0);
          }

          return { data: userData, status: response.status || 'success' };
        }),
        catchError(this.errorHandler)
      );
  }

  // Update user status - updated with data transformation
  updateUserStatus(
    id: string,
    statusData: { status: 'Active' | 'Inactive' }
  ): Observable<{ data: UserItem; status?: string }> {
    return this.http
      .patch<any>(`${this.apiUrl}/users/${id}/status`, statusData)
      .pipe(
        map((response) => {
          let userData: UserItem;

          if (response.success && response.data) {
            userData = this.transformUserData(response.data, 0);
          } else if (response.data) {
            userData = this.transformUserData(response.data, 0);
          } else {
            userData = this.transformUserData(response, 0);
          }

          return { data: userData, status: response.status || 'success' };
        }),
        catchError(this.errorHandler)
      );
  }

  // Add user
  addUser(userData: any): Observable<UserItem> {
    return this.http.post<any>(this.apiUrl, userData).pipe(
      map((response) => {
        if (response.success && response.data) {
          return response.data;
        }
        throw new Error(response.error || 'Failed to add user');
      }),
      catchError(this.errorHandler)
    );
  }

  // Delete user
  deleteUser(id: string): Observable<{ status: string }> {
    return this.http.delete<any>(`${this.apiUrl}/users/${id}`).pipe(
      map((response) => {
        if (response.success) {
          return { status: 'success' };
        } else {
          return { status: response.status || 'success' };
        }
      }),
      catchError(error => throwError(() => this.errorHandler(error)))
    );
  }

  // Get available roles - extract from users
  getAvailableRoles(): Observable<{ data: any; status?: string }> {
    return new Observable((observer) => {
      this.getUsers(1, 1000).subscribe({
        next: (response) => {
          // Extract unique roles from users
          const uniqueRoles = [
            ...new Set(
              response.data.map((user) => user.role).filter((role) => role)
            ),
          ];
          observer.next({
            data:
              uniqueRoles.length > 0
                ? uniqueRoles
                : ['User', 'Admin', 'Viewer'],
            status: 'success',
          });
          observer.complete();
        },
        error: (error) => {
          console.warn(
            'Could not fetch users to extract roles, using defaults:',
            error
          );
          observer.next({
            data: ['User', 'Admin', 'Viewer'],
            status: 'using_defaults',
          });
          observer.complete();
        },
      });
    });
  }

  // Error handler
  private errorHandler(error: any) {
    console.error('🔥 User Service Error:', error);
    
    let errorMessage = 'An unknown error occurred';

    if (typeof error === 'string') {
      errorMessage = error;
    } else if (error.error instanceof ErrorEvent) {
      errorMessage = `Client error: ${error.error.message}`;
    } else if (error.message) {
      errorMessage = error.message;
    } else if (error.error?.message) {
      errorMessage = error.error.message;
    } else {
      errorMessage = `Server Error: ${error.status || 'Unknown'}`;
    }

    return throwError(() => errorMessage);
  }
}
