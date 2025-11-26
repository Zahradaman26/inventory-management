import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  OnInit,
  OnDestroy,
  AfterViewInit,
} from '@angular/core';
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
  roles: string[] = ['User', 'Admin', 'Viewer'];

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
      .updateUserRole(user._id.$oid, { role: user.role })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          const index = this.users.findIndex(
            (u) => u._id.$oid === user._id.$oid
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
    this.isUpdating = true;
    this.userService
      .updateUserStatus(user._id.$oid, { status: newStatus })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          const index = this.users.findIndex(
            (u) => u._id.$oid === user._id.$oid
          );
          if (index !== -1) {
            this.users[index] = { ...this.users[index], ...response.data };
          }
          this.isUpdating = false;
        },
        error: (error) => {
          console.error('Error updating user status:', error);
          this.isUpdating = false;
        },
      });
  }

  onEdit(user: UserItem): void {
    console.log('Edit user:', user);
  }

  onView(user: UserItem): void {
    console.log('View user:', user);
  }

  onDelete(user: UserItem): void {
    if (confirm(`Are you sure you want to delete ${user.name}?`)) {
      this.isUpdating = true;
      this.userService
        .deleteUser(user._id.$oid)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.loadUsers(); // Reload to get updated list
          },
          error: (error) => {
            console.error('Error deleting user:', error);
            this.isUpdating = false;
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
