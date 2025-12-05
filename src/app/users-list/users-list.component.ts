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

  showDeleteModal = false;
  userToDelete: UserItem | null = null;

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

  onRoleChange(user: UserItem): void {
    this.isUpdating = true;
    this.userService.updateUserRole(user._id, { role: user.role }).subscribe({
      next: (response) => {
        const index = this.users.findIndex((u) => u._id === user._id);
        if (index !== -1) {
          this.users[index] = { ...this.users[index], ...response.data };
        }
        this.isUpdating = false;
      },
      error: (error) => {
        // console.error('Error updating user role:', error);
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

    this.userService.updateUserStatus(userId, { status: newStatus }).subscribe({
      next: (response) => {
        // Update the user in the local array
        const index = this.users.findIndex((u) => u._id === userId);
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
        this.isUpdating = false;
        this.error = `Failed to update status: ${error.message || error}`;

        // Revert the UI change if API call failed
        const index = this.users.findIndex((u) => u._id === userId);
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

  onDelete(user: UserItem): void {
    this.userToDelete = user;
    this.showDeleteModal = true;
  }

  closeDeleteModal(): void {
    if (!this.isUpdating) {
      this.showDeleteModal = false;
      this.userToDelete = null;
    }
  }

  confirmDelete(): void {
    if (!this.userToDelete) return;
    
    // Your existing delete logic from onDelete() goes here
    this.isUpdating = true;
    this.successMessage = null;
    this.error = null;

    this.userService.deleteUser(this.userToDelete._id).subscribe({
      next: (response) => {
        this.isUpdating = false;
        this.showDeleteModal = false;

        // Remove the user from the local array immediately
        this.users = this.users.filter((u) => u._id !== this.userToDelete!._id);

        // Update the serial numbers
        this.users.forEach((user, index) => {
          user.srNo = index + 1;
        });

        this.successMessage = `User ${this.userToDelete!.name} has been deleted permanently!`;
        this.userToDelete = null;

        setTimeout(() => {
          this.successMessage = null;
        }, 3000);
      },
      error: (error) => {
        this.isUpdating = false;
        this.error = `Failed to delete user: ${error.message || error}`;
        this.showDeleteModal = false;
        this.userToDelete = null;
      },
    });
  }

  refreshUsers(): void {
    this.loadUsers();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
