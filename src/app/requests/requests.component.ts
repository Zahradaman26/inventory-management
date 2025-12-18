import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  OnInit,
  QueryList,
  ViewChildren,
  OnDestroy,
} from '@angular/core';
import { BreadcrumbComponent } from '../breadcrumb/breadcrumb.component';
import { Router, RouterLink } from '@angular/router';
import { CommonModule, DecimalPipe } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { Request } from '../interfaces/request.model';
import { RequestService } from '../services/requests.service';
import { FormsModule } from '@angular/forms';
import { RequestSortableHeader, SortEvent } from './request-sortable.directive';
import { MatPaginatorModule } from '@angular/material/paginator';
import { finalize } from 'rxjs/operators';
import DataTables from 'datatables.net';
import { VendorService } from '../services/vendors.service'; 

@Component({
  selector: 'app-requests',
  standalone: true,
  imports: [
    BreadcrumbComponent,
    RouterLink,
    CommonModule,
    RequestSortableHeader,
    FormsModule,
    MatPaginatorModule
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './requests.component.html',
  styleUrls: ['./requests.component.css'],
  providers: [DecimalPipe, RequestService],
})
export class RequestsComponent implements OnInit, OnDestroy {
  title = 'Requests List';
  requestsList: any = [];
  backupRequestsList: any = [];

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

  totalRecords: number = 0;
  private dataTable: any;

  selectedRequest: any;
  showDeleteModal = false;
  requestToDelete: Request | null = null;

  // Vendor management
  vendorsList: any[] = [];
  showVendorDropdown: { [key: string]: boolean } = {};
  selectedVendorForRequest: { [key: string]: string } = {};

  private destroy$ = new Subject<void>();

  @ViewChildren(RequestSortableHeader)
  headers!: QueryList<RequestSortableHeader>;

  constructor(
    public requestService: RequestService, 
    private router: Router,
    private vendorService: VendorService // Inject vendor service
  ) {}

  ngOnInit(): void {
    this.fetchRequests();
    this.fetchVendors();
  }

  fetchRequests(): void {
    this.isLoading = true;
    this.error = null;

    this.requestService
      .getAllRequests()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe({
        next: (response) => {
          this.requestsList = response.data.requests || [];
          this.backupRequestsList = response.data.requests || [];

          const total =
            (response && response.totalRecords) ??
            this.backupRequestsList.length;
          this.totalRecords = total;
          this.requestService.totalRecords = total;

          setTimeout(() => {
            this.dataTable = new DataTables('#dataTable', {
              paging: true,
              searching: true,
              info: true,
              ordering: false,
              columnDefs: [
                { className: "dt-head-center", targets: "_all" }   
              ]
            });

            // Status Filter - includes 'draft' status
            document.getElementById('statusFilter')?.addEventListener('change', (e) => {
              const value = (e.target as HTMLSelectElement).value;
              this.dataTable.column(5).search(value).draw();
            });
            
          }, 100);
        },
        error: (err: any) => {
          const errMsg =
            typeof err === 'string'
              ? err
              : err?.toString
              ? err.toString()
              : 'Failed to load requests';
          if (errMsg.includes && errMsg.includes('401')) {
            this.error = 'Authentication required. Please login again.';
            setTimeout(() => this.router.navigate(['/sign-in']), 1200);
          } else {
            this.error = `Failed to load requests: ${errMsg}`;
          }
        },
      });
  }

  fetchVendors(): void {
    // Assuming you have a vendor service with getAllVendors() method
    this.vendorService.getAllVendors().subscribe({
      next: (response) => {
        if (response.data) {
          this.vendorsList = response.data.vendors || response.data || [];
        }
      },
      error: (err) => {
        console.error('Failed to load vendors:', err);
      }
    });
  }

  // Toggle vendor dropdown for a specific request
  toggleVendorDropdown(requestId: string): void {
    this.showVendorDropdown[requestId] = !this.showVendorDropdown[requestId];
    
    // Initialize selected vendor if not set
    if (!this.selectedVendorForRequest[requestId]) {
      this.selectedVendorForRequest[requestId] = '';
    }
  }

  // Assign vendor to request
  assignVendor(request: any): void {
    if (this.isUpdating || request.status !== 'draft') return;

    const requestId = request._id;
    const vendorId = this.selectedVendorForRequest[requestId];

    if (!requestId || !vendorId) {
      this.error = vendorId ? 'Request ID is missing' : 'Please select a vendor';
      return;
    }

    this.isUpdating = true;
    this.successMessage = null;
    this.error = null;

    // First, update the request with vendor and change status
    const updateData = {
      vendorId: vendorId,
      status: 'requested'
    };

    this.requestService
      .updateRequest(requestId, updateData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          // Update the request in all arrays
          const updateRequestInArray = (arr: any[]) => {
            const index = arr.findIndex((r) => r._id === requestId);
            if (index !== -1) {
              arr[index].status = 'requested';
              arr[index].vendorId = { 
                _id: vendorId, 
                name: this.getVendorName(vendorId) 
              };
              arr[index].updatedAt = new Date();
            }
          };

          updateRequestInArray(this.requestsList);
          updateRequestInArray(this.backupRequestsList);

          // Reset dropdown state
          this.showVendorDropdown[requestId] = false;
          this.selectedVendorForRequest[requestId] = '';

          this.isUpdating = false;
          this.successMessage = `Vendor assigned and request "${request.requestNumber}" status updated to Requested!`;

          setTimeout(() => {
            this.successMessage = null;
          }, 3000);
        },
        error: (error) => {
          this.isUpdating = false;
          this.error = `Failed to assign vendor: ${error.message || error}`;
        },
      });
  }

  // Get vendor name by ID
  getVendorName(vendorId: string): string {
    const vendor = this.vendorsList.find(v => v._id === vendorId);
    return vendor ? vendor.name : 'Unknown Vendor';
  }

  // Helper method to get product name from request items
  getMainProductName(request: any): string {
    if (!request || !request.items || !Array.isArray(request.items) || request.items.length === 0) {
      return 'No items';
    }
    
    const firstItem = request.items[0];
    
    if (firstItem.product && firstItem.product.name) {
      return firstItem.product.name;
    } else if (firstItem.productId && firstItem.productId.name) {
      return firstItem.productId.name;
    } else if (firstItem.productName) {
      return firstItem.productName;
    } else if (firstItem.name) {
      return firstItem.name;
    } else {
      return 'Unknown product';
    }
  }

  getTotalRequestedQuantity(request: any): number {
    if (!request || !request.items || !Array.isArray(request.items)) return 0;
    
    return request.items.reduce((sum: number, item: any) => {
      const quantity = item.requestedQuantity || item.quantity || 0;
      return sum + quantity;
    }, 0);
  }

  getItemRequestedQuantity(item: any): number {
    return item.requestedQuantity || item.quantity || 0;
  }

  // Approval button click
  approveRequest(request: any): void {
    if (this.isUpdating || request.status !== 'requested') return;

    const requestId = request._id;

    if (!requestId) {
      this.error = 'Request ID is missing. Cannot approve request.';
      return;
    }

    this.isUpdating = true;
    this.successMessage = null;
    this.error = null;

    this.requestService
      .approveRequest(requestId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          const updateRequestInArray = (arr: any[]) => {
            const index = arr.findIndex((r) => r._id === requestId);
            if (index !== -1) {
              arr[index].status = 'approved';
              arr[index].updatedAt = new Date();
            }
          };

          updateRequestInArray(this.requestsList);
          updateRequestInArray(this.backupRequestsList);

          this.isUpdating = false;
          this.successMessage = `Request "${request.requestNumber}" has been approved successfully!`;

          setTimeout(() => {
            this.successMessage = null;
          }, 3000);
        },
        error: (error) => {
          this.isUpdating = false;
          this.error = `Failed to approve request: ${error.message || error}`;
        },
      });
  }

  // Reject button click
  rejectRequest(request: any): void {
    if (this.isUpdating || request.status !== 'requested') return;

    const requestId = request._id;

    if (!requestId) {
      this.error = 'Request ID is missing. Cannot reject request.';
      return;
    }

    this.isUpdating = true;
    this.successMessage = null;
    this.error = null;

    this.requestService
      .rejectRequest(requestId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          const updateRequestInArray = (arr: any[]) => {
            const index = arr.findIndex((r) => r._id === requestId);
            if (index !== -1) {
              arr[index].status = 'rejected';
              arr[index].updatedAt = new Date();
            }
          };

          updateRequestInArray(this.requestsList);
          updateRequestInArray(this.backupRequestsList);

          this.isUpdating = false;
          this.successMessage = `Request "${request.requestNumber}" has been rejected.`;

          setTimeout(() => {
            this.successMessage = null;
          }, 3000);
        },
        error: (error) => {
          this.isUpdating = false;
          this.error = `Failed to reject request: ${error.message || error}`;
        },
      });
  }

  // Complete button click
  completeRequest(request: any): void {
    if (this.isUpdating || request.status !== 'approved') return;

    const requestId = request._id;

    if (!requestId) {
      this.error = 'Request ID is missing. Cannot complete request.';
      return;
    }

    this.isUpdating = true;
    this.successMessage = null;
    this.error = null;

    this.requestService
      .completeRequest(requestId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          const updateRequestInArray = (arr: any[]) => {
            const index = arr.findIndex((r) => r._id === requestId);
            if (index !== -1) {
              arr[index].status = 'completed';
              arr[index].updatedAt = new Date();
            }
          };

          updateRequestInArray(this.requestsList);
          updateRequestInArray(this.backupRequestsList);

          this.isUpdating = false;
          this.successMessage = `Request "${request.requestNumber}" has been marked as completed!`;

          setTimeout(() => {
            this.successMessage = null;
          }, 3000);
        },
        error: (error) => {
          this.isUpdating = false;
          this.error = `Failed to complete request: ${error.message || error}`;
        },
      });
  }

  getStatusLabel(status: string): string {
    const statusMap: {[key: string]: string} = {
      'draft': 'Draft',
      'requested': 'Requested',
      'approved': 'Approved',
      'completed': 'Completed',
      'rejected': 'Rejected',
      'cancelled': 'Cancelled'
    };
    return statusMap[status] || status;
  }

  getStatusClass(status: string): string {
    const statusClasses: {[key: string]: string} = {
      'draft': 'bg-secondary-focus text-secondary-600 border border-secondary-main cursor-pointer',
      'requested': 'bg-warning-focus text-warning-600 border border-warning-main cursor-pointer',
      'approved': 'bg-info-focus text-info-600 border border-info-main cursor-pointer',
      'completed': 'bg-success-focus text-success-600 border border-success-main cursor-pointer',
      'rejected': 'bg-danger-focus text-danger-600 border border-danger-main cursor-pointer',
      'cancelled': 'bg-neutral-200 text-neutral-600 border border-neutral-400 cursor-pointer'
    };
    return statusClasses[status] || 'bg-neutral-200 text-neutral-600 border border-neutral-400 cursor-pointer';
  }

  viewRequest(request: any): void {
    this.selectedRequest = request;
  }

  editRequest(request: Request): void {
    this.router.navigate(['/add-request', request._id]);
  }

  deleteRequest(request: any): void {
    this.requestToDelete = request;
    this.showDeleteModal = true;
  }

  closeDeleteModal(): void {
    if (!this.isUpdating) {
      this.showDeleteModal = false;
      this.requestToDelete = null;
    }
  }

  confirmDeleteRequest(): void {
    if (!this.requestToDelete) return;
    
    const requestId = this.requestToDelete._id;
    
    this.isUpdating = true;
    this.successMessage = null;
    this.error = null;

    this.requestService.deleteRequest(requestId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isUpdating = false;
          this.showDeleteModal = false;
          
          this.requestsList = this.requestsList.filter((r: any) => r._id !== requestId);
          this.backupRequestsList = this.backupRequestsList.filter((r: any) => r._id !== requestId);
          
          this.totalRecords = this.backupRequestsList.length;
          this.requestService.totalRecords = this.totalRecords;
          
          this.successMessage = `Request "${this.requestToDelete?.requestNumber}" has been deleted!`;
          this.requestToDelete = null;
          
          setTimeout(() => {
            this.successMessage = null;
          }, 3000);
        },
        error: (err: any) => {
          this.isUpdating = false;
          this.showDeleteModal = false;
          this.error = `Failed to delete request: ${err?.toString ? err.toString() : err}`;
          this.requestToDelete = null;
        }
      });
  }

  refreshRequests(): void {
    this.fetchRequests();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}