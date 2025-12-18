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
              ordering: false,
              columnDefs: [
                { className: "dt-head-center", targets: "_all" }   
              ]
            });
            // Join Date Filter
            document.getElementById('dateFilter')?.addEventListener('change', (e) => {
              const value = (e.target as HTMLInputElement).value;

              if (value) {
                const formatted = new Date(value).toLocaleDateString('en-US');
                this.dataTable.column(4).search(formatted).draw();
              } else {
                this.dataTable.column(4).search('').draw();
              }
            });

            // Role Filter
            document.getElementById('roleFilter')?.addEventListener('change', (e) => {
              const value = (e.target as HTMLSelectElement).value;
              this.dataTable.column(5).search(value).draw(); // UPDATE index accordingly
            });

            // Status Filter
            document.getElementById('statusFilter')?.addEventListener('change', (e) => {
              const value = (e.target as HTMLSelectElement).value;
              this.dataTable.column(6).search(value).draw(); // UPDATE index accordingly
            });

          }, 100);
        },
        error: (error) => {
          this.error = `Failed to load users`;
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

  onStatusChange(user: UserItem, newStatus: 'Active' | 'Inactive') {
    this.userService.updateUserStatus(user._id, { status: newStatus }).subscribe({
      next: () => {
        user.status = newStatus;
        user.isActive = newStatus === 'Active';
        this.successMessage = `User "${user.name}" status updated successfully!`;
      }
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
        this.error = `Failed to delete user`;
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
