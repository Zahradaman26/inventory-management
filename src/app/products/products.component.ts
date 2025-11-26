import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit, QueryList, ViewChildren } from '@angular/core';
import { BreadcrumbComponent } from '../breadcrumb/breadcrumb.component';
import { Router, RouterLink } from '@angular/router';
import { CommonModule, DecimalPipe } from '@angular/common';

import { SearchResult } from '../interfaces/product.model';
import { ProductService } from '../services/product.service';
import { FormsModule } from '@angular/forms';
import { ProductSortableHeader, SortEvent } from './product-sortable.directive';
import { MatPaginatorModule } from '@angular/material/paginator';
import { finalize } from 'rxjs/operators';
import DataTables from 'datatables.net';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [BreadcrumbComponent, RouterLink, CommonModule, ProductSortableHeader, FormsModule, MatPaginatorModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.css'], 
  providers: [DecimalPipe, ProductService]
})
export class ProductsComponent implements OnInit {
  title = 'Products List';
  productsList: any = [];
  backupProductsList: any = [];

  loading: boolean = true;
  error: string | null = null;
  totalRecords: number = 0;
  private dataTable: any;

  selectedProducts: any = [];
  selectedStatus: string = '';

  @ViewChildren(ProductSortableHeader) headers!: QueryList<ProductSortableHeader>;

  constructor(
    public productService: ProductService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.fetchProducts();
  }

  ngAfterViewInit(): void {
    
  }

  fetchProducts(): void {
    this.loading = true;
    this.error = null;

    this.productService.getAllProducts()
      .pipe(finalize(() => { this.loading = false; })) // ensure loading is cleared
      .subscribe({
        next: (response) => {
          // Normalize response.data if present else fallback to response (if API returns array)
          // const dataArray = (response && response.data && Array.isArray(response.data)) ? response.data : (Array.isArray((response as any)) ? (response as any) : []);
          this.productsList = response.data.products || [];
          this.backupProductsList = response.data.products || [];
          // set totalRecords consistently on service so paginator binding works
          const total = (response && response.totalRecords) ?? this.backupProductsList.length;
          this.totalRecords = total;
          this.productService.totalRecords = total;
          // apply filtering/pagination/sort
          // this.filterData(this.backupProductsList);

          setTimeout(() => {
            this.dataTable = new DataTables('#dataTable', {
              paging: true,
              searching: true,
              info: true,
            });
          }, 100);
        },
        error: (err: any) => {
          console.error('Error loading products:', err);
          const errMsg = (typeof err === 'string') ? err : (err?.toString ? err.toString() : 'Failed to load products');
          if (errMsg.includes && errMsg.includes('401')) {
            this.error = 'Authentication required. Please login again.';
            // redirect to login
            setTimeout(() => this.router.navigate(['/sign-in']), 1200);
          } else {
            this.error = `Failed to load products: ${errMsg}`;
          }
        }
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
    const newIsActive = !product.isActive;
    const productId = product._id?.$oid ?? (product as any)._id ?? '';

    this.productService.updateProductStatus(productId, newIsActive).subscribe({
      next: () => {
        const index = this.backupProductsList.findIndex(p => (p._id?.$oid ?? (p as any)._id) === productId);
        if (index > -1) {
          this.backupProductsList[index].isActive = newIsActive;
          this.filterData(this.backupProductsList);
        }
      },
      error: (err: any) => {
        const errMsg = typeof err === 'string' ? err : (err?.toString ? err.toString() : '');
        if (!errMsg.includes('401')) {
          this.error = 'Could not update status. Try again.';
        }
      }
    });
  }

  toggleProductSelection(product: any): void {
    const id = product._id?.$oid ?? (product as any)._id;
    const index = this.selectedProducts.findIndex(p => (p._id?.$oid ?? (p as any)._id) === id);
    if (index > -1) {
      this.selectedProducts.splice(index, 1);
    } else {
      this.selectedProducts.push(product);
    }
  }

  isSelected(product: any): boolean {
    return this.selectedProducts.some(p => (p._id?.$oid ?? (p as any)._id) === (product._id?.$oid ?? (product as any)._id));
  }

  toggleSelectAll(event: any): void {
    if (event.target.checked) {
      this.selectedProducts = [...this.productsList];
    } else {
      this.selectedProducts = [];
    }
  }

  isAllSelected(): boolean {
    return this.selectedProducts.length === this.productsList.length && this.productsList.length > 0;
  }

  viewProduct(product: any): void { /* navigate if needed */ }
  editProduct(product: any): void { /* navigate if needed */ }

  deleteProduct(product: any): void {
    if (!confirm(`Are you sure you want to delete "${product.name}"?`)) return;
    const productId = product._id?.$oid ?? (product as any)._id ?? '';
    this.productService.deleteProduct(productId).subscribe({
      next: () => {
        this.backupProductsList = this.backupProductsList.filter(p => (p._id?.$oid ?? (p as any)._id) !== productId);
        this.filterData(this.backupProductsList);
        this.selectedProducts = this.selectedProducts.filter(p => (p._id?.$oid ?? (p as any)._id) !== productId);
      },
      error: (err: any) => {
        this.error = `Failed to delete product: ${err?.toString ? err.toString() : err}`;
      }
    });
  }

  deleteSelectedProducts(): void {
    if (this.selectedProducts.length === 0) return;
    if (!confirm(`Are you sure you want to delete ${this.selectedProducts.length} products?`)) return;
    const productIds = this.selectedProducts.map(p => p._id?.$oid ?? (p as any)._id);
    this.productService.deleteMultipleProducts(productIds).subscribe({
      next: () => {
        this.backupProductsList = this.backupProductsList.filter(p => !productIds.includes(p._id?.$oid ?? (p as any)._id));
        this.filterData(this.backupProductsList);
        this.selectedProducts = [];
      },
      error: (err: any) => {
        this.error = `Failed to delete products: ${err?.toString ? err.toString() : err}`;
      }
    });
  }

  onStatusFilterChange(status: string): void {
    this.selectedStatus = status;
    this.filterData(this.backupProductsList);
  }

  private filterData(data: any): void {
    let filteredData = data || [];

    if (this.selectedStatus) {
      filteredData = filteredData.filter(product => {
        if (this.selectedStatus === 'active') return product.isActive;
        if (this.selectedStatus === 'inactive') return !product.isActive;
        return true;
      });
    }

    this.productService._search(filteredData).subscribe((result: SearchResult) => {
      this.productsList = result.data || [];
      this.totalRecords = result.total || 0;
      // ensure paginator length is updated
      this.productService.totalRecords = this.totalRecords;
    });
  }

  refreshProducts(): void {
    this.fetchProducts();
  }
}
