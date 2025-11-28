import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { BreadcrumbComponent } from '../breadcrumb/breadcrumb.component';
import { RouterLink, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import DataTable from 'datatables.net';

// Import services and models
import { UserService } from '../services/user.service';
import { UserItem, UserApiResponse } from '../interfaces/user.model';

@Component({
  selector: 'app-users-list',
  standalone: true,
  imports: [BreadcrumbComponent, CommonModule, FormsModule, RouterModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './users-list.component.html',
  styleUrl: './users-list.component.css',
})
export class UsersListComponent implements OnInit, OnDestroy {
  title = 'Users Lists';
  users: UserItem[] = [];
  roles: string[] = ['user', 'super_admin', 'viewer'];

  // Pagination and filtering
  currentPage = 1;
  itemsPerPage = 10;
  totalItems = 0;
  totalPages = 0;
  searchTerm = '';
  statusFilter = '';

  // Loading states
  isLoading = false;
  isUpdating = false;
  error: string | null = null;
  successMessage: string | null = null;

  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<string>();
  private dataTable: any;
  
  constructor(private userService: UserService, private router: Router) {}

  ngOnInit(): void {
    // Debug: Check authentication status
    const token = localStorage.getItem('authToken');
    this.loadUsers();
  }

  loadUsers(): void {
    this.isLoading = true;
    this.error = null;

    this.userService
      .getUsers(this.currentPage, this.itemsPerPage, this.searchTerm)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: UserApiResponse) => {
          this.users = response.data || [];
          // this.loadAvailableRoles();
          this.totalItems = response.total || this.users.length;
          this.isLoading = false;

          if (this.dataTable) {
            this.dataTable.destroy();
          }

          setTimeout(() => {
            this.dataTable = new DataTable('#dataTable', {
              paging: true,
              searching: true,
              info: true,
            });
          }, 100);
        },
        error: (error) => {
          this.error = `Failed to load users: ${error}`;
          this.isLoading = false;
          this.users = [];
          this.totalItems = 0;
        },
      });
  }

  // loadAvailableRoles(): void {
  //   this.userService
  //     .getAvailableRoles()
  //     .pipe(takeUntil(this.destroy$))
  //     .subscribe({
  //       next: (response) => {
  //         if (response.data && response.data.length > 0) {
  //           this.roles = response.data;
  //         }
  //       },
  //       error: (error) => {
  //         console.warn('Using default roles due to error:', error);
  //       },
  //     });
  // }

  onRoleChange(user: UserItem): void {
    this.isUpdating = true;
    this.userService
      .updateUserRole(user._id, { role: user.role })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          const index = this.users.findIndex(
            (u) => u._id === user._id
          );
          if (index !== -1) {
            this.users[index] = { ...this.users[index], ...response.data };
          }
          this.isUpdating = false;
        },
        error: (error) => {
          console.error('Error updating user role:', error);
          this.isUpdating = false;
        },
      });
  }

  onStatusChange(user: UserItem, newStatus: 'Active' | 'Inactive'): void {
    if (this.isUpdating) return;
    
    const userId = user._id;
    
    if (!userId) {
      this.error = 'User ID is missing. Cannot update status.';
      return;
    }

    this.isUpdating = true;
    this.successMessage = null;
    this.error = null;


    this.userService
      .updateUserStatus(userId, { status: newStatus })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          
          // Update the user in the local array
          const index = this.users.findIndex(u => u._id === userId);
          if (index !== -1) {
            this.users[index].status = newStatus;
            this.users[index].isActive = newStatus === 'Active';
          }
          
          this.isUpdating = false;
          this.successMessage = `${user.name}'s status updated to ${newStatus} successfully!`;
          
          setTimeout(() => {
            this.successMessage = null;
          }, 3000);
        },
        error: (error) => {
          console.error('❌ Error updating user status:', error);
          this.isUpdating = false;
          this.error = `Failed to update status: ${error.message || error}`;
          
          // Revert the UI change if API call failed
          const index = this.users.findIndex(u => u._id === userId);
          if (index !== -1) {
            this.users[index].status = user.status; // Revert to original status
            this.users[index].isActive = user.isActive;
          }
        },
      });
  }

  onEdit(user: UserItem): void {
    this.router.navigate(['/add-user', user._id]);
  }

  onView(user: UserItem): void { }

  onDelete(user: UserItem): void {
    if (confirm(`Are you sure you want to permanently delete ${user.name}? This action cannot be undone.`)) {
      this.isUpdating = true;
      this.successMessage = null;
      this.error = null;

      this.userService
        .deleteUser(user._id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            this.isUpdating = false;
            
            // Remove the user from the local array immediately
            this.users = this.users.filter(u => u._id !== user._id);
            
            // Update the serial numbers
            this.users.forEach((user, index) => {
              user.srNo = index + 1;
            });
            
            this.successMessage = `User ${user.name} has been deleted permanently!`;
            
            setTimeout(() => {
              this.successMessage = null;
            }, 3000);
          },
          error: (error) => {
            console.error('Error deleting user:', error);
            this.isUpdating = false;
            this.error = `Failed to delete user: ${error.message || error}`;
          },
        });
    }
  }

  refreshUsers(): void {
    this.loadUsers();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
