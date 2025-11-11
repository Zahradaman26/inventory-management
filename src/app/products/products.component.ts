import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit, QueryList, ViewChildren } from '@angular/core';
import { BreadcrumbComponent } from '../breadcrumb/breadcrumb.component';
import { Router, RouterLink } from '@angular/router';
import { CommonModule, DecimalPipe } from '@angular/common';

import { ProductItem, SearchResult } from '../interfaces/product.model';
import { ProductService } from '../services/product.service';
import { FormsModule } from '@angular/forms';
import { ProductSortableHeader, SortEvent } from './product-sortable.directive';
import { MatPaginator } from '@angular/material/paginator';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [BreadcrumbComponent, RouterLink, CommonModule, ProductSortableHeader, FormsModule, MatPaginator],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './products.component.html',
  styleUrl: './products.component.css',
  providers: [ProductService, DecimalPipe]
})
export class ProductsComponent implements OnInit{
  title = 'Products List';
  productsList: ProductItem[] = []; 
  backupProductsList: ProductItem[] = []; 
  
  loading: boolean = true;
  error: string | null = null;
  totalRecords: number = 0; 

  selectedProducts: ProductItem[] = [];
  selectedStatus: string = '';
  
  @ViewChildren(ProductSortableHeader) headers!: QueryList<ProductSortableHeader>;

  constructor(
    public productService: ProductService,
    private router: Router
  ) {}

  ngOnInit(): void {
  // Debug: Check if token exists
    const token = localStorage.getItem('authToken');
    console.log('Products Page - Token exists:', !!token);
    console.log('Token value:', token);
    
    this.fetchProducts();
  }

  fetchProducts(): void {
    this.loading = true;
    this.error = null;

    console.log("=== fetchProducts started ===");

    this.productService.getAllProducts().subscribe({
        next: (response) => {
            console.log("API Response received:", {
                productsCount: response.products?.length,
                totalRecords: response.totalRecords
            });
            
            this.backupProductsList = response.products || []; 
            this.totalRecords = response.totalRecords || this.backupProductsList.length;
            
            console.log("Backup list set:", this.backupProductsList.length);
            console.log("Calling filterData...");
            
            this.filterData(this.backupProductsList); 
            this.loading = false;
        },
        error: (err: string) => {
            console.error("Products API error:", err);
            
            // Don't show error if it's 401 (handled by interceptor)
            if (err.includes('401')) {
                this.error = 'Authentication required. Redirecting to login...';
            } else {
                this.error = `Failed to load products: ${err}`;
            }
            
            this.loading = false;
        }
    });
  }


  // private filterData(data: ProductItem[]): void {
  //   this.productService._search(data).subscribe((result: SearchResult) => {
  //     this.productsList = result.products;
  //     this.totalRecords = result.total;
  //   });
  // }

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
  
  // 🔑 Status toggle now uses the actual MongoDB '_id.$oid' and 'isActive' status
  updateStatus(product: ProductItem): void {
    const newIsActive = !product.isActive;
    const productId = product._id.$oid;

    this.productService.updateProductStatus(productId, newIsActive).subscribe({
        next: () => {
            // Update the local list state upon success
            const index = this.backupProductsList.findIndex(p => p._id.$oid === productId);
            if (index > -1) {
                this.backupProductsList[index].isActive = newIsActive;
                this.filterData(this.backupProductsList); 
            }
        },
        error: (err: string) => {
            // Don't show error if it's 401
            if (!err.includes('401')) {
                this.error = 'Could not update status. Try again.';
            }
        }
    });
  }

  toggleProductSelection(product: ProductItem): void {
    const index = this.selectedProducts.findIndex(p => p._id.$oid === product._id.$oid);
    if (index > -1) {
      this.selectedProducts.splice(index, 1);
    } else {
      this.selectedProducts.push(product);
    }
  }

  isSelected(product: ProductItem): boolean {
    return this.selectedProducts.some(p => p._id.$oid === product._id.$oid);
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

  // Product Actions
  viewProduct(product: ProductItem): void {
    // Navigate to product details page
    console.log('View product:', product);
    // this.router.navigate(['/products', product._id.$oid]);
  }

  editProduct(product: ProductItem): void {
    // Navigate to edit product page
    console.log('Edit product:', product);
    // this.router.navigate(['/edit-product', product._id.$oid]);
  }

  deleteProduct(product: ProductItem): void {
    if (confirm(`Are you sure you want to delete "${product.name}"?`)) {
      this.productService.deleteProduct(product._id.$oid).subscribe({
        next: () => {
          // Remove from local lists
          this.backupProductsList = this.backupProductsList.filter(p => p._id.$oid !== product._id.$oid);
          this.filterData(this.backupProductsList);
          this.selectedProducts = this.selectedProducts.filter(p => p._id.$oid !== product._id.$oid);
        },
        error: (err: string) => {
          this.error = `Failed to delete product: ${err}`;
        }
      });
    }
  }

  deleteSelectedProducts(): void {
    if (this.selectedProducts.length === 0) return;
    
    if (confirm(`Are you sure you want to delete ${this.selectedProducts.length} products?`)) {
      const productIds = this.selectedProducts.map(p => p._id.$oid);
      
      this.productService.deleteMultipleProducts(productIds).subscribe({
        next: () => {
          // Remove from local lists
          this.backupProductsList = this.backupProductsList.filter(
            p => !productIds.includes(p._id.$oid)
          );
          this.filterData(this.backupProductsList);
          this.selectedProducts = [];
        },
        error: (err: string) => {
          this.error = `Failed to delete products: ${err}`;
        }
      });
    }
  }

  onStatusFilterChange(status: string): void {
    this.selectedStatus = status;
    this.filterData(this.backupProductsList);
  }

  private filterData(data: ProductItem[]): void {
    console.log("=== filterData called ===");
    console.log("Input data length:", data?.length);
    console.log("Selected status:", this.selectedStatus);
    console.log("Current search term:", this.productService.searchTerm);
    
    let filteredData = data || [];
    
    // Apply status filter
    if (this.selectedStatus) {
        const beforeFilter = filteredData.length;
        filteredData = filteredData.filter(product => {
            if (this.selectedStatus === 'active') return product.isActive;
            if (this.selectedStatus === 'inactive') return !product.isActive;
            return true;
        });
        console.log(`Status filter: ${beforeFilter} -> ${filteredData.length} products`);
    }
    
    console.log("Calling _search with filtered data:", filteredData.length);
    
    this.productService._search(filteredData).subscribe((result: SearchResult) => {
        console.log("_search result received:", {
            productsCount: result.products.length,
            total: result.total
        });
        
        this.productsList = result.products;
        this.totalRecords = result.total;
        
        console.log("Component state updated - productsList:", this.productsList.length);
    });
  } 
}
