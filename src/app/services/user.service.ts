import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { UserItem } from '../interfaces/user.model';

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

  // -----------------------------------------
  // GET USERS
  // -----------------------------------------
  getUsers(page: number = 1, limit: number = 10, search: string = ''): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/users`, this.httpOptions).pipe(
      map((response) => {
        let users: UserItem[] = [];

        // Correct structure: response.data.users
        if (response.success && response.data?.users) {
          users = response.data.users.map((user: any, i: number) =>
            this.transformUserData(user, i)
          );
        }

        return {
          data: users,
          totalRecords: response.data?.total || users.length,
          status: response.status || 'success',
          success: response.success,
        };
      }),
      tap((response) => {
        this.usersSubject.next(response.data);
      }),
      catchError((error) => throwError(() => error))
    );
  }

  // -----------------------------------------
  // TRANSFORM USER
  // -----------------------------------------
  private transformUserData(apiUser: any, index: number): UserItem {
    return {
      srNo: index + 1,
      _id: apiUser._id,
      name: apiUser.name,
      contactNumber: apiUser.contactNumber || apiUser.phone || '',
      email: apiUser.email,
      role: apiUser.role || 'user',
      status: apiUser.isActive ? 'Active' : 'Inactive', 
      // department: apiUser.department || '',
      // position: apiUser.position || '',
      joinDate: apiUser.createdAt || new Date().toISOString(), 
      lastLogin: apiUser.lastLogin ? this.convertToTimestamp(apiUser.lastLogin) : undefined,
      venue: apiUser.venue,
      createdBy: apiUser.createdBy,
      isActive: apiUser.isActive || false,
      createdAt: this.convertToTimestamp(apiUser.createdAt),
      updatedAt: this.convertToTimestamp(apiUser.updatedAt),
      imgSrc: apiUser.imgSrc || 'assets/images/user.jpg',
      // username: apiUser.username,
    };
  }

  // -----------------------------------------
  // FORMAT DATE SAFELY
  // -----------------------------------------
  private formatDate(dateString: string): string {
    if (!dateString) return 'Unknown Date';

    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid Date';

      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return 'Invalid Date';
    }
  }

  // -----------------------------------------
  // CONVERT TO TIMESTAMP
  // -----------------------------------------
  private convertToTimestamp(dateString: string): number {
    try {
      const date = new Date(dateString);
      return isNaN(date.getTime()) ? Date.now() : date.getTime();
    } catch {
      return Date.now();
    }
  }

  // -----------------------------------------
  // GET USER BY ID
  // -----------------------------------------
  getUserById(id: string): Observable<{ data: UserItem; status?: string }> {
    return this.http.get<any>(`${this.apiUrl}/users/${id}`).pipe(
      map((response) => {
        const userData = response.data?.user;
        if (!userData) {
          throw new Error('User data not found in response');
        }
        
        return {
          data: this.transformUserData(userData, 0), 
          status: response.status || 'success',
        };
      }),
      catchError(error => throwError(() => this.errorHandler(error)))
    );
  }

  // -----------------------------------------
  // UPDATE USER ROLE
  // -----------------------------------------
  updateUserRole(id: string, roleData: { role: string }): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/users/${id}/role`, roleData).pipe(
      map((response) => ({
        data: this.transformUserData(response.data, 0),
        status: response.status || 'success',
      })),
      catchError((error) => this.errorHandler(error))
    );
  }

  // -----------------------------------------
  // UPDATE USER STATUS
  // -----------------------------------------
  updateUserStatus(id: string, statusData: { status: 'Active' | 'Inactive' }): Observable<any> {
    
     const apiData = {
      isActive: statusData.status === 'Active'
    };
    return this.http.put<any>(`${this.apiUrl}/users/${id}`, statusData).pipe(
      map((response) => {
        return {
          data: this.transformUserData(response.data, 0),
          status: response.status || 'success',
        };
      }),
      catchError((error) => {
        // console.error('🔧 updateUserStatus error:', error);
        return this.errorHandler(error);
      })
    );
  }

  // -----------------------------------------
  // ADD USER
  // -----------------------------------------
  addUser(userData: any): Observable<UserItem> {
    return this.http.post<any>(`${this.apiUrl}/users`, userData).pipe(
      map((response) => {
        if (response.success && response.data) {
          return this.transformUserData(response.data, 0);
        }
        throw new Error(response.error || 'Failed to add user');
      }),
      catchError((error) => this.errorHandler(error))
    );
  }

  // -----------------------------------------
  // DELETE USER
  // -----------------------------------------
  deleteUser(id: string): Observable<{ status: string }> {
    return this.http.delete<any>(`${this.apiUrl}/users/${id}`).pipe(
      map((response) => {
        if (response.success) {
          return { status: 'success' };
        }
        return { status: response.status || 'failed' };
      }),
      catchError((error) => this.errorHandler(error))
    );
  }

  // -----------------------------------------
  // UPDATE USER
  // -----------------------------------------
  updateUser(id: string, userData: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/users/${id}`, userData).pipe(
      map((response) => ({
        data: this.transformUserData(response.data, 0),
        status: response.status || 'success',
      })),
      catchError((error) => this.errorHandler(error))
    );
  }

  // -----------------------------------------
  // ERROR HANDLER
  // -----------------------------------------
  private errorHandler(error: any) {
    // console.error('🔥 User Service Error:', error);
    return throwError(() => error?.message || 'An unknown error occurred');
  }
}

