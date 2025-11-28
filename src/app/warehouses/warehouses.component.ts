import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit, OnDestroy } from '@angular/core';
import { BreadcrumbComponent } from '../breadcrumb/breadcrumb.component';
import { RouterLink, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';
import DataTable from 'datatables.net';

// Import services and models
import { WarehouseService } from '../services/warehouse.service';
import { WarehouseItem, WarehouseApiResponse } from '../interfaces/warehouse.model';

@Component({
  selector: 'app-warehouse-list',
  standalone: true,
  imports: [BreadcrumbComponent, CommonModule, FormsModule, RouterModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './warehouses.component.html',
  styleUrl: './warehouses.component.css',
})
export class WarehousesComponent implements OnInit, OnDestroy {
  title = 'Warehouse Lists';
  warehouses: WarehouseItem[] = [];
  backupWarehouses: WarehouseItem[] = []; // ADD THIS LINE - same as products
  warehouseTypes: string[] = ['main', 'regional', 'distribution', 'storage'];

  // Loading states
  isLoading = false;
  isUpdating = false;
  error: string | null = null;
  successMessage: string | null = null;

  // Pagination and filtering
  currentPage = 1;
  itemsPerPage = 10;
  totalItems = 0;
  totalPages = 0;
  searchTerm = '';
  statusFilter = '';

  private destroy$ = new Subject<void>();
  private dataTable: any;
  
  constructor(private warehouseService: WarehouseService, private router: Router) {}

  ngOnInit(): void {
    this.loadWarehouses();
  }

  loadWarehouses(): void {
    this.isLoading = true;
    this.error = null;

    this.warehouseService
      .getWarehouses(this.currentPage, this.itemsPerPage, this.searchTerm)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => { this.isLoading = false; }) // ADD THIS LINE - same as products
      )
      .subscribe({
        next: (response: WarehouseApiResponse) => {
          this.warehouses = response.data || [];
          this.backupWarehouses = response.data || []; // ADD THIS LINE - same as products
          this.totalItems = response.total || this.warehouses.length;
          
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
          this.error = `Failed to load warehouses: ${error}`;
          this.isLoading = false;
          this.warehouses = [];
          this.backupWarehouses = []; // ADD THIS LINE
          this.totalItems = 0;
        },
      });
  }

  // REPLACE THE ENTIRE onStatusChange METHOD WITH THIS:
  updateStatus(warehouse: WarehouseItem): void { // CHANGE METHOD NAME to updateStatus
    if (this.isUpdating) return;
    
    const warehouseId = warehouse._id;
    
    if (!warehouseId) {
      this.error = 'Warehouse ID is missing. Cannot update status.';
      return;
    }

    const newStatus = !warehouse.isActive;
    
    this.isUpdating = true;
    this.successMessage = null;
    this.error = null;

    this.warehouseService.updateWarehouseStatus(warehouseId, newStatus) // CHANGE THIS CALL
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          // Update the warehouse in all arrays (same as products pattern)
          const updateWarehouseInArray = (arr: WarehouseItem[]) => {
            const index = arr.findIndex(w => w._id === warehouseId);
            if (index !== -1) {
              arr[index].isActive = newStatus;
              // arr[index].status = newStatus ? 'Active' : 'Inactive';
            }
          };

          updateWarehouseInArray(this.warehouses);
          updateWarehouseInArray(this.backupWarehouses); // ADD THIS LINE
          
          this.isUpdating = false;
          this.successMessage = `Warehouse "${warehouse.name}" status updated to ${newStatus ? 'Active' : 'Inactive'} successfully!`; // SAME MESSAGE FORMAT
          
          setTimeout(() => {
            this.successMessage = null;
          }, 3000);
        },
        error: (error) => {
          // console.error('❌ Error updating warehouse status:', error);
          this.isUpdating = false;
          this.error = `Failed to update status: ${error}`; // REMOVE .message
          
          // Revert the UI change if API call failed (same as products pattern)
          const revertWarehouseInArray = (arr: WarehouseItem[]) => {
            const index = arr.findIndex(w => w._id === warehouseId);
            if (index !== -1) {
              arr[index].isActive = warehouse.isActive; // Revert to original status
              // arr[index].status = warehouse.status;
            }
          };

          revertWarehouseInArray(this.warehouses);
          revertWarehouseInArray(this.backupWarehouses); // ADD THIS LINE
        },
      });
  }

  onEdit(warehouse: WarehouseItem): void {
    this.router.navigate(['/add-warehouse', warehouse._id]);
  }

  onView(warehouse: WarehouseItem): void {
    
  }

  onDelete(warehouse: WarehouseItem): void {
    if (confirm(`Are you sure you want to permanently delete "${warehouse.name}"? This action cannot be undone.`)) { // ADD QUOTES like products
      this.isUpdating = true;
      this.successMessage = null;
      this.error = null;

      this.warehouseService
        .deleteWarehouse(warehouse._id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            this.isUpdating = false;
            
            // Remove from both arrays (same as products)
            this.warehouses = this.warehouses.filter(w => w._id !== warehouse._id);
            this.backupWarehouses = this.backupWarehouses.filter(w => w._id !== warehouse._id); // ADD THIS LINE
            
            this.successMessage = `Warehouse "${warehouse.name}" has been deleted permanently!`; // ADD QUOTES
            
            setTimeout(() => {
              this.successMessage = null;
            }, 3000);
          },
          error: (error) => {
            // console.error('Error deleting warehouse:', error);
            this.isUpdating = false;
            this.error = `Failed to delete warehouse: ${error}`; // REMOVE .message
          },
        });
    }
  }

  refreshWarehouses(): void {
    this.loadWarehouses();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}