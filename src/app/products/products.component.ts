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

import { ProductItem, SearchResult } from '../interfaces/product.model';
import { ProductService } from '../services/product.service';
import { FormsModule } from '@angular/forms';
import { ProductSortableHeader, SortEvent } from './product-sortable.directive';
import { MatPaginatorModule } from '@angular/material/paginator';
import { finalize } from 'rxjs/operators';
import DataTables from 'datatables.net';
import { WarehouseService } from '../services/warehouse.service';
import { WarehouseItem } from '../interfaces/warehouse.model';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [
    BreadcrumbComponent,
    RouterLink,
    CommonModule,
    ProductSortableHeader,
    FormsModule,
    MatPaginatorModule
],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.css'],
  providers: [DecimalPipe, ProductService],
})
export class ProductsComponent implements OnInit, OnDestroy {
  title = 'Products List';
  productsList: any = [];
  backupProductsList: any = [];

  // Pagination and filtering
  currentPage = 1;
  itemsPerPage = 10;
  totalItems = 0;
  totalPages = 0;
  searchTerm = '';
  statusFilter = '';

  // Loading states (matching users pattern)
  isLoading = false;
  isUpdating = false;
  error: string | null = null;
  successMessage: string | null = null;

  totalRecords: number = 0;
  private dataTable: any;

  selectedProducts: any = [];
  selectedStatus: string = '';
  selectedProduct: any;

  showDeleteModal = false;
  productToDelete: ProductItem | null = null;

  private destroy$ = new Subject<void>();

  warehouses: WarehouseItem[] = [];
  warehouseMap = new Map<string, WarehouseItem>();

  @ViewChildren(ProductSortableHeader)
  headers!: QueryList<ProductSortableHeader>;

  constructor(
    public productService: ProductService,
    private warehouseService: WarehouseService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadWarehouses();
  }

