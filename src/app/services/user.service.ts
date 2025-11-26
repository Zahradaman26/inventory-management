import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, of, throwError } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { 
  UserItem, 
  UserApiResponse
} from '../interfaces/user.model';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = environment.apiUrl;
  private usersSubject = new BehaviorSubject<UserItem[]>([]);
  public users$ = this.usersSubject.asObservable();

  constructor(private http: HttpClient) { }

  // Get all users with pagination and search - FIXED for object data structure
  getUsers(page: number = 1, limit: number = 10, search: string = '', status: string = ''): Observable<UserApiResponse> {
    
    let httpParams = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    if (search) {
      httpParams = httpParams.set('search', search);
    }

    if (status) {
      if (status === 'Active') {
        httpParams = httpParams.set('isActive', 'true');
      } else if (status === 'Inactive') {
        httpParams = httpParams.set('isActive', 'false');
      }
    }
    return this.http.get<any>(`${this.apiUrl}/users`, { params: httpParams })
      .pipe(
        tap(rawResponse => console.log('📨 Raw API Response:', rawResponse)), // Debug log
        map(response => {
          
          let users: UserItem[] = [];
          let totalRecords = 0;

          // Handle the response structure: {success: true, data: {users: [], total: X, page: X}}
          if (response.success && response.data) {
            
            // Check if data contains users array
            if (response.data.users && Array.isArray(response.data.users)) {
              users = response.data.users.map((user: any, index: number) => this.transformUserData(user, index));
              totalRecords = response.data.total || response.data.totalRecords || response.data.totalCount || users.length;
            }
            // Check if data is directly the array (fallback)
            else if (Array.isArray(response.data)) {
              users = response.data.map((user: any, index: number) => this.transformUserData(user, index));
              totalRecords = response.totalRecords || response.total || users.length;
            }
            // Check for other possible array properties
            else if (response.data.data && Array.isArray(response.data.data)) {
              users = response.data.data.map((user: any, index: number) => this.transformUserData(user, index));
              totalRecords = response.data.total || response.data.totalRecords || users.length;
            }
            // Check for items array
            else if (response.data.items && Array.isArray(response.data.items)) {
              users = response.data.items.map((user: any, index: number) => this.transformUserData(user, index));
              totalRecords = response.data.total || response.data.totalRecords || users.length;
            }
            else {
              console.warn('⚠️ Could not find users array in data object. Data structure:', response.data);
              // Try to extract any array from the data object
              const dataObj = response.data;
              for (const key in dataObj) {
                if (Array.isArray(dataObj[key])) {
                  users = dataObj[key].map((user: any, index: number) => this.transformUserData(user, index));
                  totalRecords = dataObj.total || dataObj.totalRecords || users.length;
                  break;
                }
              }
              
              if (users.length === 0) {
                console.warn('⚠️ No array found in data object, using empty array');
                users = [];
                totalRecords = 0;
              }
            }
          } 
          else if (Array.isArray(response)) {
            users = response.map((user: any, index: number) => this.transformUserData(user, index));
            totalRecords = users.length;
          }
          else {
            console.warn('⚠️ Unexpected response structure, using empty array');
            users = [];
            totalRecords = 0;
          }
          return {
            data: users,
            totalRecords: totalRecords,
            status: response.status || 'success',
            success: response.success !== undefined ? response.success : true
          };
        }),
        tap(response => {
          this.usersSubject.next(response.data);
        }),
        catchError(error => {
          console.error('❌ Error fetching users:', error);
          return throwError(() => this.errorHandler(error));
        })
      );
  }

  // Transform API user data to match UserItem interface
  private transformUserData(apiUser: any, index: number): UserItem {

    // Determine status - handle both 'status' and 'isActive' fields
    let status: 'Active' | 'Inactive' = 'Active';
    if (apiUser.status === 'Inactive' || apiUser.status === 'inactive') {
      status = 'Inactive';
    } else if (apiUser.isActive === false) {
      status = 'Inactive';
    }

    // Determine join date - try multiple possible fields
    let joinDate = 'Unknown Date';
    if (apiUser.joinDate) {
      joinDate = this.formatDate(apiUser.joinDate);
    } else if (apiUser.createdAt) {
      joinDate = this.formatDate(apiUser.createdAt);
    } else if (apiUser.dateJoined) {
      joinDate = this.formatDate(apiUser.dateJoined);
    }

    // Determine name - try multiple possible fields
    const name = apiUser.name || apiUser.username || apiUser.fullName || 'Unknown User';

    const transformedUser: UserItem = {
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
      imgSrc: apiUser.imgSrc || apiUser.avatar || apiUser.profilePicture || 'assets/images/user-list/user-default.png',
      username: apiUser.username
    };

    return transformedUser;
  }

  // Helper method to format date
  private formatDate(dateInput: any): string {
    if (!dateInput) return 'Unknown Date';
    
    try {
      const date = new Date(dateInput);
      if (isNaN(date.getTime())) {
        console.warn('Invalid date:', dateInput);
        return 'Invalid Date';
      }
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (e) {
      console.warn('Error formatting date:', dateInput, e);
      return 'Invalid Date';
    }
  }

  // Helper method to convert date to timestamp
  private convertToTimestamp(dateInput: any): number {
    if (!dateInput) return Date.now();
    
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
      map(response => {
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

  // Update user role
  updateUserRole(id: string, roleData: { role: string }): Observable<{ data: UserItem; status?: string }> {
    return this.http.patch<any>(`${this.apiUrl}/users/${id}/role`, roleData).pipe(
      map(response => {
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

  // Update user status
  updateUserStatus(id: string, statusData: { status: 'Active' | 'Inactive' }): Observable<{ data: UserItem; status?: string }> {
    // Convert status to isActive for API if needed
    const apiData = {
      isActive: statusData.status === 'Active',
      status: statusData.status
    };

    return this.http.patch<any>(`${this.apiUrl}/users/${id}/status`, apiData).pipe(
      map(response => {
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

  // Add user
  addUser(userData: any): Observable<UserItem> {
    return this.http.post<any>(`${this.apiUrl}/users`, userData).pipe(
      map(response => {
        if (response.success && response.data) {
          return this.transformUserData(response.data, 0);
        }
        throw new Error(response.error || 'Failed to add user');
      }),
      catchError(error => throwError(() => this.errorHandler(error)))
    );
  }

  // Delete user
  deleteUser(id: string): Observable<{ status: string }> {
    return this.http.delete<any>(`${this.apiUrl}/users/${id}`).pipe(
      map(response => {
        if (response.success) {
          return { status: 'success' };
        } else {
          return { status: response.status || 'success' };
        }
      }),
      catchError(error => throwError(() => this.errorHandler(error)))
    );
  }

  // Get available roles - IMPROVED with fallback
  getAvailableRoles(): Observable<{ data: string[]; status?: string }> {
    return new Observable(observer => {
      this.getUsers(1, 50).subscribe({
        next: (response) => {
          // Extract unique roles from users
          const uniqueRoles = [...new Set(response.data.map(user => user.role).filter(role => role && role.trim() !== ''))];
          
          const finalRoles = uniqueRoles.length > 0 ? uniqueRoles : ['User', 'Admin', 'Viewer', 'Manager'];
          
          observer.next({
            data: finalRoles,
            status: 'success'
          });
          observer.complete();
        },
        error: (error) => {
          console.warn('Could not fetch users to extract roles, using defaults:', error);
          observer.next({
            data: ['User', 'Admin', 'Viewer', 'Manager'],
            status: 'using_defaults'
          });
          observer.complete();
        }
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
    } else if (error.status === 401) {
      errorMessage = 'Authentication failed. Please login again.';
    } else if (error.status === 403) {
      errorMessage = 'You do not have permission to access users.';
    } else if (error.status === 404) {
      errorMessage = 'Users endpoint not found.';
    } else if (error.status) {
      errorMessage = `Server Error: ${error.status}`;
    }
    
    return errorMessage;
  }
}