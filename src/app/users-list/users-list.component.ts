import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit, OnDestroy } from '@angular/core';
import { BreadcrumbComponent } from '../breadcrumb/breadcrumb.component';
import { RouterLink, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';

// Import services and models
import { UserService } from '../services/user.service';
import { 
  UserItem, 
  UserApiResponse
} from '../interfaces/user.model';

@Component({
  selector: 'app-users-list',
  standalone: true,
  imports: [BreadcrumbComponent, RouterLink, CommonModule, FormsModule, HttpClientModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './users-list.component.html',
  styleUrl: './users-list.component.css'
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

  constructor(
    private userService: UserService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Debug: Check authentication status
    const token = localStorage.getItem('authToken');
    console.log('🔐 Auth token exists:', !!token);
    
    this.loadUsers();
    
    // Setup search with debounce
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(searchTerm => {
      this.searchTerm = searchTerm;
      this.currentPage = 1;
      this.loadUsers();
    });

    // Load available roles
    this.loadAvailableRoles();
  }

  loadUsers(): void {
    this.isLoading = true;
    this.error = null;
    
    console.log('🔄 Starting to load users...');
    
    this.userService.getUsers(this.currentPage, this.itemsPerPage, this.searchTerm)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: UserApiResponse) => {
          console.log('✅ Users API Response:', response);
          console.log('👥 Users data:', response.data);
          console.log('📊 Users count:', response.data.length);
          
          this.users = response.data || [];
          this.totalItems = response.totalRecords || this.users.length;
          this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
          this.isLoading = false;
          
          console.log('🎯 Final users array:', this.users);
        },
        error: (error) => {
          console.error('❌ Error loading users:', error);
          this.error = `Failed to load users: ${error}`;
          this.isLoading = false;
          this.users = [];
          this.totalItems = 0;
          this.totalPages = 0;
          
          // Redirect to login if unauthorized
          if (error.includes('401')) {
            this.router.navigate(['/sign-in']);
          }
        }
      });
  }

  loadAvailableRoles(): void {
    this.userService.getAvailableRoles()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.data && response.data.length > 0) {
            this.roles = response.data;
            console.log('🎭 Available roles:', this.roles);
          }
        },
        error: (error) => {
          console.warn('Using default roles due to error:', error);
        }
      });
  }

  onSearchChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchSubject.next(target.value);
  }

  onItemsPerPageChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.itemsPerPage = Number(target.value);
    this.currentPage = 1;
    this.loadUsers();
  }

  onStatusFilterChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.statusFilter = target.value;
    this.currentPage = 1;
    this.loadUsers();
  }

  onRoleChange(user: UserItem): void {
    this.isUpdating = true;
    this.userService.updateUserRole(user._id.$oid, { role: user.role })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          const index = this.users.findIndex(u => u._id.$oid === user._id.$oid);
          if (index !== -1) {
            this.users[index] = { ...this.users[index], ...response.data };
          }
          this.isUpdating = false;
        },
        error: (error) => {
          console.error('Error updating user role:', error);
          this.isUpdating = false;
        }
      });
  }

  onStatusChange(user: UserItem, newStatus: 'Active' | 'Inactive'): void {
    this.isUpdating = true;
    this.userService.updateUserStatus(user._id.$oid, { status: newStatus })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          const index = this.users.findIndex(u => u._id.$oid === user._id.$oid);
          if (index !== -1) {
            this.users[index] = { ...this.users[index], ...response.data };
          }
          this.isUpdating = false;
        },
        error: (error) => {
          console.error('Error updating user status:', error);
          this.isUpdating = false;
        }
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
      this.userService.deleteUser(user._id.$oid)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.loadUsers(); // Reload to get updated list
          },
          error: (error) => {
            console.error('Error deleting user:', error);
            this.isUpdating = false;
          }
        });
    }
  }

  // Pagination methods
  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadUsers();
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadUsers();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadUsers();
    }
  }

  get paginationPages(): number[] {
    const pages = [];
    const startPage = Math.max(1, this.currentPage - 2);
    const endPage = Math.min(this.totalPages, this.currentPage + 2);
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  }

  get showingText(): string {
    const start = (this.currentPage - 1) * this.itemsPerPage + 1;
    const end = Math.min(this.currentPage * this.itemsPerPage, this.totalItems);
    return `Showing ${start} to ${end} of ${this.totalItems} entries`;
  }

  refreshUsers(): void {
    this.loadUsers();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}