  loadWarehouses(): void {
    this.warehouseService.getActiveWarehouses()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (warehouses) => {
          this.warehouses = warehouses;

          warehouses.forEach(w => {
            this.warehouseMap.set(w._id, w);
          });

          this.fetchProducts(); 
        }
      });
  }


  fetchProducts(): void {
    this.isLoading = true;
    this.error = null;

    this.productService
      .getAllProducts()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe({
        next: (response) => {
          const products = response.data.products || [];

          products.forEach((product: any) => {
            const warehouseId =
              product.warehouseId?.$oid ??
              product.warehouseId ??
              null;

            if (warehouseId && this.warehouseMap.has(warehouseId)) {
              product.warehouse = this.warehouseMap.get(warehouseId);
            }
          });

          this.productsList = products;
          this.backupProductsList = products;
        },
        error: (err: any) => {
          // console.error('Error loading products:', err);
          const errMsg =
            typeof err === 'string'
              ? err
              : err?.toString
              ? err.toString()
              : 'Failed to load products';
          if (errMsg.includes && errMsg.includes('401')) {
            this.error = 'Authentication required. Please login again.';
            setTimeout(() => this.router.navigate(['/sign-in']), 1200);
          } else {
            this.error = `Failed to load products: ${errMsg}`;
          }
        },
      });
  }

  onSearchProduct(searchTerm: string): void {
    this.productService.searchTerm = searchTerm;
    this.productService.page = 1;
    this.filterData(this.backupProductsList);
  }

  onPagination(page: number): void {
    this.productService.page = page;
    this.filterData(this.backupProductsList);
  }

  onSort({ column, direction }: SortEvent): void {
    (this.productService as any).sortColumn = column;
    (this.productService as any).sortDirection = direction;
    this.filterData(this.backupProductsList);
  }

  updateStatus(product: any): void {
    if (this.isUpdating) return;

    const productId = product._id?.$oid ?? (product as any)._id ?? '';

    if (!productId) {
      this.error = 'Product ID is missing. Cannot update status.';
      return;
    }

    const newStatus = !product.isActive;

    this.isUpdating = true;
    this.successMessage = null;
    this.error = null;

    this.productService
      .updateProductStatus(productId, newStatus)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          // Update the product in all arrays
          const updateProductInArray = (arr: any[]) => {
            const index = arr.findIndex(
              (p) => (p._id?.$oid ?? (p as any)._id) === productId
            );
            if (index !== -1) {
              arr[index].isActive = newStatus;
            }
          };

          updateProductInArray(this.productsList);
          updateProductInArray(this.backupProductsList);
          updateProductInArray(this.selectedProducts);

          this.isUpdating = false;
          this.successMessage = `Product "${product.name}" status updated to ${
            newStatus ? 'Active' : 'Inactive'
          } successfully!`;

          setTimeout(() => {
            this.successMessage = null;
          }, 3000);
        },
        error: (error) => {
          // console.error('❌ Error updating product status:', error);
          this.isUpdating = false;
          this.error = `Failed to update status: ${error.message || error}`;

          // Revert the UI change if API call failed
          const revertProductInArray = (arr: any[]) => {
            const index = arr.findIndex(
              (p) => (p._id?.$oid ?? (p as any)._id) === productId
            );
            if (index !== -1) {
              arr[index].isActive = product.isActive; // Revert to original status
            }
          };

          revertProductInArray(this.productsList);
          revertProductInArray(this.backupProductsList);
          revertProductInArray(this.selectedProducts);
        },
      });
  }

  toggleProductSelection(product: any): void {
    const id = product._id?.$oid ?? (product as any)._id;
    const index = this.selectedProducts.findIndex(
      (p) => (p._id?.$oid ?? (p as any)._id) === id
    );
    if (index > -1) {
      this.selectedProducts.splice(index, 1);
    } else {
      this.selectedProducts.push(product);
    }
  }

  isSelected(product: any): boolean {
    return this.selectedProducts.some(
      (p) =>
        (p._id?.$oid ?? (p as any)._id) ===
        (product._id?.$oid ?? (product as any)._id)
    );
  }

  toggleSelectAll(event: any): void {
    if (event.target.checked) {
      this.selectedProducts = [...this.productsList];
    } else {
      this.selectedProducts = [];
    }
  }

  isAllSelected(): boolean {
    return (
      this.selectedProducts.length === this.productsList.length &&
      this.productsList.length > 0
    );
  }

  viewProduct(product: any): void {
    this.selectedProduct = product;
  }

  editProduct(product: ProductItem): void {
    this.router.navigate(['/add-product', product._id]);
  }

  // Helper to get warehouse name
  getWarehouseName(product: any): string {
    if (!product) return 'N/A';
    if (product.warehouse && product.warehouse.name) {
      return product.warehouse.name;
    }
    if (product.warehouseId && typeof product.warehouseId === 'object') {
      return product.warehouseId.name || 'N/A';
    }
    return 'N/A';
  }

  // Helper to get warehouse location
  getWarehouseLocation(product: any): string {
    if (!product) return '';
    const warehouse = product.warehouse || product.warehouseId;
    if (!warehouse || typeof warehouse !== 'object') return '';
    
    const location = warehouse.location;
    if (!location) return '';
    
    const parts = [];
    if (location.city) parts.push(location.city);
    if (location.state) parts.push(location.state);
    
    return parts.join(', ');
  }

  // Helper to extract warehouse ID for forms
  getWarehouseId(product: any): string {
    if (!product || !product.warehouseId) return '';
    
    if (typeof product.warehouseId === 'string') {
      return product.warehouseId;
    }
    
    if (product.warehouseId.$oid) {
      return product.warehouseId.$oid;
    }
    
    if (product.warehouseId._id) {
      return product.warehouseId._id.$oid || product.warehouseId._id;
    }
    return '';
  }

  // Enhanced delete functionality matching users pattern
  deleteProduct(product: any): void {
    this.productToDelete = product;
    this.showDeleteModal = true;
  }

  closeDeleteModal(): void {
    if (!this.isUpdating) {
      this.showDeleteModal = false;
      this.productToDelete = null;
    }
  }

  confirmDeleteProduct(): void {
    if (!this.productToDelete) return;
    
    const productId = this.productToDelete._id;
    
    this.isUpdating = true;
    this.successMessage = null;
    this.error = null;

    this.productService.deleteProduct(productId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isUpdating = false;
          this.showDeleteModal = false;
          
          // Remove product from all arrays immediately
          this.productsList = this.productsList.filter((p: any) => p._id !== productId);
          this.backupProductsList = this.backupProductsList.filter((p: any) => p._id !== productId);
          this.selectedProducts = this.selectedProducts.filter((p: any) => p._id !== productId);
          
          // Update the total records
          this.totalRecords = this.backupProductsList.length;
          this.productService.totalRecords = this.totalRecords;
          
          this.successMessage = `Product "${this.productToDelete.name}" has been deleted permanently!`;
          this.productToDelete = null;
          
          setTimeout(() => {
            this.successMessage = null;
          }, 3000);
        },
        error: (err: any) => {
          this.isUpdating = false;
          this.showDeleteModal = false;
          this.error = `Failed to delete product: ${err?.toString ? err.toString() : err}`;
          this.productToDelete = null;
        }
      });
  }

  // deleteSelectedProducts(): void {
  //   if (this.selectedProducts.length === 0) return;

  //   if (
  //     !confirm(
  //       `Are you sure you want to permanently delete ${this.selectedProducts.length} products? This action cannot be undone.`
  //     )
  //   )
  //     return;

  //   const productIds = this.selectedProducts.map(
  //     (p: any) => p._id?.$oid ?? (p as any)._id
  //   );

  //   this.isUpdating = true;
  //   this.successMessage = null;
  //   this.error = null;

  //   this.productService
  //     .deleteMultipleProducts(productIds)
  //     .pipe(takeUntil(this.destroy$))
  //     .subscribe({
  //       next: (response) => {
  //         this.isUpdating = false;

  //         // Remove all selected products from arrays
  //         this.backupProductsList = this.backupProductsList.filter(
  //           (p: any) => !productIds.includes(p._id?.$oid ?? (p as any)._id)
  //         );
  //         this.filterData(this.backupProductsList);
  //         this.selectedProducts = [];

  //         // Update the total records
  //         this.totalRecords = this.backupProductsList.length;
  //         this.productService.totalRecords = this.totalRecords;

  //         this.successMessage = `${productIds.length} products have been deleted permanently!`;

  //         setTimeout(() => {
  //           this.successMessage = null;
  //         }, 3000);
  //       },
  //       error: (err: any) => {
  //         // console.error('Error deleting products:', err);
  //         this.isUpdating = false;
  //         this.error = `Failed to delete products: ${
  //           err?.toString ? err.toString() : err
  //         }`;
  //       },
  //     });
  // }

  onStatusFilterChange(status: string): void {
    this.selectedStatus = status;
    this.filterData(this.backupProductsList);
  }

  private filterData(data: any): void {
    let filteredData = data || [];

    if (this.selectedStatus) {
      filteredData = filteredData.filter((product: any) => {
        if (this.selectedStatus === 'active') return product.isActive;
        if (this.selectedStatus === 'inactive') return !product.isActive;
        return true;
      });
    }

    this.productService
      ._search(filteredData)
      .subscribe((result: SearchResult) => {
        this.productsList = result.data || [];
        this.totalRecords = result.total || 0;
        this.productService.totalRecords = this.totalRecords;
      });
  }

  refreshProducts(): void {
    this.fetchProducts();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}