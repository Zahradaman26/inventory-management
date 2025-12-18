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
import { takeUntil, finalize } from 'rxjs/operators';

import { PurchaseOrder, PurchaseOrderApiResponse } from '../interfaces/purchase-order.model';
import { PurchaseOrderService } from '../services/purchase-order.service';
import { FormsModule } from '@angular/forms';
import { PurchaseOrderSortableHeader, SortEvent } from './purchase-order-sortable.directive';
import { MatPaginatorModule } from '@angular/material/paginator';
import { VendorService } from '../services/vendors.service';
import { VendorItem } from '../interfaces/vendors.model';

@Component({
  selector: 'app-purchase-orders',
  standalone: true,
  imports: [
    BreadcrumbComponent,
    RouterLink,
    CommonModule,
    PurchaseOrderSortableHeader,
    FormsModule,
    MatPaginatorModule
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './purchase-order.component.html',
  styleUrls: ['./purchase-order.component.css'],
  providers: [DecimalPipe, PurchaseOrderService],
})
export class PurchaseOrderComponent implements OnInit, OnDestroy {
  title = 'Purchase Orders';
  purchaseOrdersList: PurchaseOrder[] = [];
  backupPurchaseOrdersList: PurchaseOrder[] = [];

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

  selectedPurchaseOrders: PurchaseOrder[] = [];
  selectedStatus: string = '';
  selectedPurchaseOrder: PurchaseOrder | null = null;

  showDeleteModal = false;
  purchaseOrderToDelete: PurchaseOrder | null = null;

  vendors: VendorItem[] = [];
  vendorMap = new Map<string, VendorItem>();

  private destroy$ = new Subject<void>();

  @ViewChildren(PurchaseOrderSortableHeader)
  headers!: QueryList<PurchaseOrderSortableHeader>;

  constructor(
    public purchaseOrderService: PurchaseOrderService,
    private vendorService: VendorService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadVendors();
  }

  loadVendors(): void {
    this.vendorService.getAllVendors()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          const vendors = response.data?.vendors || response.data || [];
          this.vendors = vendors;

          vendors.forEach(v => {
            this.vendorMap.set(v._id, v);
          });

          this.fetchPurchaseOrders();
        },
        error: (err) => {
          console.error('Error loading vendors:', err);
          this.fetchPurchaseOrders(); // Still try to fetch POs even if vendors fail
        }
      });
  }

  fetchPurchaseOrders(): void {
    this.isLoading = true;
    this.error = null;

    this.purchaseOrderService
      .getAllPurchaseOrders()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe({
        next: (response: PurchaseOrderApiResponse) => {
          const purchaseOrders = response.data?.purchaseOrders || [];

          // Enhance purchase orders with vendor data
          purchaseOrders.forEach((po: PurchaseOrder) => {
            // Get vendor ID as string
            let vendorId: string;
            
            if (typeof po.vendorId === 'string') {
              vendorId = po.vendorId;
            } else if (po.vendorId && typeof po.vendorId === 'object' && po.vendorId._id) {
              vendorId = po.vendorId._id;
              // If vendorId is already an object with data, keep it
            } else {
              vendorId = '';
            }

            // Enhance with vendor data from map if available
            if (vendorId && this.vendorMap.has(vendorId)) {
              // Create a new vendor object to avoid mutation issues
              po.vendorId = { ...this.vendorMap.get(vendorId)! };
            } else if (typeof po.vendorId === 'string' && this.vendorMap.has(po.vendorId)) {
              // If vendorId is string and exists in map, convert to object
              po.vendorId = { ...this.vendorMap.get(po.vendorId)! };
            }
            // If vendorId is already an object with data, it stays as is
          });

          this.purchaseOrdersList = purchaseOrders;
          this.backupPurchaseOrdersList = purchaseOrders;
          this.totalRecords = purchaseOrders.length;
        },
        error: (err: any) => {
          const errMsg = typeof err === 'string' ? err : err?.toString() || 'Failed to load purchase orders';
          if (errMsg.includes('401')) {
            this.error = 'Authentication required. Please login again.';
            setTimeout(() => this.router.navigate(['/sign-in']), 1200);
          } else {
            this.error = `Failed to load purchase orders: ${errMsg}`;
          }
        },
      });
  }

  onSearch(searchTerm: string): void {
    this.purchaseOrderService.searchTerm = searchTerm;
    this.purchaseOrderService.page = 1;
    this.filterData(this.backupPurchaseOrdersList);
  }

  onPagination(page: number): void {
    this.purchaseOrderService.page = page;
    this.filterData(this.backupPurchaseOrdersList);
  }

  onSort({ column, direction }: SortEvent): void {
    (this.purchaseOrderService as any).sortColumn = column;
    (this.purchaseOrderService as any).sortDirection = direction;
    this.filterData(this.backupPurchaseOrdersList);
  }

  onStatusFilterChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.selectedStatus = target.value;
    this.filterData(this.backupPurchaseOrdersList);
  }

  // Format date as dd-MM-yyyy
  formatDate(date: Date | string | undefined): string {
    if (!date) return 'N/A';
    
    const d = new Date(date);
    if (isNaN(d.getTime())) return 'Invalid Date';
    
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    
    return `${day}-${month}-${year}`;
  }

  // Format currency
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }

  // Get status badge class
  getStatusClass(status: string): string {
    switch (status) {
      case 'draft':
        return 'bg-neutral-200 text-neutral-600';
      case 'pending_approval':
        return 'bg-warning-focus text-warning-600';
      case 'approved':
        return 'bg-primary-focus text-primary-600';
      case 'ordered':
        return 'bg-purple-200 text-purple-600';
      case 'partial_received':
        return 'bg-info-focus text-info-600';
      case 'received':
        return 'bg-success-focus text-success-600';
      case 'cancelled':
        return 'bg-danger-focus text-danger-600';
      case 'rejected':
        return 'bg-red-800 text-white';
      default:
        return 'bg-neutral-200 text-neutral-600';
    }
  }

  // Get status display text
  getStatusText(status: string): string {
    return status
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  // View purchase order details
  viewPurchaseOrder(purchaseOrder: PurchaseOrder): void {
    this.selectedPurchaseOrder = purchaseOrder;
  }

  // Edit purchase order
  editPurchaseOrder(purchaseOrder: PurchaseOrder): void {
    this.router.navigate(['/add-purchase-order', purchaseOrder._id]);
  }

  // Submit for approval
  submitForApproval(purchaseOrder: PurchaseOrder): void {
    if (this.isUpdating) return;
    
    if (!confirm('Are you sure you want to submit this purchase order for approval?')) {
      return;
    }

    this.isUpdating = true;
    this.successMessage = null;
    this.error = null;

    this.purchaseOrderService.submitForApproval(purchaseOrder._id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isUpdating = false;
          this.successMessage = 'Purchase order submitted for approval successfully!';
          
          // Update the purchase order status in all arrays
          const updatePOInArray = (arr: PurchaseOrder[]) => {
            const index = arr.findIndex(p => p._id === purchaseOrder._id);
            if (index !== -1) {
              arr[index].status = 'pending_approval';
            }
          };

          updatePOInArray(this.purchaseOrdersList);
          updatePOInArray(this.backupPurchaseOrdersList);
          
          setTimeout(() => {
            this.successMessage = null;
          }, 3000);
        },
        error: (error) => {
          this.isUpdating = false;
          this.error = `Failed to submit for approval: ${error.message || error}`;
        }
      });
  }

  // Delete purchase order
  deletePurchaseOrder(purchaseOrder: PurchaseOrder): void {
    this.purchaseOrderToDelete = purchaseOrder;
    this.showDeleteModal = true;
  }

  closeDeleteModal(): void {
    if (!this.isUpdating) {
      this.showDeleteModal = false;
      this.purchaseOrderToDelete = null;
    }
  }

  confirmDeletePurchaseOrder(): void {
    if (!this.purchaseOrderToDelete) return;
    
    this.isUpdating = true;
    this.successMessage = null;
    this.error = null;

    this.purchaseOrderService.deletePurchaseOrder(this.purchaseOrderToDelete._id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isUpdating = false;
          this.showDeleteModal = false;
          
          // Remove purchase order from all arrays
          this.purchaseOrdersList = this.purchaseOrdersList.filter(p => p._id !== this.purchaseOrderToDelete!._id);
          this.backupPurchaseOrdersList = this.backupPurchaseOrdersList.filter(p => p._id !== this.purchaseOrderToDelete!._id);
          
          // Update the total records
          this.totalRecords = this.backupPurchaseOrdersList.length;
          this.purchaseOrderService.totalRecords = this.totalRecords;
          
          this.successMessage = `Purchase Order "${this.purchaseOrderToDelete.poNumber}" has been deleted!`;
          this.purchaseOrderToDelete = null;
          
          setTimeout(() => {
            this.successMessage = null;
          }, 3000);
        },
        error: (err: any) => {
          this.isUpdating = false;
          this.showDeleteModal = false;
          this.error = `Failed to delete purchase order: ${err?.toString ? err.toString() : err}`;
          this.purchaseOrderToDelete = null;
        }
      });
  }

  private filterData(data: PurchaseOrder[]): void {
    let filteredData = data || [];

    if (this.selectedStatus) {
      filteredData = filteredData.filter((po: PurchaseOrder) => {
        return po.status === this.selectedStatus;
      });
    }

    this.purchaseOrderService
      ._search(filteredData)
      .subscribe((result) => {
        this.purchaseOrdersList = result.data || [];
        this.totalRecords = result.total || 0;
        this.purchaseOrderService.totalRecords = this.totalRecords;
      });
  }

  refreshPurchaseOrders(): void {
    this.fetchPurchaseOrders();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}