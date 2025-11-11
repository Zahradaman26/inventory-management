import { Injectable, PipeTransform } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError, map, of } from 'rxjs';
import { DecimalPipe } from '@angular/common'; 
import { ProductApiResponse, ProductItem, State, SearchResult } from '../interfaces/product.model';
import { SortColumn, SortDirection } from '../products/product-sortable.directive'; 
import { environment } from '../../environments/environment';

const compare = (v1: string | number, v2: string | number) => v1 < v2 ? -1 : v1 > v2 ? 1 : 0;

function sort(products: ProductItem[], column: string, direction: string): ProductItem[] {
  if (direction === '' || column === '') return products;
  return [...products].sort((a: any, b: any) => { 
    const res = compare(a[column]!, b[column]!);
    return direction === 'asc' ? res : -res;
  });
}

function matches(product: ProductItem, term: string, pipe: PipeTransform) {
  return (
    product.name.toLowerCase().includes(term.toLowerCase()) ||
    product.sku.toLowerCase().includes(term.toLowerCase()) ||
    product.category.toLowerCase().includes(term.toLowerCase())
  );
}

@Injectable({ providedIn: 'root' })
export class ProductService {
  
  private readonly PRODUCTS_API_URL = `${environment.apiUrl}/products`; 

  private _state: State = {
    page: 1, pageSize: 10, searchTerm: '', sortColumn: '', sortDirection: '',
    startIndex: 0, endIndex: 9, totalRecords: 0,
  };

  get startIndex() { return this._state.startIndex; }
  get endIndex() { return this._state.endIndex; }
  get page() { return this._state.page; }
  set page(page: number) { this._set({ page }); }
  get pageSize() { return this._state.pageSize; }
  set pageSize(pageSize: number) { this._set({ pageSize }); }
  get searchTerm() { return this._state.searchTerm; }
  set searchTerm(searchTerm: string) { this._set({ searchTerm }); }
  get totalRecords() { return this._state.totalRecords; }
  set totalRecords(totalRecords: number) { this._set({ totalRecords }); }

  constructor(private http: HttpClient, private pipe: DecimalPipe) { }

  private _set(patch: Partial<State>) { 
    Object.assign(this._state, patch); 
  }

  // 🔑 FIXED: Handle the API response structure correctly
  getAllProducts(): Observable<ProductApiResponse> {    
    return this.http.get<any>(this.PRODUCTS_API_URL).pipe(
      map(response => {
        return response;
      }),
      catchError(this.errorHandler)
    );
  }

  getProductById(productId: string): Observable<ProductItem> {
    return this.http.get<any>(`${this.PRODUCTS_API_URL}/${productId}`).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        }
        throw new Error('Product not found');
      }),
      catchError(this.errorHandler)
    );
  }

  addProduct(productData: any): Observable<ProductItem> {
    return this.http.post<any>(this.PRODUCTS_API_URL, productData).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        }
        throw new Error(response.error || 'Failed to add product');
      }),
      catchError(this.errorHandler)
    );
  }

  updateProduct(productId: string, productData: any): Observable<ProductItem> {
    return this.http.put<any>(`${this.PRODUCTS_API_URL}/${productId}`, productData).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        }
        throw new Error(response.error || 'Failed to update product');
      }),
      catchError(this.errorHandler)
    );
  }

  updateProductStatus(productId: string, isActive: boolean): Observable<any> {
    const payload = { isActive };
    
    return this.http.patch<any>(`${this.PRODUCTS_API_URL}/${productId}`, payload).pipe(
      map(response => {
        if (response.success) {
          return response.data || { message: 'Status updated successfully' };
        }
        throw new Error(response.error || 'Failed to update status');
      }),
      catchError(this.errorHandler)
    );
  }

  deleteProduct(productId: string): Observable<any> {
    return this.http.delete<any>(`${this.PRODUCTS_API_URL}/${productId}`).pipe(
      map(response => {
        if (response.success) {
          return response.data || { message: 'Product deleted successfully' };
        }
        throw new Error(response.error || 'Failed to delete product');
      }),
      catchError(this.errorHandler)
    );
  }

  deleteMultipleProducts(productIds: string[]): Observable<any> {
    return this.http.post<any>(`${this.PRODUCTS_API_URL}/bulk-delete`, { productIds }).pipe(
      map(response => {
        if (response.success) {
          return response.data || { message: 'Products deleted successfully' };
        }
        throw new Error(response.error || 'Failed to delete products');
      }),
      catchError(this.errorHandler)
    );
  }

  // 🔑 Local Search/Sort/Paginate Logic
  public _search(productList: Array<ProductItem> = []): Observable<SearchResult> {
    const { sortColumn, sortDirection, pageSize, page, searchTerm } = this._state;

    // 1. Filter products based on search term
    let data = productList.filter((item) => matches(item, searchTerm, this.pipe));
    
    // 2. Sort the filtered products
    data = sort(data, sortColumn, sortDirection);

    // 3. Update total records
    const total = data.length;
    this.totalRecords = total;
    
    // 4. Calculate pagination
    const startIndex = (page - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, total);
    
    // 5. Update state indices (1-based for display)
    this._state.startIndex = total > 0 ? startIndex + 1 : 0;
    this._state.endIndex = total > 0 ? endIndex : 0;

    // 6. Slice for current page
    const paginatedProducts = data.slice(startIndex, endIndex);
    
    return of({ 
        data: paginatedProducts, 
        total: total 
    });
  }

  private errorHandler(error: any) {
    
    let errorMessage = 'An unknown error occurred';
    
    if (typeof error === 'string') {
      errorMessage = error;
    } else if (error.error instanceof ErrorEvent) {
      errorMessage = `Client error: ${error.error.message}`;
    } else if (error.message) {
      errorMessage = error.message;
    } else if (error.error?.message) {
      errorMessage = error.error.message;
    } else {
      errorMessage = `Server Error: ${error.status || 'Unknown'}`;
    }
    
    return throwError(() => errorMessage);
  }
}